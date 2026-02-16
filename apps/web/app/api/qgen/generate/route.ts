/**
 * QGen Generate API Route
 * =======================
 *
 * POST /api/qgen/generate - Generate a single question
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenGenerationService } from '@/lib/qgen';
import type { QGenGenerateRequest, QGenGeneratedQuestion, QGenValidationResult } from '@darwin-education/shared';
import { hasQGenApiKey, qgenServiceUnavailable } from '@/lib/ai/key-availability';

function toUiQuestion(question: QGenGeneratedQuestion) {
  const letters = ['A', 'B', 'C', 'D', 'E']
  const options = letters
    .filter((letter) => Boolean(question.alternatives?.[letter]))
    .map((letter) => ({
      text: question.alternatives[letter],
      isCorrect: letter === question.correctAnswer,
    }))

  const correctAnswerIndex = Math.max(
    0,
    options.findIndex((opt) => opt.isCorrect)
  )

  return {
    id: question.id,
    stem: question.stem,
    options,
    correctAnswerIndex,
    explanation: question.explanation || undefined,
    area: question.targetArea || undefined,
    topic: question.targetTopic || undefined,
    bloomLevel: question.targetBloomLevel || undefined,
    irt_parameters: {
      estimated_difficulty: question.estimatedDifficulty ?? 0,
      estimated_discrimination: question.estimatedDiscrimination ?? 1,
      estimated_guessing: 0.25,
    },
  }
}

function toUiValidation(validation: QGenValidationResult) {
  const stageEntries = Object.entries(validation.stages || {})
  const stageResults: Record<string, { score: number; passed: boolean; flags: string[] }> = {}

  for (const [stageName, stage] of stageEntries) {
    stageResults[stageName] = {
      score: stage.score,
      passed: stage.passed,
      flags: (stage.issues || []).map((issue) => issue.message).slice(0, 6),
    }
  }

  return {
    overallScore: validation.overallScore,
    decision: validation.decision,
    stageResults,
  }
}

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

    if (!hasQGenApiKey()) {
      return qgenServiceUnavailable('de geração de questões via QGen')
    }

    // Generate question (service returns QGenGenerateResponse with question and validation)
    const response = await qgenGenerationService.generateQuestion(body.config);

    if (!response.question) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate question' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      question: toUiQuestion(response.question),
      validationResult: toUiValidation(response.validation),
      meta: {
        generationTimeMs: response.generationTimeMs,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
      },
    });
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
