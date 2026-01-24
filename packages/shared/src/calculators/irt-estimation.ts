/**
 * IRT Parameter Estimation Calculator
 * Metadata-based heuristics for estimating IRT parameters from exam metadata
 */

import { IRT_ESTIMATION_CONFIG } from '../config/irt-estimation-config';

export interface QuestionMetadata {
  institution: string;
  institutionTier: 'TIER_1_NATIONAL' | 'TIER_2_REGIONAL_STRONG' | 'TIER_3_REGIONAL';
  year: number;
  examType: 'R1' | 'R2' | 'R3' | 'national' | 'concurso';
  questionPosition: number;
  totalQuestionsInExam: number;
  area?: string;
  optionCount: number;
}

export interface IRTEstimationResult {
  difficulty: number;
  discrimination: number;
  guessing: number;
  confidence: number;
  components: Record<string, number>;
  method: 'metadata' | 'expert' | 'empirical';
}

/**
 * Estimate IRT parameters from question metadata
 * Combines multiple heuristics to produce reasonable estimates
 */
export function estimateIRTFromMetadata(
  metadata: QuestionMetadata
): IRTEstimationResult {
  const config = IRT_ESTIMATION_CONFIG;
  const difficultyComponents: Record<string, number> = {};
  const discriminationComponents: Record<string, number> = {};

  // DIFFICULTY ESTIMATION
  let difficulty = config.difficulty.baseValue;

  // 1. Institution adjustment
  const institutionAdj =
    config.difficulty.institutionAdjustment[metadata.institutionTier] ?? 0;
  difficulty += institutionAdj;
  difficultyComponents.institution = institutionAdj;

  // 2. Year drift (relative to 2024)
  const yearsSince2024 = 2024 - metadata.year;
  const yearAdj = yearsSince2024 * config.difficulty.yearDriftPerYear;
  difficulty += yearAdj;
  difficultyComponents.year = yearAdj;

  // 3. Exam type
  const examAdj = config.difficulty.examTypeAdjustment[metadata.examType] ?? 0;
  difficulty += examAdj;
  difficultyComponents.examType = examAdj;

  // 4. Position (linear interpolation: Q1=-0.3, middle=0, Q100=+0.3)
  const positionRatio =
    (metadata.questionPosition - 1) /
    (Math.max(metadata.totalQuestionsInExam - 1, 1));
  const positionAdj =
    (positionRatio - 0.5) * 2 * config.difficulty.positionMaxAdjustment;
  difficulty += positionAdj;
  difficultyComponents.position = positionAdj;

  // 5. Area adjustment
  if (metadata.area) {
    const areaAdj = config.difficulty.areaAdjustment[metadata.area] ?? 0;
    difficulty += areaAdj;
    difficultyComponents.area = areaAdj;
  }

  // Clamp to bounds
  difficulty = Math.max(
    config.difficulty.minValue,
    Math.min(config.difficulty.maxValue, difficulty)
  );

  // DISCRIMINATION ESTIMATION
  let discrimination = config.discrimination.baseValue;

  // 1. Institution multiplier
  const instMult =
    config.discrimination.institutionMultiplier[metadata.institutionTier] ??
    1.0;
  discrimination *= instMult;
  discriminationComponents.institution = instMult;

  // 2. Exam type multiplier
  const examMult =
    config.discrimination.examTypeMultiplier[metadata.examType] ?? 1.0;
  discrimination *= examMult;
  discriminationComponents.examType = examMult;

  // Clamp to bounds
  discrimination = Math.max(
    config.discrimination.minValue,
    Math.min(config.discrimination.maxValue, discrimination)
  );

  // GUESSING PARAMETER
  const guessing =
    config.guessing.optionCountMap[metadata.optionCount] ?? 0.25;

  // CONFIDENCE CALCULATION
  let confidence = 0.6; // Base confidence
  if (metadata.institutionTier === 'TIER_1_NATIONAL') {
    confidence = 0.8; // High confidence for national/prestigious exams
  } else if (metadata.institutionTier === 'TIER_2_REGIONAL_STRONG') {
    confidence = 0.7; // Good confidence for strong regional programs
  } else if (metadata.institutionTier === 'TIER_3_REGIONAL') {
    confidence = 0.5; // Lower confidence for small regional exams
  }

  return {
    difficulty,
    discrimination,
    guessing,
    confidence,
    components: {
      ...difficultyComponents,
      ...discriminationComponents,
    },
    method: 'metadata',
  };
}

/**
 * Validate IRT parameters are within acceptable bounds
 */
export function validateIRTParameters(irt: {
  difficulty: number;
  discrimination: number;
  guessing: number;
}): boolean {
  return (
    irt.difficulty >= -4 &&
    irt.difficulty <= 4 &&
    irt.discrimination >= 0.3 &&
    irt.discrimination <= 2.5 &&
    irt.guessing >= 0.0 &&
    irt.guessing <= 0.5
  );
}

/**
 * Format IRT parameters for display
 */
export function formatIRTParameters(irt: {
  difficulty: number;
  discrimination: number;
  guessing: number;
  confidence?: number;
}): string {
  const diffStr = irt.difficulty.toFixed(3);
  const discStr = irt.discrimination.toFixed(3);
  const guesStr = irt.guessing.toFixed(3);
  const confStr = irt.confidence
    ? ` [confidence: ${(irt.confidence * 100).toFixed(0)}%]`
    : '';
  return `b=${diffStr}, a=${discStr}, c=${guesStr}${confStr}`;
}

/**
 * Calculate confidence intervals for estimated parameters
 * Provides bounds on uncertainty
 */
export function calculateConfidenceIntervals(
  estimate: IRTEstimationResult
): {
  difficulty: [number, number];
  discrimination: [number, number];
} {
  // Conservative confidence intervals based on confidence level
  const ciWidth = (1 - estimate.confidence) * 0.5;

  return {
    difficulty: [
      estimate.difficulty - ciWidth,
      estimate.difficulty + ciWidth,
    ],
    discrimination: [
      Math.max(0.3, estimate.discrimination - ciWidth * 0.3),
      Math.min(2.5, estimate.discrimination + ciWidth * 0.3),
    ],
  };
}
