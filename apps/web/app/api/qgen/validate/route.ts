/**
 * QGen Validation API Route
 * ==========================
 *
 * POST /api/qgen/validate - Run validation pipeline on a question
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenValidationService, medicalVerificationService } from '@/lib/qgen';
import { ValidationStatus, type QGenGeneratedQuestion, type QGenValidationResult } from '@darwin-education/shared';

interface ValidateRequest {
  question: {
    stem: string;
    options: Array<{ text: string; isCorrect?: boolean }>;
    correctAnswerIndex: number;
    explanation?: string;
    area?: string;
    topic?: string;
    bloomLevel?: string;
    targetDifficulty?: number;
  };
  options?: {
    runMedicalVerification?: boolean;
    runOriginality?: boolean;
    runIRTEstimation?: boolean;
  };
}

interface ValidateResponse {
  success: boolean;
  validationResult?: QGenValidationResult;
  medicalVerification?: {
    overallScore: number;
    isAccurate: boolean;
    dangerousPatterns: Array<{ pattern: string; reason: string; severity: string }>;
    outdatedTerms: Array<{ term: string; currentTerm: string }>;
    summary: string;
  };
  recommendation: 'AUTO_APPROVE' | 'PENDING_REVIEW' | 'NEEDS_REVISION' | 'REJECT';
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json();

    // Validate required fields
    if (!body.question) {
      return NextResponse.json(
        { success: false, error: 'Missing question in request body' },
        { status: 400 }
      );
    }

    if (!body.question.stem || !body.question.options) {
      return NextResponse.json(
        { success: false, error: 'Question must have stem and options' },
        { status: 400 }
      );
    }

    // Convert options array to alternatives Record
    const alternatives: Record<string, string> = {};
    const keys = ['A', 'B', 'C', 'D', 'E'];
    body.question.options.forEach((opt, idx) => {
      if (idx < keys.length) {
        alternatives[keys[idx]] = opt.text;
      }
    });
    const correctAnswer = keys[body.question.correctAnswerIndex] || 'A';

    // Convert to QGenGeneratedQuestion format for validation
    const questionForValidation: QGenGeneratedQuestion = {
      id: `temp-${Date.now()}`,
      generationConfigId: null,
      generationTimestamp: new Date().toISOString(),
      stem: body.question.stem,
      alternatives,
      correctAnswer,
      explanation: body.question.explanation ?? null,
      targetArea: body.question.area ?? null,
      targetTopic: body.question.topic ?? null,
      targetDifficulty: body.question.targetDifficulty ?? null,
      targetBloomLevel: (body.question.bloomLevel as QGenGeneratedQuestion['targetBloomLevel']) ?? null,
      generatedFeatures: null,
      validationStatus: ValidationStatus.DRAFT,
      qualityScores: null,
      maxCorpusSimilarity: null,
      mostSimilarCorpusId: null,
      estimatedDifficulty: body.question.targetDifficulty ?? null,
      estimatedDiscrimination: null,
      reviewerId: null,
      reviewTimestamp: null,
      reviewNotes: null,
      reviewScore: null,
      llmModel: null,
      llmPromptVersion: null,
      llmRawResponse: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Run main validation pipeline
    const validationResult = await qgenValidationService.validateQuestion(questionForValidation);

    // Optionally run *additional* medical verification payload (the main pipeline already
    // performs medical checks; this block is only for debugging when explicitly requested).
    let medicalVerification;
    if (body.options?.runMedicalVerification === true) {
      const medResult = await medicalVerificationService.verifyQuestion(
        body.question.stem,
        body.question.options.map(o => o.text),
        body.question.options[body.question.correctAnswerIndex]?.text || '',
        body.question.explanation
      );

      medicalVerification = {
        overallScore: medResult.overallScore,
        isAccurate: medResult.isAccurate,
        dangerousPatterns: medResult.dangerousPatterns.map(p => ({
          pattern: p.pattern,
          reason: p.reason,
          severity: p.severity,
        })),
        outdatedTerms: medResult.outdatedTerms.map(t => ({
          term: t.term,
          currentTerm: t.currentTerm,
        })),
        summary: medResult.summary,
      };
    }

    // Determine final recommendation
    const recommendation = determineRecommendation(
      validationResult.overallScore,
      validationResult.decision,
      medicalVerification
    );

    const response: ValidateResponse = {
      success: true,
      validationResult,
      medicalVerification,
      recommendation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('QGen validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

function determineRecommendation(
  overallScore: number,
  validationDecision: string,
  medicalVerification?: {
    overallScore: number;
    isAccurate: boolean;
    dangerousPatterns: Array<{ pattern: string; reason: string; severity: string }>;
    outdatedTerms: Array<{ term: string; currentTerm: string }>;
    summary: string;
  }
): 'AUTO_APPROVE' | 'PENDING_REVIEW' | 'NEEDS_REVISION' | 'REJECT' {
  // If medical verification found dangerous patterns, reject
  if (medicalVerification?.dangerousPatterns && medicalVerification.dangerousPatterns.length > 0) {
    return 'REJECT';
  }

  // If medical verification says not accurate, needs revision
  if (medicalVerification && !medicalVerification.isAccurate) {
    return 'NEEDS_REVISION';
  }

  // Otherwise, use validation decision
  switch (validationDecision) {
    case 'AUTO_APPROVE':
      return 'AUTO_APPROVE';
    case 'PENDING_REVIEW':
      return 'PENDING_REVIEW';
    case 'NEEDS_REVISION':
      return 'NEEDS_REVISION';
    case 'REJECT':
      return 'REJECT';
    default:
      return overallScore >= 0.85 ? 'AUTO_APPROVE' :
             overallScore >= 0.70 ? 'PENDING_REVIEW' :
             overallScore >= 0.50 ? 'NEEDS_REVISION' : 'REJECT';
  }
}
