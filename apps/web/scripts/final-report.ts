import { readFileSync } from 'fs';
import { resolve } from 'path';

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Overall counts
  const { count: total } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true });
  const { count: approved } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'approved');
  const { count: needsReview } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'needs_review');
  const { count: conflict } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'conflict');
  const { count: pending } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: withAnswer } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).not('correct_index', 'is', null);

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   FINAL INGESTION & CURATION REPORT             ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║ Total Questions:        ${String(total).padStart(5)}                  ║`);
  console.log(`║ With Answer Key:        ${String(withAnswer).padStart(5)}                  ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║ Approved:               ${String(approved).padStart(5)}  (${((approved||0)/(total||1)*100).toFixed(1)}%)          ║`);
  console.log(`║ Needs Review:           ${String(needsReview).padStart(5)}  (${((needsReview||0)/(total||1)*100).toFixed(1)}%)          ║`);
  console.log(`║ Conflict:               ${String(conflict).padStart(5)}  (${((conflict||0)/(total||1)*100).toFixed(1)}%)           ║`);
  console.log(`║ Pending:                ${String(pending).padStart(5)}  (${((pending||0)/(total||1)*100).toFixed(1)}%)           ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║ BY AREA                                         ║');
  console.log('╠══════════════════════════════════════════════════╣');

  const areas = [
    { key: 'clinica_medica', label: 'Clínica Médica' },
    { key: 'cirurgia', label: 'Cirurgia' },
    { key: 'ginecologia_obstetricia', label: 'Gineco/Obstetrícia' },
    { key: 'pediatria', label: 'Pediatria' },
    { key: 'saude_coletiva', label: 'Saúde Coletiva' },
  ];

  for (const area of areas) {
    const { count: areaTotal } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('area', area.key);
    const { count: areaApproved } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('area', area.key).eq('status', 'approved');
    const pct = ((areaTotal || 0) / (total || 1) * 100).toFixed(1);
    console.log(`║ ${area.label.padEnd(22)} ${String(areaTotal).padStart(5)} (${pct}%) [${areaApproved} approved] ║`);
  }

  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║ CONVERGENCE STATS                               ║');
  console.log('╠══════════════════════════════════════════════════╣');

  // Sample convergence metadata
  const { data: sample } = await supabase
    .from('ingested_questions')
    .select('curator_notes')
    .not('curator_notes', 'is', null)
    .limit(500);

  let agreed = 0, softAgree = 0, disagreed = 0, resolved = 0;
  let qualityScores: number[] = [];

  for (const row of (sample || [])) {
    try {
      const meta = JSON.parse(row.curator_notes);
      if (meta.convergence?.status === 'agreed') agreed++;
      else if (meta.convergence?.status === 'soft_agree') softAgree++;
      else if (meta.convergence?.status === 'disagreed') disagreed++;
      if (meta.tiebreaker?.result === 'resolved') resolved++;
      if (meta.quality?.score) qualityScores.push(meta.quality.score);
    } catch {}
  }

  const sampleSize = sample?.length || 0;
  console.log(`║ (sample of ${sampleSize} questions)                      ║`);
  console.log(`║ Agreed:      ${String(agreed).padStart(5)}  (${(agreed/sampleSize*100).toFixed(1)}%)                   ║`);
  console.log(`║ Soft Agree:  ${String(softAgree).padStart(5)}  (${(softAgree/sampleSize*100).toFixed(1)}%)                   ║`);
  console.log(`║ Disagreed:   ${String(disagreed).padStart(5)}  (${(disagreed/sampleSize*100).toFixed(1)}%)                   ║`);
  if (resolved > 0) {
    console.log(`║ Resolved:    ${String(resolved).padStart(5)}  (tiebreaker)              ║`);
  }
  if (qualityScores.length > 0) {
    const avg = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    console.log(`║ Avg Quality: ${avg.toFixed(1)}/100 (${qualityScores.length} scored)        ║`);
  }

  console.log('╚══════════════════════════════════════════════════╝');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
