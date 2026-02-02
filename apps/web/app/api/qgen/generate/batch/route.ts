/**
 * QGen Batch Generate API Route
 * ==============================
 *
 * POST /api/qgen/generate/batch - Generate multiple questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenGenerationService } from '@/lib/qgen';
import type { QGenBatchRequest, QGenBatchResponse } from '@darwin-education/shared';

export async function POST(request: NextRequest) {
  try {
    const body: QGenBatchRequest = await request.json();

    // Validate required fields
    if (!body.options?.configs || !Array.isArray(body.options.configs)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid configs array in request body' },
        { status: 400 }
      );
    }

    if (body.options.configs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Configs array cannot be empty' },
        { status: 400 }
      );
    }

    if (body.options.configs.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum batch size is 50 questions' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Generate questions in batch
    const batchResult = await qgenGenerationService.generateBatch(body.options);

    // Calculate total cost (sum of individual costs)
    const totalCost = batchResult.questions.reduce((sum, q) => {
      // Estimate cost based on token usage if available, otherwise use default
      return sum + 0.001; // Default cost per question
    }, 0);

    const response: QGenBatchResponse = {
      questions: batchResult.questions,
      totalTimeMs: Date.now() - startTime,
      successCount: batchResult.questions.filter(r => r.question).length,
      failureCount: batchResult.questions.filter(r => !r.question).length,
      totalCost,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('QGen batch generate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
