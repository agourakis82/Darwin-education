/**
 * QGen Batch Generate API Route
 * ==============================
 *
 * POST /api/qgen/generate/batch - Generate multiple questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenGenerationService } from '@/lib/qgen';
import type { QGenGenerationConfig } from '@darwin-education/shared';
import { hasQGenApiKey, qgenServiceUnavailable } from '@/lib/ai/key-availability';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as any;

    const configs: QGenGenerationConfig[] = Array.isArray(body?.options?.configs)
      ? body.options.configs
      : Array.isArray(body?.configs)
      ? body.configs
      : [];

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid configs array in request body' },
        { status: 400 }
      );
    }

    if (configs.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum batch size is 50 questions' },
        { status: 400 }
      );
    }

    const concurrency = Number(body?.options?.concurrency ?? body?.options?.parallelism ?? 3) || 3;

    if (!hasQGenApiKey()) {
      return qgenServiceUnavailable('de geração em lote via QGen')
    }

    const startTime = Date.now();
    const results: Array<
      | { success: true; question: { id: string; stem: string } }
      | { success: false; error: string }
    > = new Array(configs.length);

    let cursor = 0;
    const worker = async () => {
      while (true) {
        const index = cursor++;
        if (index >= configs.length) return;
        try {
          const resp = await qgenGenerationService.generateQuestion(configs[index]);
          results[index] = {
            success: true,
            question: { id: resp.question.id, stem: resp.question.stem },
          };
        } catch (error) {
          results[index] = {
            success: false,
            error: error instanceof Error ? error.message : 'Internal error',
          };
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, configs.length) }, () => worker());
    await Promise.all(workers);

    const successful = results.filter((r) => r && r.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        duration_ms: Date.now() - startTime,
      },
    });
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
