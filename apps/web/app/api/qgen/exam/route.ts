/**
 * QGen Exam Generation API Route
 * ================================
 *
 * POST /api/qgen/exam - Generate a full exam with distribution constraints
 */

import { NextRequest, NextResponse } from 'next/server';
import { qgenGenerationService } from '@/lib/qgen';
import { ENAMED_DISTRIBUTION } from '@/lib/qgen';
import { QGenQuestionType, BloomLevel, type QGenGenerationConfig, type ENAMEDArea } from '@darwin-education/shared';

interface ExamGenerationRequest {
  examName: string;
  totalQuestions: number;
  areaDistribution?: Record<string, number>; // Override default ENAMED distribution
  difficultyDistribution?: Record<number, number>; // e.g., { 1: 0.1, 2: 0.2, 3: 0.4, 4: 0.2, 5: 0.1 }
  bloomDistribution?: Record<string, number>;
  requireClinicalCase?: boolean;
  targetTopics?: string[]; // Specific topics to include
  excludeTopics?: string[]; // Topics to exclude
}

interface ExamGenerationResponse {
  success: boolean;
  examId?: string;
  questions?: Array<{
    id: string;
    area: string;
    topic?: string;
    difficulty: number;
    bloomLevel: string;
    question: {
      stem: string;
      options: string[];
      correctAnswer: number;
    };
    validationScore?: number;
  }>;
  metadata?: {
    generatedAt: string;
    totalQuestions: number;
    areaBreakdown: Record<string, number>;
    difficultyBreakdown: Record<number, number>;
    averageValidationScore: number;
    generationDuration_ms: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExamGenerationRequest = await request.json();

    // Validate required fields
    if (!body.examName || !body.totalQuestions) {
      return NextResponse.json(
        { success: false, error: 'Missing examName or totalQuestions' },
        { status: 400 }
      );
    }

    if (body.totalQuestions < 5 || body.totalQuestions > 200) {
      return NextResponse.json(
        { success: false, error: 'totalQuestions must be between 5 and 200' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Use provided distribution or default ENAMED distribution
    const areaDistribution = body.areaDistribution || ENAMED_DISTRIBUTION;

    // Calculate questions per area
    const questionsPerArea: Record<string, number> = {};
    let assignedTotal = 0;

    for (const [area, ratio] of Object.entries(areaDistribution)) {
      const count = Math.round(body.totalQuestions * ratio);
      questionsPerArea[area] = count;
      assignedTotal += count;
    }

    // Adjust for rounding errors
    const areas = Object.keys(questionsPerArea);
    let diff = body.totalQuestions - assignedTotal;
    while (diff !== 0) {
      const areaToAdjust = areas[Math.floor(Math.random() * areas.length)];
      if (diff > 0) {
        questionsPerArea[areaToAdjust]++;
        diff--;
      } else if (questionsPerArea[areaToAdjust] > 0) {
        questionsPerArea[areaToAdjust]--;
        diff++;
      }
    }

    // Default difficulty distribution if not provided
    const difficultyDistribution = body.difficultyDistribution || {
      1: 0.10,  // 10% easy
      2: 0.20,  // 20% easy-medium
      3: 0.40,  // 40% medium
      4: 0.20,  // 20% medium-hard
      5: 0.10,  // 10% hard
    };

    // Build generation configs for each question
    const configs: QGenGenerationConfig[] = [];

    for (const [area, count] of Object.entries(questionsPerArea)) {
      for (let i = 0; i < count; i++) {
        // Determine difficulty for this question
        const difficultyLevel = selectFromDistribution(difficultyDistribution) as 1 | 2 | 3 | 4 | 5;

        // Determine Bloom level
        const bloomLevel = selectBloomForDifficulty(difficultyLevel, body.bloomDistribution);

        const config: QGenGenerationConfig = {
          targetArea: area as ENAMEDArea,
          targetDifficulty: difficultyLevel,
          targetBloomLevel: bloomLevel,
          targetQuestionType: (body.requireClinicalCase ?? (difficultyLevel >= 3))
            ? QGenQuestionType.CLINICAL_CASE
            : undefined,
        };

        // Add target topic if specified
        if (body.targetTopics && body.targetTopics.length > 0) {
          config.targetTopic = body.targetTopics[Math.floor(Math.random() * body.targetTopics.length)];
        }

        configs.push(config);
      }
    }

    // Shuffle configs to mix areas
    shuffleArray(configs);

    // Generate questions
    const batchResult = await qgenGenerationService.generateBatch({
      count: configs.length,
      configs,
      parallelism: 5,
    });

    // Process results
    const questions = batchResult.questions
      .filter(r => r.question)
      .map((r, index) => {
        const q = r.question!;
        // Convert alternatives Record to array
        const optionKeys = Object.keys(q.alternatives).sort();
        const options = optionKeys.map(key => q.alternatives[key]);
        // Find correct answer index
        const correctAnswerIndex = optionKeys.indexOf(q.correctAnswer);

        return {
          id: `exam-${Date.now()}-${index}`,
          area: q.targetArea || 'unknown',
          topic: q.targetTopic ?? undefined,
          difficulty: q.estimatedDifficulty || 3,
          bloomLevel: q.targetBloomLevel || 'APPLICATION',
          question: {
            stem: q.stem,
            options,
            correctAnswer: correctAnswerIndex,
          },
          validationScore: r.validation?.overallScore ?? undefined,
        };
      });

    // Calculate area breakdown
    const areaBreakdown: Record<string, number> = {};
    for (const q of questions) {
      areaBreakdown[q.area] = (areaBreakdown[q.area] || 0) + 1;
    }

    // Calculate difficulty breakdown
    const difficultyBreakdown: Record<number, number> = {};
    for (const q of questions) {
      const diffLevel = Math.round(q.difficulty);
      difficultyBreakdown[diffLevel] = (difficultyBreakdown[diffLevel] || 0) + 1;
    }

    // Calculate average validation score
    const scoresWithValues = questions.filter(q => q.validationScore !== undefined);
    const averageValidationScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, q) => sum + (q.validationScore || 0), 0) / scoresWithValues.length
      : 0;

    const response: ExamGenerationResponse = {
      success: true,
      examId: `exam-${Date.now()}`,
      questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalQuestions: questions.length,
        areaBreakdown,
        difficultyBreakdown,
        averageValidationScore,
        generationDuration_ms: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('QGen exam generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function selectFromDistribution(distribution: Record<number | string, number>): number | string {
  const rand = Math.random();
  let cumulative = 0;

  for (const [value, probability] of Object.entries(distribution)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
    }
  }

  // Return first key as fallback
  return Object.keys(distribution)[0];
}

function selectBloomForDifficulty(
  difficulty: number,
  bloomDistribution?: Record<string, number>
): BloomLevel {
  if (bloomDistribution) {
    return selectFromDistribution(bloomDistribution) as BloomLevel;
  }

  // Default Bloom level based on difficulty
  const bloomByDifficulty: Record<number, BloomLevel[]> = {
    1: [BloomLevel.KNOWLEDGE, BloomLevel.COMPREHENSION],
    2: [BloomLevel.COMPREHENSION, BloomLevel.APPLICATION],
    3: [BloomLevel.APPLICATION, BloomLevel.ANALYSIS],
    4: [BloomLevel.ANALYSIS, BloomLevel.SYNTHESIS],
    5: [BloomLevel.SYNTHESIS, BloomLevel.EVALUATION],
  };

  const options = bloomByDifficulty[difficulty] || ['APPLICATION'];
  return options[Math.floor(Math.random() * options.length)];
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
