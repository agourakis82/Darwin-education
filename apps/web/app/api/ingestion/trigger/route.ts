import { NextResponse } from 'next/server';
import { triggerSearchRoutine } from '@/lib/mcp-ingestion/search';
import { runClassificationRoutine } from '@/lib/mcp-ingestion/classifier';
import { runConvergencePipeline } from '@/lib/mcp-ingestion/convergencePipeline';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'full';

    if (mode === 'legacy') {
      // Original behavior: scrape + single-LLM classify in parallel
      Promise.all([
        triggerSearchRoutine(),
        runClassificationRoutine(),
      ]).catch(err => console.error('[Ingestion API Error]', err));
    } else if (mode === 'classify_only') {
      // Multi-LLM convergence classification only (no scraping)
      runConvergencePipeline({
        batchSize: body.batchSize || 50,
        concurrency: body.concurrency || 3,
        maxQuestions: body.maxQuestions || 200,
        skipQualityCheck: false,
      })
        .then(stats => console.log('[Pipeline] Done:', JSON.stringify(stats)))
        .catch(err => console.error('[Pipeline Error]', err));
    } else {
      // Full: scrape first, then convergence pipeline
      triggerSearchRoutine()
        .then(() => runConvergencePipeline({
          batchSize: body.batchSize || 50,
          concurrency: body.concurrency || 3,
          maxQuestions: body.maxQuestions || 0,
          skipQualityCheck: false,
        }))
        .then(stats => console.log('[Pipeline] Done:', JSON.stringify(stats)))
        .catch(err => console.error('[Pipeline Error]', err));
    }

    return NextResponse.json({ message: 'Pipeline triggered in background', mode }, { status: 202 });
  } catch (error: any) {
    console.error('Ingestion trigger failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
