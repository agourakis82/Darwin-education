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

  // Reset needs_review + pending questions: clear area so convergence pipeline re-processes them
  // Also clear curator_notes so quality check runs fresh
  const { error, count } = await supabase
    .from('ingested_questions')
    .update({ area: null, tags: [], curator_notes: null })
    .in('status', ['needs_review', 'pending'])
    .select('*', { count: 'exact', head: true } as any);

  if (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }

  console.log(`Reset ${count} questions to area=null for reclassification.`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
