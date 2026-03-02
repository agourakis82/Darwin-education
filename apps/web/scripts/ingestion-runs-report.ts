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

async function main() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const limit = Number.parseInt(process.env.RUNS_LIMIT || '20', 10);
  const { data: runs, error } = await supabase
    .from('ingestion_runs')
    .select(
      'id,status,links_found,links_allowed,links_review,links_blocked,questions_extracted,error_message,started_at,completed_at'
    )
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch ingestion runs:', error.message);
    process.exit(1);
  }

  if (!runs || runs.length === 0) {
    console.log('No ingestion runs found.');
    process.exit(0);
  }

  console.log('=== Ingestion Runs Report ===');
  console.log(`Showing latest ${runs.length} run(s)\n`);

  for (const run of runs) {
    const started = new Date(run.started_at).toISOString();
    const completed = run.completed_at ? new Date(run.completed_at).toISOString() : '-';
    const allow = run.links_allowed ?? 0;
    const review = run.links_review ?? 0;
    const blocked = run.links_blocked ?? 0;
    const found = run.links_found ?? allow + review + blocked;
    const extracted = run.questions_extracted ?? 0;

    console.log(
      [
        `${started}`,
        `status=${run.status}`,
        `links_found=${found}`,
        `allow=${allow}`,
        `review=${review}`,
        `blocked=${blocked}`,
        `questions_extracted=${extracted}`,
        `completed=${completed}`,
      ].join(' | ')
    );

    if (run.error_message) {
      console.log(`  error: ${run.error_message}`);
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
