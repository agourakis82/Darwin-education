import { createClient } from '@supabase/supabase-js';
import {
  selectProviderPair,
  getRateLimitDelay,
  type LLMProvider,
} from './llmProviders';
import { callWithRetry } from './extractor';
import type {
  IngestedQuestion,
  ClassificationLLMResult,
  QualityLLMResult,
  ConvergenceResult,
  ConvergenceMetadata,
  PipelineStats,
  ENAMEDAreaClassification,
} from './types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const VALID_AREAS: ENAMEDAreaClassification[] = [
  'clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva',
];

// ============================================================
// Convergence Algorithm
// ============================================================

function resolveClassification(
  resultA: ClassificationLLMResult,
  resultB: ClassificationLLMResult,
): ConvergenceResult {
  const base = {
    finalTags: [...new Set([...resultA.tags, ...resultB.tags])].slice(0, 5),
    providerA: { name: resultA.model, area: resultA.area, confidence: resultA.confidence, model: resultA.model },
    providerB: { name: resultB.model, area: resultB.area, confidence: resultB.confidence, model: resultB.model },
  };

  // CASE 1: Perfect agreement on a valid area
  if (resultA.area === resultB.area && resultA.area !== 'unknown') {
    return {
      ...base,
      finalArea: resultA.area,
      convergenceStatus: 'agreed',
      confidenceScore: (resultA.confidence + resultB.confidence) / 2,
    };
  }

  // CASE 2: One unknown, other confident
  if (resultA.area === 'unknown' && resultB.area !== 'unknown' && resultB.confidence >= 0.8) {
    return {
      ...base,
      finalArea: resultB.area,
      convergenceStatus: 'soft_agree',
      confidenceScore: resultB.confidence * 0.8,
    };
  }
  if (resultB.area === 'unknown' && resultA.area !== 'unknown' && resultA.confidence >= 0.8) {
    return {
      ...base,
      finalArea: resultA.area,
      convergenceStatus: 'soft_agree',
      confidenceScore: resultA.confidence * 0.8,
    };
  }

  // CASE 3: Both give real areas but disagree — tie-break by confidence gap
  const confidenceDelta = Math.abs(resultA.confidence - resultB.confidence);
  if (confidenceDelta >= 0.2 && resultA.area !== 'unknown' && resultB.area !== 'unknown') {
    const winner = resultA.confidence > resultB.confidence ? resultA : resultB;
    return {
      ...base,
      finalArea: winner.area as ENAMEDAreaClassification,
      convergenceStatus: 'soft_agree',
      confidenceScore: winner.confidence * 0.7,
    };
  }

  // CASE 4: True disagreement
  return {
    ...base,
    finalArea: 'unknown',
    convergenceStatus: 'disagreed',
    confidenceScore: 0,
  };
}

function determineFinalStatus(
  convergence: ConvergenceResult,
  qualityResult: QualityLLMResult | null,
): IngestedQuestion['status'] {
  if (convergence.convergenceStatus === 'disagreed') {
    return 'conflict';
  }

  const qualityScore = qualityResult?.qualityScore ?? 70; // default if skipped
  const hasCritical = qualityResult?.issues.some(i => i.severity === 'critical') ?? false;

  if (hasCritical) return 'needs_review';

  if (convergence.convergenceStatus === 'agreed') {
    return qualityScore >= 60 ? 'approved' : 'needs_review';
  }

  // soft_agree
  return qualityScore >= 60 ? 'pending' : 'needs_review';
}

// ============================================================
// Single Question Processing
// ============================================================

async function processOneQuestion(
  question: IngestedQuestion,
  providerA: LLMProvider,
  providerB: LLMProvider,
  skipQualityCheck: boolean,
): Promise<{
  status: IngestedQuestion['status'];
  convergenceStatus: ConvergenceResult['convergenceStatus'];
  qualityScore: number;
  llmCalls: number;
}> {
  let llmCalls = 0;

  // Phase 1: Parallel classification from both providers
  const [settledA, settledB] = await Promise.allSettled([
    callWithRetry(() => providerA.classify(question)),
    callWithRetry(() => providerB.classify(question)),
  ]);
  llmCalls += 2;

  let convergence: ConvergenceResult;

  if (settledA.status === 'fulfilled' && settledB.status === 'fulfilled') {
    convergence = resolveClassification(settledA.value, settledB.value);
  } else if (settledA.status === 'fulfilled') {
    // Single-provider fallback
    const result = settledA.value;
    convergence = {
      finalArea: result.area === 'unknown' ? 'unknown' : result.area,
      finalTags: result.tags,
      convergenceStatus: 'soft_agree',
      confidenceScore: result.confidence * 0.6,
      providerA: { name: result.model, area: result.area, confidence: result.confidence, model: result.model },
      providerB: { name: 'failed', area: 'unknown', confidence: 0, model: 'failed' },
    };
  } else if (settledB.status === 'fulfilled') {
    const result = settledB.value;
    convergence = {
      finalArea: result.area === 'unknown' ? 'unknown' : result.area,
      finalTags: result.tags,
      convergenceStatus: 'soft_agree',
      confidenceScore: result.confidence * 0.6,
      providerA: { name: 'failed', area: 'unknown', confidence: 0, model: 'failed' },
      providerB: { name: result.model, area: result.area, confidence: result.confidence, model: result.model },
    };
  } else {
    // Both failed — skip this question entirely
    console.error(`[Pipeline] Both providers failed for ${question.id}`);
    return { status: 'pending', convergenceStatus: 'disagreed', qualityScore: 0, llmCalls };
  }

  // Phase 3: Quality check (only if classification converged)
  let qualityResult: QualityLLMResult | null = null;
  if (convergence.convergenceStatus !== 'disagreed' && !skipQualityCheck) {
    try {
      qualityResult = await callWithRetry(() => providerA.qualityCheck(question));
      convergence.qualityResult = qualityResult;
      llmCalls++;
    } catch (err) {
      console.error(`[Pipeline] Quality check failed for ${question.id}:`, err);
    }
  }

  // Determine final status
  const finalStatus = determineFinalStatus(convergence, qualityResult);

  // Build curator_notes JSON
  const metadata: ConvergenceMetadata = {
    convergence: {
      providerA: {
        name: convergence.providerA.name,
        area: convergence.providerA.area,
        confidence: convergence.providerA.confidence,
      },
      providerB: {
        name: convergence.providerB.name,
        area: convergence.providerB.area,
        confidence: convergence.providerB.confidence,
      },
      status: convergence.convergenceStatus,
    },
    quality: qualityResult ? {
      score: qualityResult.qualityScore,
      issues: qualityResult.issues,
      model: qualityResult.model,
    } : null,
    pipeline_version: '1.0',
    processed_at: new Date().toISOString(),
  };

  // Update DB
  await getSupabase()
    .from('ingested_questions')
    .update({
      area: convergence.finalArea === 'unknown' ? null : convergence.finalArea,
      tags: convergence.finalTags,
      status: finalStatus,
      curator_notes: JSON.stringify(metadata),
    })
    .eq('id', question.id);

  return {
    status: finalStatus,
    convergenceStatus: convergence.convergenceStatus,
    qualityScore: qualityResult?.qualityScore ?? -1,
    llmCalls,
  };
}

