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
  // Dynamic imports AFTER env is loaded (module-level code in these files reads process.env)
  const { createClient } = await import('@supabase/supabase-js');
  const { extractQuestionsFromDocument, parseGabaritoPdf, matchAnswersToQuestions } = await import('../lib/mcp-ingestion/extractor');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const BASE_URL = 'https://mapa-vagas-enare-ebserh.conhecimento.fgv.br';
  const INDEX_URL = `${BASE_URL}/provas-gabaritos-medica.html`;
  const INTER_PDF_DELAY_MS = 3000;

  console.log('--- Starting Bulk Ingestion Script ---');

  // 1. Create an ingestion run
  const { data: run, error: runError } = await supabase
    .from('ingestion_runs')
    .insert({
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (runError || !run) {
    console.error('Failed to create ingestion run:', runError);
    process.exit(1);
  }

  const runId = run.id;
  console.log(`Created Run ID: ${runId}`);

  // 2. Fetch the index page to scrape PDF links
  console.log(`Fetching index page: ${INDEX_URL}`);
  const response = await fetch(INDEX_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  if (!response.ok) {
    console.error(`Failed to fetch index page. Status: ${response.status}`);
    await supabase.from('ingestion_runs').update({ status: 'failed', error_message: `HTTP ${response.status}`, completed_at: new Date().toISOString() }).eq('id', runId);
    process.exit(1);
  }

  const html = await response.text();

  // Extract ALL PDF links
  const regex = /href="([^"]+\.pdf)"/gi;
  let match;
  const pdfLinks = new Set<string>();

  while ((match = regex.exec(html)) !== null) {
    let link = match[1];
    if (link.startsWith('http')) {
      pdfLinks.add(link);
    } else {
      const parts = link.split('/');
      const encodedLink = parts.map(part => encodeURIComponent(part)).join('/');
      pdfLinks.add(`${BASE_URL}/${encodedLink}`);
    }
  }

  // 3. Separate into exam PDFs and gabarito PDFs
  const examLinks: string[] = [];
  const gabaritoLinks: string[] = [];

  for (const link of pdfLinks) {
    // Check FILENAME only — the path contains "provas-gabaritos" for all PDFs
    const filename = decodeURIComponent(link.split('/').pop() || '').toLowerCase();
    if (filename.includes('gabarito')) {
      gabaritoLinks.push(link);
    } else {
      examLinks.push(link);
    }
  }

  console.log(`Found ${examLinks.length} exam PDFs and ${gabaritoLinks.length} gabarito PDFs.`);

  // 4. Parse gabaritos FIRST → build combined answer map
  // Process "definitivo" last so it takes priority over "preliminar"
  const sortedGabaritos = gabaritoLinks.sort((a, b) => {
    const aIsDef = decodeURIComponent(a).toLowerCase().includes('definitivo') ? 1 : 0;
    const bIsDef = decodeURIComponent(b).toLowerCase().includes('definitivo') ? 1 : 0;
    return aIsDef - bIsDef;
  });

  const combinedAnswers = new Map<number, number>();
  for (const gabUrl of sortedGabaritos) {
    const answers = await parseGabaritoPdf(gabUrl);
    for (const [num, idx] of answers) {
      combinedAnswers.set(num, idx);
    }
  }
  console.log(`[Gabarito] Total answers parsed: ${combinedAnswers.size}`);

  // 5. Check which URLs have already been processed (resumability)
  const { data: existing } = await supabase
    .from('ingested_questions')
    .select('source_url');

  const processedUrls = new Set(existing?.map((e: any) => e.source_url) || []);
  let remainingExams = examLinks.filter(url => !processedUrls.has(url));

  // Optionally limit for testing
  const MAX_DOCS = process.env.MAX_DOCS ? parseInt(process.env.MAX_DOCS, 10) : 0;
  if (MAX_DOCS > 0) {
    remainingExams = remainingExams.slice(0, MAX_DOCS);
  }

  console.log(`${remainingExams.length} exam PDFs to process (${examLinks.length - remainingExams.length} already processed).`);

  if (remainingExams.length === 0) {
    console.log('No new PDFs to process. Exiting.');
    await supabase.from('ingestion_runs').update({ status: 'completed', completed_at: new Date().toISOString(), questions_extracted: 0 }).eq('id', runId);
    process.exit(0);
  }

  // 6. Process PDFs one at a time (avoid API overload)
  let totalExtracted = 0;

  for (let i = 0; i < remainingExams.length; i++) {
    const url = remainingExams[i];
    console.log(`\n--- [${i + 1}/${remainingExams.length}] ${decodeURIComponent(url.split('/').pop() || url)} ---`);

    try {
      const questions = await extractQuestionsFromDocument(url, runId);

      // Match gabarito answers before inserting
      if (combinedAnswers.size > 0) {
        matchAnswersToQuestions(questions, combinedAnswers);
      }

      let insertedCount = 0;
      for (const q of questions) {
        const { error } = await supabase
          .from('ingested_questions')
          .insert(q);

        if (error) {
          console.error(`[Batch] DB Insert Error:`, error.message);
        } else {
          insertedCount++;
        }
      }

      totalExtracted += insertedCount;
      console.log(`[Batch] Inserted ${insertedCount} questions (total: ${totalExtracted}).`);

      // Update run progress
      await supabase
        .from('ingestion_runs')
        .update({ questions_extracted: totalExtracted })
        .eq('id', runId);
    } catch (err) {
      console.error(`[Batch] Failed to process ${url}:`, err);
    }

    // Rate-limit between PDFs
    if (i < remainingExams.length - 1) {
      console.log(`[Batch] Waiting ${INTER_PDF_DELAY_MS / 1000}s before next PDF...`);
      await new Promise(resolve => setTimeout(resolve, INTER_PDF_DELAY_MS));
    }
  }

  // 7. Finalize the run
  await supabase
    .from('ingestion_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      questions_extracted: totalExtracted,
      links_found: remainingExams.length
    })
    .eq('id', runId);

  console.log(`\n--- Bulk Ingestion Complete ---`);
  console.log(`Total questions extracted and saved: ${totalExtracted}`);

  setTimeout(() => process.exit(0), 2000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
