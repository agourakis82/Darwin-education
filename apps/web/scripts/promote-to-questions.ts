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

const BATCH_SIZE = 200;

// Estimate IRT difficulty bucket from quality score + year
function estimateDifficulty(q: any): string {
  const meta = (() => { try { return JSON.parse(q.curator_notes || '{}'); } catch { return {}; } })();
  const qualityScore: number = meta?.quality?.score ?? 70;
  const convergenceConf: number = Math.max(
    meta?.convergence?.providerA?.confidence ?? 0.8,
    meta?.convergence?.providerB?.confidence ?? 0.8,
  );

  // Use quality score as a rough proxy: harder questions tend to have lower quality scores
  // (shorter stems, ambiguous distractors) — this is a heuristic until IRT calibration
  if (qualityScore >= 85) return 'facil';
  if (qualityScore >= 70) return 'medio';
  if (qualityScore >= 55) return 'dificil';
  return 'muito_dificil';
}

// Estimate IRT b-parameter from difficulty bucket
function estimateIrtDifficulty(difficulty: string): number {
  const map: Record<string, number> = {
    muito_facil: -2.0,
    facil: -1.0,
    medio: 0.0,
    dificil: 1.0,
    muito_dificil: 2.0,
  };
  return map[difficulty] ?? 0.0;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('=== Promote ingested_questions → questions ===\n');

  // ----------------------------------------------------------------
  // 1. Ensure ENARE question bank exists
  // ----------------------------------------------------------------
  let bankId: string;
  const { data: existingBank } = await supabase
    .from('question_banks')
    .select('id')
    .eq('source', 'official_enamed')
    .eq('name', 'ENARE/ENAMED - Banco Oficial')
    .maybeSingle();

  if (existingBank) {
    bankId = existingBank.id;
    console.log(`[Bank] Using existing bank: ${bankId}`);
  } else {
    const { data: newBank, error: bankErr } = await supabase
      .from('question_banks')
      .insert({
        name: 'ENARE/ENAMED - Banco Oficial',
        description: 'Questões oficiais extraídas dos exames ENARE/ENAMED (FGV). Classificadas e curadas por pipeline multi-LLM.',
        source: 'official_enamed',
        year_start: 2010,
        year_end: 2025,
        areas: ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
        is_premium: false,
        is_active: true,
      })
      .select('id')
      .single();

    if (bankErr || !newBank) {
      console.error('Failed to create question bank:', bankErr);
      process.exit(1);
    }
    bankId = newBank.id;
    console.log(`[Bank] Created new bank: ${bankId}`);
  }

  // ----------------------------------------------------------------
  // 2. Promote approved questions in batches
  // ----------------------------------------------------------------
  let offset = 0;
  let totalPromoted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  while (true) {
    // Fetch approved ingested questions not yet promoted (target_question_id is null)
    const { data: batch, error: fetchErr } = await supabase
      .from('ingested_questions')
      .select('*')
      .eq('status', 'approved')
      .is('target_question_id', null)
      .not('area', 'is', null)
      .order('created_at', { ascending: true })
      .range(0, BATCH_SIZE - 1);

    if (fetchErr) { console.error('[Fetch]', fetchErr); break; }
    if (!batch || batch.length === 0) { console.log('\n[Done] No more approved questions to promote.'); break; }

    console.log(`[Batch] Promoting ${batch.length} questions (total so far: ${totalPromoted})...`);

    for (const q of batch) {
      // Skip questions without a valid correct_index (can't satisfy NOT NULL on questions table)
      if (q.correct_index === null || q.correct_index === undefined) {
        totalSkipped++;
        // Mark so we don't keep trying
        await supabase.from('ingested_questions')
          .update({ curator_notes: JSON.stringify({ ...JSON.parse(q.curator_notes || '{}'), skip_reason: 'no_correct_index' }) })
          .eq('id', q.id);
        continue;
      }

      // Skip questions with no area (shouldn't happen, but guard)
      const validAreas = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'];
      if (!validAreas.includes(q.area)) {
        totalSkipped++;
        continue;
      }

      const difficulty = estimateDifficulty(q);
      const irtDifficulty = estimateIrtDifficulty(difficulty);

      // Build the options array — questions table expects {letter, text, feedback}
      const options = (q.options as { letter: string; text: string }[]).map(o => ({
        letter: o.letter,
        text: o.text,
        feedback: '',
      }));

      // Extract topic from tags
      const tags: string[] = q.tags || [];
      const topic = tags[0] || null;
      const subspecialty = tags[1] || null;

      // Extract year from source_url or exam_type
      let year = q.year;
      if (!year && q.source_url) {
        const match = q.source_url.match(/20\d{2}/);
        if (match) year = parseInt(match[0], 10);
      }

      // Insert into questions table
      const { data: promoted, error: insertErr } = await supabase
        .from('questions')
        .insert({
          bank_id: bankId,
          stem: q.stem,
          options,
          correct_index: q.correct_index,
          explanation: '', // Will be enriched later via AI
          area: q.area,
          subspecialty,
          topic,
          year,
          difficulty,
          irt_difficulty: irtDifficulty,
          irt_discrimination: 1.0,  // Default until calibration
          irt_guessing: 0.25,       // Standard 4-option MCQ
          is_ai_generated: false,
          validated_by: 'community',
          reference_list: [],
          icd10_codes: [],
          atc_codes: [],
          times_answered: 0,
          times_correct: 0,
        })
        .select('id')
        .single();

      if (insertErr || !promoted) {
        console.error(`[Error] Failed to promote ${q.id}:`, insertErr?.message);
        totalErrors++;
        continue;
      }

      // Mark ingested_question as promoted
      await supabase
        .from('ingested_questions')
        .update({ target_question_id: promoted.id })
        .eq('id', q.id);

      totalPromoted++;
    }
  }

  // ----------------------------------------------------------------
  // 3. Final summary
  // ----------------------------------------------------------------
  const { count: totalInQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('bank_id', bankId);

  const areaBreakdown: Record<string, number> = {};
  const areas = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'];
  for (const area of areas) {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('bank_id', bankId)
      .eq('area', area);
    areaBreakdown[area] = count || 0;
  }

  console.log('\n=== Promotion Complete ===');
  console.log(`Promoted:       ${totalPromoted}`);
  console.log(`Skipped:        ${totalSkipped} (no correct_index)`);
  console.log(`Errors:         ${totalErrors}`);
  console.log(`\nTotal in questions table (this bank): ${totalInQuestions}`);
  console.log('\nBy area:');
  for (const [area, count] of Object.entries(areaBreakdown)) {
    console.log(`  ${area.padEnd(28)} ${count}`);
  }
  console.log(`\nBank ID: ${bankId}`);
  console.log('Questions are now LIVE in the app.');

  setTimeout(() => process.exit(0), 1000);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
