import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local FIRST — standalone scripts don't get Next.js env loading
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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch { /* .env.local may not exist if env vars are set externally */ }

// Workaround for dev environment self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  // Dynamic imports AFTER env is loaded (module-level code reads process.env)
  const { runConvergencePipeline } = await import('../lib/mcp-ingestion/convergencePipeline');

  // CLI options via env vars
  const maxQuestions = process.env.MAX_QUESTIONS ? parseInt(process.env.MAX_QUESTIONS, 10) : 0;
  const batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 50;
  const concurrency = process.env.CONCURRENCY ? parseInt(process.env.CONCURRENCY, 10) : 3;
  const skipQuality = process.env.SKIP_QUALITY === 'true';

  console.log('--- Multi-LLM Convergence Classification Pipeline ---');
  console.log(`Max questions: ${maxQuestions || 'ALL'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Quality check: ${skipQuality ? 'SKIPPED' : 'ENABLED'}`);
  console.log('');

  const stats = await runConvergencePipeline({
    batchSize,
    concurrency,
    maxQuestions,
    skipQualityCheck: skipQuality,
  });

  console.log('\n--- Pipeline Results ---');
  console.log(`Total processed: ${stats.totalProcessed}`);
  console.log(`Agreed (auto-classified): ${stats.agreed}`);
  console.log(`Soft agreed (needs confirmation): ${stats.softAgreed}`);
  console.log(`Disagreed (conflict): ${stats.disagreed}`);
  console.log(`Approved: ${stats.approved}`);
  console.log(`Needs review: ${stats.needsReview}`);
  console.log(`Conflicted: ${stats.conflicted}`);
  console.log(`Avg quality score: ${stats.averageQualityScore.toFixed(1)}`);
  console.log(`Total LLM calls: ${stats.totalLLMCalls}`);
  console.log(`Duration: ${(stats.totalDurationMs / 1000 / 60).toFixed(1)} minutes`);
  console.log(`Providers: ${stats.providerA} + ${stats.providerB}`);

  setTimeout(() => process.exit(0), 2000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
