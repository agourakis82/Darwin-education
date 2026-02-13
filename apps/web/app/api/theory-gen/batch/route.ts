/**
 * API Endpoint: POST /api/theory-gen/batch
 *
 * Batch generates multiple theory topics with concurrency control and cost tracking
 *
 * Request body:
 * {
 *   "topics": [
 *     {
 *       "source": "darwin-mfc" | "manual",
 *       "sourceId": "disease-id",
 *       "topicTitle": "Topic Title",
 *       "area": "clinica_medica",
 *       "targetDifficulty": "intermediario"
 *     }
 *   ],
 *   "concurrency": 3,
 *   "costLimit": 10.00
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { BatchGenerationRequest } from '@darwin-education/shared';
import GenerationService from '@/lib/theory-gen/services/generation-service';
import { costCalculator } from '@/lib/theory-gen/utils/cost-calculator';
import { hasGrokCompatibleApiKey, grokServiceUnavailable } from '@/lib/ai/key-availability';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const batchRequest: BatchGenerationRequest = {
      topics: body.topics || [],
      concurrency: body.concurrency || 3,
      costLimit: body.costLimit,
      autoApproveThreshold: body.autoApproveThreshold || 0.90,
    };

    if (!batchRequest.topics || batchRequest.topics.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum tópico foi informado' },
        { status: 400 }
      );
    }

    if (!hasGrokCompatibleApiKey()) {
      return grokServiceUnavailable('de geração em lote de teoria')
    }

    // Estimate cost
    const estimatedCost = costCalculator.estimateBatch(
      batchRequest.topics.length,
      true
    );

    if (batchRequest.costLimit && estimatedCost.total > batchRequest.costLimit) {
      return NextResponse.json(
        {
          error: 'Limite de custo excedido',
          estimatedCost: estimatedCost.total,
          limit: batchRequest.costLimit,
        },
        { status: 400 }
      );
    }

    // Initialize generation service
    const generationService = new GenerationService();

    // Generate batch
    const topics = await generationService.generateBatch(batchRequest);

    return NextResponse.json({
      success: true,
      totalRequested: batchRequest.topics.length,
      totalGenerated: topics.length,
      topics,
      estimatedCost: estimatedCost.total,
      autoApprovedCount: topics.filter(
        (t) => t.generationMetadata.validationScore >= 0.90
      ).length,
      requiresReviewCount: topics.filter(
        (t) =>
          t.generationMetadata.validationScore >= 0.70 &&
          t.generationMetadata.validationScore < 0.90
      ).length,
      failedCount: batchRequest.topics.length - topics.length,
    });
  } catch (error) {
    console.error('Error in batch generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/theory-gen/batch - Get batch generation status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to start batch generation',
    endpoint: 'POST /api/theory-gen/batch',
    example: {
      topics: [
        {
          source: 'manual',
          topicTitle: 'Hipertensão Arterial',
          area: 'clinica_medica',
        },
      ],
      concurrency: 3,
      costLimit: 5.0,
    },
  });
}
