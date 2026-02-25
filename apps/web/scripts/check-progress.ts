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

  const { count: total } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true });
  const { count: approved } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'approved');
  const { count: pending } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: needsReview } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'needs_review');
  const { count: conflict } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'conflict');
  const { count: rejected } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
  const { count: classified } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).not('area', 'is', null);
  const { count: withAnswer } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).not('correct_index', 'is', null);

  console.log('');
  console.log('=== FINAL INGESTION & CURATION REPORT ===');
  console.log(`Total questions:         ${total}`);
  console.log(`Classified (area set):   ${classified}`);
  console.log(`With correct answer:     ${withAnswer}`);
  console.log('');
  console.log('--- Status Breakdown ---');
  console.log(`  Approved:              ${approved}`);
  console.log(`  Pending:               ${pending}`);
  console.log(`  Needs review:          ${needsReview}`);
  console.log(`  Conflict:              ${conflict}`);
  console.log(`  Rejected:              ${rejected}`);
  console.log('');
  console.log('--- By Area ---');

  const areas = [
    { key: 'clinica_medica', label: 'Clinica Medica' },
    { key: 'cirurgia', label: 'Cirurgia' },
    { key: 'ginecologia_obstetricia', label: 'Gineco-Obstetricia' },
    { key: 'pediatria', label: 'Pediatria' },
    { key: 'saude_coletiva', label: 'Saude Coletiva' },
  ];

  for (const area of areas) {
    const { count: areaTotal } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('area', area.key);
    const { count: areaApproved } = await supabase.from('ingested_questions').select('*', { count: 'exact', head: true }).eq('area', area.key).eq('status', 'approved');
    console.log(`  ${area.label.padEnd(24)} ${String(areaTotal).padStart(5)} total (${String(areaApproved).padStart(4)} approved)`);
  }

  console.log('');
  console.log('--- Rates ---');
  const classRate = total ? ((classified || 0) / total * 100).toFixed(1) : '0';
  const approveRate = total ? ((approved || 0) / total * 100).toFixed(1) : '0';
  const answerRate = total ? ((withAnswer || 0) / total * 100).toFixed(1) : '0';
  console.log(`  Classification:        ${classRate}%`);
  console.log(`  Approval:              ${approveRate}%`);
  console.log(`  Answer key matched:    ${answerRate}%`);
  console.log('');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
