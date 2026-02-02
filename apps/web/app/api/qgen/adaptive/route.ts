/**
 * QGen Adaptive Generation API Route
 * ====================================
 *
 * POST /api/qgen/adaptive - Generate DDL-adaptive question based on learner gap
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenGenerationService, ddlIntegrationService } from '@/lib/qgen';
import type { StudentProfile } from '@/lib/qgen';
import type { ClassificationResult } from '@/lib/ddl/types';
import type { QGenAdaptiveResponse } from '@darwin-education/shared';

/**
 * Extended request body type for adaptive generation
 */
interface AdaptiveRequestBody {
  studentId: string;
  ddlClassification: {
    primary_type: string;
    primary_confidence: string;
    lacunaType?: string;
    confidence?: number;
    weakConcepts?: string[];
  };
  studentProfile?: StudentProfile;
  currentTheta?: number;
  preferences?: {
    targetArea?: string;
    targetTopic?: string;
    difficultyOverride?: number;
    excludeQuestionIds?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AdaptiveRequestBody = await request.json();

    // Validate required fields
    if (!body.ddlClassification) {
      return NextResponse.json(
        { success: false, error: 'Missing ddlClassification in request body' },
        { status: 400 }
      );
    }

    // Build student profile from available data
    const studentProfile: StudentProfile = body.studentProfile || {
      userId: body.studentId,
      currentTheta: body.currentTheta || 0,
      recentPerformance: [],
      learningHistory: {
        questionsAttempted: 0,
        averageScore: 0,
        weakAreas: body.ddlClassification.weakConcepts || [],
        strongAreas: [],
      },
    };

    // Map DDL classification to the expected format
    const classificationResult: ClassificationResult = {
      primary_type: (body.ddlClassification.primary_type || body.ddlClassification.lacunaType || 'NONE') as ClassificationResult['primary_type'],
      primary_confidence: (body.ddlClassification.primary_confidence || 'MEDIUM') as ClassificationResult['primary_confidence'],
      primary_probability: body.ddlClassification.confidence || 0.5,
      probabilities: {
        LE: 0.2,
        LEm: 0.2,
        LIE: 0.2,
        MIXED: 0.2,
        NONE: 0.2,
      },
      supporting_evidence: {
        for_primary: [],
      },
    };

    // Map DDL classification to QGen parameters
    const mapping = await ddlIntegrationService.generateAdaptiveQuestion(
      classificationResult,
      studentProfile,
      {
        area: body.preferences?.targetArea,
        topic: body.preferences?.targetTopic,
        avoidQuestionIds: body.preferences?.excludeQuestionIds,
      }
    );

    // Build full generation config
    const config = {
      ...mapping.config,
      // Override with any explicit preferences
      ...(body.preferences?.targetArea && { targetArea: body.preferences.targetArea }),
      ...(body.preferences?.targetTopic && { targetTopic: body.preferences.targetTopic }),
      ...(body.preferences?.difficultyOverride && { targetDifficulty: body.preferences.difficultyOverride }),
    };

    // Generate the question
    const generationResult = await qgenGenerationService.generateQuestion(config as Parameters<typeof qgenGenerationService.generateQuestion>[0]);

    if (!generationResult || !generationResult.question) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate adaptive question' },
        { status: 500 }
      );
    }

    const response: QGenAdaptiveResponse = {
      ...generationResult,
      adaptiveRationale: mapping.rationale,
      targetedMisconceptions: mapping.distractorParams.targetMisconceptionTypes,
      expectedLearningOutcome: `Address ${body.ddlClassification.primary_type || 'learning'} gaps through targeted practice`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('QGen adaptive generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
