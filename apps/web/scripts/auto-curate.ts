import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local FIRST
const envPath = resolve(__dirname, '../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const { selectProviderPair } = await import('../lib/mcp-ingestion/llmProviders');
  const { callWithRetry } = await import('../lib/mcp-ingestion/extractor');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const BATCH_SIZE = 100;
  const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);
  const mode = process.env.MODE || 'full'; // 'full' | 'quality_only' | 'resolve_conflicts'

  console.log('--- Auto-Curation Pipeline ---');
  console.log(`Mode: ${mode}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log('');

  let [providerA] = selectProviderPair();

  // ============================================================
  // Phase 1: Quality check for classified questions without quality data
  // ============================================================
  if (mode === 'full' || mode === 'quality_only') {
    console.log('=== Phase 1: Quality Checks ===');

    // Fetch questions that are classified but have no quality score in curator_notes
    // These are questions from the fast classification pass (SKIP_QUALITY=true)
    let qualityProcessed = 0;
    let qualityApproved = 0;
    let qualityNeedsReview = 0;

    while (true) {
      const { data: questions, error } = await supabase
        .from('ingested_questions')
        .select('*')
        .not('area', 'is', null)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: true })
        .range(0, BATCH_SIZE - 1);

      if (error || !questions || questions.length === 0) break;

      // Filter to those needing quality check
      const needsQuality = questions.filter(q => {
        if (!q.curator_notes) return true;
        try {
          const meta = JSON.parse(q.curator_notes);
          return !meta.quality; // No quality data yet
        } catch { return true; }
      });

      if (needsQuality.length === 0) break;

      console.log(`[Quality] Processing ${needsQuality.length} questions...`);

      // Process in chunks
      for (let i = 0; i < needsQuality.length; i += CONCURRENCY) {
        const chunk = needsQuality.slice(i, i + CONCURRENCY);

        const results = await Promise.allSettled(
          chunk.map(async (q: any) => {
            const qualityResult = await callWithRetry(() => providerA.qualityCheck(q));
            return { id: q.id, curatorNotes: q.curator_notes, quality: qualityResult };
          })
        );

        for (const r of results) {
          if (r.status !== 'fulfilled') continue;
          const { id, curatorNotes, quality } = r.value;

          // Merge quality into existing curator_notes
          let meta: any = {};
          try { meta = curatorNotes ? JSON.parse(curatorNotes) : {}; } catch {}
          meta.quality = {
            score: quality.qualityScore,
            issues: quality.issues,
            model: quality.model,
          };

          // Determine new status based on convergence + quality
          const convergenceStatus = meta.convergence?.status || 'agreed';
          const hasCritical = quality.issues.some((i: any) => i.severity === 'critical');
          let newStatus: string;

          if (hasCritical || quality.qualityScore < 40) {
            newStatus = 'needs_review';
            qualityNeedsReview++;
          } else if (convergenceStatus === 'agreed' && quality.qualityScore >= 60) {
            newStatus = 'approved';
            qualityApproved++;
          } else if (convergenceStatus === 'soft_agree' && quality.qualityScore >= 70) {
            newStatus = 'approved';
            qualityApproved++;
          } else {
            newStatus = 'needs_review';
            qualityNeedsReview++;
          }

          await supabase
            .from('ingested_questions')
            .update({
              status: newStatus,
              curator_notes: JSON.stringify(meta),
            })
            .eq('id', id);

          qualityProcessed++;
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[Quality] Processed: ${qualityProcessed} | Approved: ${qualityApproved} | Needs review: ${qualityNeedsReview}`);
    }

    console.log(`\n[Quality] Done. ${qualityProcessed} checked, ${qualityApproved} approved, ${qualityNeedsReview} need review.`);
  }

  // ============================================================
  // Phase 2: Resolve conflicts using tiebreaker
  // ============================================================
  if (mode === 'full' || mode === 'resolve_conflicts') {
    console.log('\n=== Phase 2: Resolve Conflicts ===');

    const { data: conflicts, error: conflictError } = await supabase
      .from('ingested_questions')
      .select('*')
      .eq('status', 'conflict')
      .order('created_at', { ascending: true });

    if (conflictError || !conflicts || conflicts.length === 0) {
      console.log('[Conflicts] No conflicts to resolve.');
    } else {
      console.log(`[Conflicts] ${conflicts.length} conflicts to resolve with tiebreaker...`);

      let resolved = 0;
      let stillConflicted = 0;

      for (let i = 0; i < conflicts.length; i += CONCURRENCY) {
        const chunk = conflicts.slice(i, i + CONCURRENCY);

        const results = await Promise.allSettled(
          chunk.map(async (q: any) => {
            // Use the provider as a tiebreaker with a more explicit prompt
            const result = await callWithRetry(() => providerA.classify(q));
            return { id: q.id, curatorNotes: q.curator_notes, tiebreaker: result };
          })
        );

        for (const r of results) {
          if (r.status !== 'fulfilled') {
            stillConflicted++;
            continue;
          }

          const { id, curatorNotes, tiebreaker } = r.value;

          if (tiebreaker.area === 'unknown' || tiebreaker.confidence < 0.7) {
            stillConflicted++;
            // Update notes but keep conflict status
            let meta: any = {};
            try { meta = curatorNotes ? JSON.parse(curatorNotes) : {}; } catch {}
            meta.tiebreaker = {
              area: tiebreaker.area,
              confidence: tiebreaker.confidence,
              model: tiebreaker.model,
              result: 'unresolved',
            };
            await supabase
              .from('ingested_questions')
              .update({ curator_notes: JSON.stringify(meta) })
              .eq('id', id);
            continue;
          }

          // Tiebreaker resolved
          let meta: any = {};
          try { meta = curatorNotes ? JSON.parse(curatorNotes) : {}; } catch {}
          meta.tiebreaker = {
            area: tiebreaker.area,
            confidence: tiebreaker.confidence,
            model: tiebreaker.model,
            result: 'resolved',
          };

          await supabase
            .from('ingested_questions')
            .update({
              area: tiebreaker.area,
              tags: tiebreaker.tags,
              status: 'needs_review', // Resolved conflicts go to needs_review, not auto-approved
              curator_notes: JSON.stringify(meta),
            })
            .eq('id', id);

          resolved++;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[Conflicts] Resolved: ${resolved} | Still conflicted: ${stillConflicted}`);
    }
  }

  // ============================================================
  // Phase 3: Auto-approve high-quality needs_review questions
  // ============================================================
  if (mode === 'full') {
    console.log('\n=== Phase 3: Auto-Approve High-Quality Reviews ===');

    const { data: reviews, error: reviewError } = await supabase
      .from('ingested_questions')
      .select('*')
      .eq('status', 'needs_review')
      .not('area', 'is', null);

    if (reviewError || !reviews || reviews.length === 0) {
      console.log('[Auto-Approve] No needs_review questions to process.');
    } else {
      let autoApproved = 0;
      let kept = 0;

      for (const q of reviews) {
        let meta: any = {};
        try { meta = q.curator_notes ? JSON.parse(q.curator_notes) : {}; } catch {}

        const convergenceStatus = meta.convergence?.status;
        const qualityScore = meta.quality?.score ?? 0;
        const hasCritical = (meta.quality?.issues || []).some((i: any) => i.severity === 'critical');
        const hasCorrectAnswer = q.correct_index !== null;

        // Auto-approve criteria:
        // - Both LLMs agreed on area
        // - Quality score >= 50 (relaxed from 60 since human review would catch issues)
        // - No critical issues
        // - Has a correct answer from gabarito
        // - Stem is at least 50 chars (not truncated)
        const stemOk = (q.stem?.length || 0) >= 50;
        const optionsOk = (q.options?.length || 0) >= 4;

        if (
          convergenceStatus === 'agreed' &&
          qualityScore >= 50 &&
          !hasCritical &&
          hasCorrectAnswer &&
          stemOk &&
          optionsOk
        ) {
          meta.auto_approved = true;
          meta.auto_approved_at = new Date().toISOString();

          await supabase
            .from('ingested_questions')
            .update({
              status: 'approved',
              curator_notes: JSON.stringify(meta),
            })
            .eq('id', q.id);

          autoApproved++;
        } else {
          kept++;
        }
      }

      console.log(`[Auto-Approve] Approved: ${autoApproved} | Kept as needs_review: ${kept}`);
    }
  }

  // ============================================================
  // Final Summary
  // ============================================================
  console.log('\n=== Final Summary ===');

  const { count: total } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true });
  const { count: approved } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'approved');
  const { count: needsReview } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'needs_review');
  const { count: conflict } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'conflict');
  const { count: pending } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: rejected } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
  const { count: classified } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).not('area', 'is', null);

  // Area breakdown
  const areas = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'];
  console.log(`\nTotal: ${total}`);
  console.log(`Classified: ${classified}`);
  console.log(`\nBy Status:`);
  console.log(`  Approved: ${approved}`);
  console.log(`  Pending: ${pending}`);
  console.log(`  Needs review: ${needsReview}`);
  console.log(`  Conflict: ${conflict}`);
  console.log(`  Rejected: ${rejected}`);

  console.log(`\nBy Area:`);
  for (const area of areas) {
    const { count } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('area', area);
    console.log(`  ${area}: ${count}`);
  }

  setTimeout(() => process.exit(0), 2000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
