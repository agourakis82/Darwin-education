/**
 * QGen Generate API Route
 * =======================
 *
 * POST /api/qgen/generate - Generate a single question
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenGenerationService } from '@/lib/qgen';
import type { QGenGenerateRequest } from '@darwin-education/shared';

export async function POST(request: NextRequest) {
  try {
    const body: QGenGenerateRequest = await request.json();

    // Validate required fields
    if (!body.config) {
      return NextResponse.json(
        { success: false, error: 'Missing config in request body' },
        { status: 400 }
      );
    }

    // Generate question (service returns QGenGenerateResponse with question and validation)
    const response = await qgenGenerationService.generateQuestion(body.config);

    if (!response.question) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate question' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('QGen generate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