// ============================================================
// Batch Orchestration
// ============================================================

export interface PipelineOptions {
  batchSize?: number;
  concurrency?: number;
  maxQuestions?: number;
  skipQualityCheck?: boolean;
  dryRun?: boolean;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function runConvergencePipeline(options: PipelineOptions = {}): Promise<PipelineStats> {
  const {
    batchSize = 50,
    concurrency = 3,
    maxQuestions = 0,
    skipQualityCheck = false,
  } = options;

  const startTime = Date.now();
  const [providerA, providerB] = selectProviderPair();
  const delayMs = getRateLimitDelay(providerA, providerB);

  const stats: PipelineStats = {
    totalProcessed: 0,
    agreed: 0,
    softAgreed: 0,
    disagreed: 0,
    approved: 0,
    needsReview: 0,
    conflicted: 0,
    averageQualityScore: 0,
    totalLLMCalls: 0,
    totalDurationMs: 0,
    providerA: providerA.name,
    providerB: providerB.name,
  };

  let qualityScoreSum = 0;
  let qualityScoreCount = 0;
  let batchNum = 0;

  while (true) {
    // Fetch next batch of unclassified questions (always offset 0 — processed ones drop out of the filter)
    const { data: questions, error } = await getSupabase()
      .from('ingested_questions')
      .select('*')
      .is('area', null)
      .in('status', ['pending', 'needs_review'])
      .order('created_at', { ascending: true })
      .range(0, batchSize - 1);

    if (error) {
      console.error('[Pipeline] DB fetch error:', error);
      break;
    }
    if (!questions || questions.length === 0) {
      console.log('[Pipeline] No more unclassified questions.');
      break;
    }

    batchNum++;
    console.log(`[Pipeline] Batch ${batchNum}: ${questions.length} questions (total so far: ${stats.totalProcessed})`);

    // Process in parallel with bounded concurrency
    const chunks = chunkArray(questions as IngestedQuestion[], concurrency);

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(q => processOneQuestion(q, providerA, providerB, skipQualityCheck))
      );

      for (const r of results) {
        stats.totalProcessed++;
        stats.totalLLMCalls += r.llmCalls;

        switch (r.convergenceStatus) {
          case 'agreed': stats.agreed++; break;
          case 'soft_agree': stats.softAgreed++; break;
          case 'disagreed': stats.disagreed++; break;
        }
        switch (r.status) {
          case 'approved': stats.approved++; break;
          case 'needs_review': stats.needsReview++; break;
          case 'conflict': stats.conflicted++; break;
        }

        if (r.qualityScore >= 0) {
          qualityScoreSum += r.qualityScore;
          qualityScoreCount++;
        }
      }

      // Rate limiting between concurrency chunks
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Check if we've hit maxQuestions limit
    if (maxQuestions > 0 && stats.totalProcessed >= maxQuestions) {
      console.log(`[Pipeline] Reached max questions limit (${maxQuestions}).`);
      break;
    }

    // Don't increment page — already-classified questions won't appear again
    // But if the batch was full, there may be more
    if (questions.length < batchSize) break;
  }

  stats.totalDurationMs = Date.now() - startTime;
  stats.averageQualityScore = qualityScoreCount > 0
    ? qualityScoreSum / qualityScoreCount
    : 0;

  console.log(`[Pipeline] Complete. ${stats.totalProcessed} questions processed in ${(stats.totalDurationMs / 1000 / 60).toFixed(1)} minutes.`);
  console.log(`[Pipeline] Agreed: ${stats.agreed} | Soft: ${stats.softAgreed} | Conflict: ${stats.disagreed}`);
  console.log(`[Pipeline] Approved: ${stats.approved} | Needs review: ${stats.needsReview} | Avg quality: ${stats.averageQualityScore.toFixed(1)}`);

  return stats;
}
