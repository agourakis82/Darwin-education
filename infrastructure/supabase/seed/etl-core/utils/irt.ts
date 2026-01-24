/**
 * IRT Parameter Estimation
 * Metadata-based estimation for question difficulty, discrimination, and confidence
 */

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

export interface IRTEstimationConfig {
  difficulty: {
    baseValue: number;
    minValue: number;
    maxValue: number;
    institutionAdjustment: Record<string, number>;
    yearDriftPerYear: number;
    examTypeAdjustment: Record<string, number>;
    positionMaxAdjustment: number;
    areaAdjustment: Record<string, number>;
  };
  discrimination: {
    baseValue: number;
    minValue: number;
    maxValue: number;
    institutionMultiplier: Record<string, number>;
    examTypeMultiplier: Record<string, number>;
  };
  guessing: {
    optionCountMap: Record<number, number>;
  };
}

/**
 * Default IRT estimation configuration
 */
export const DEFAULT_IRT_ESTIMATION_CONFIG: IRTEstimationConfig = {
  difficulty: {
    baseValue: 0.0,
    minValue: -2.5,
    maxValue: 2.5,
    institutionAdjustment: {
      TIER_1_NATIONAL: 0.4,
      TIER_2_REGIONAL_STRONG: 0.0,
      TIER_3_REGIONAL: -0.25,
    },
    yearDriftPerYear: 0.1,
    examTypeAdjustment: {
      R1: 0.3,
      R2: 0.0,
      R3: -0.1,
      national: 0.2,
      concurso: 0.05,
    },
    positionMaxAdjustment: 0.3,
    areaAdjustment: {
      clinica_medica: 0.0,
      cirurgia: 0.15,
      ginecologia_obstetricia: 0.1,
      pediatria: 0.05,
      saude_coletiva: -0.15,
    },
  },
  discrimination: {
    baseValue: 1.0,
    minValue: 0.7,
    maxValue: 1.4,
    institutionMultiplier: {
      TIER_1_NATIONAL: 1.2,
      TIER_2_REGIONAL_STRONG: 1.05,
      TIER_3_REGIONAL: 0.9,
    },
    examTypeMultiplier: {
      R1: 1.1,
      R2: 1.0,
      R3: 1.0,
      national: 1.15,
      concurso: 1.05,
    },
  },
  guessing: {
    optionCountMap: {
      4: 0.25,
      5: 0.2,
    },
  },
};

/**
 * Estimate IRT parameters from metadata
 */
export function estimateIRTFromMetadata(
  metadata: QuestionMetadata,
  config: IRTEstimationConfig = DEFAULT_IRT_ESTIMATION_CONFIG
): IRTEstimationResult {
  // Difficulty estimation
  const difficultyComponents: Record<string, number> = {};

  let difficulty = config.difficulty.baseValue;

  // Institution adjustment
  const institutionAdj =
    config.difficulty.institutionAdjustment[metadata.institutionTier] ?? 0;
  difficulty += institutionAdj;
  difficultyComponents.institution = institutionAdj;

  // Year drift (relative to 2024)
  const yearsSince2024 = 2024 - metadata.year;
  const yearAdj = yearsSince2024 * config.difficulty.yearDriftPerYear;
  difficulty += yearAdj;
  difficultyComponents.year = yearAdj;

  // Exam type
  const examAdj =
    config.difficulty.examTypeAdjustment[metadata.examType] ?? 0;
  difficulty += examAdj;
  difficultyComponents.examType = examAdj;

  // Position (linear interpolation: Q1=-0.3, middle=0, Q100=+0.3)
  const positionRatio =
    (metadata.questionPosition - 1) /
    (Math.max(metadata.totalQuestionsInExam - 1, 1));
  const positionAdj =
    (positionRatio - 0.5) * 2 * config.difficulty.positionMaxAdjustment;
  difficulty += positionAdj;
  difficultyComponents.position = positionAdj;

  // Area adjustment
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

  // Discrimination estimation
  const discriminationComponents: Record<string, number> = {};

  let discrimination = config.discrimination.baseValue;

  // Institution multiplier
  const instMult =
    config.discrimination.institutionMultiplier[
      metadata.institutionTier
    ] ?? 1.0;
  discrimination *= instMult;
  discriminationComponents.institution = instMult;

  // Exam type multiplier
  const examMult =
    config.discrimination.examTypeMultiplier[metadata.examType] ?? 1.0;
  discrimination *= examMult;
  discriminationComponents.examType = examMult;

  // Clamp to bounds
  discrimination = Math.max(
    config.discrimination.minValue,
    Math.min(config.discrimination.maxValue, discrimination)
  );

  // Guessing (based on option count)
  const guessing =
    config.guessing.optionCountMap[metadata.optionCount] ?? 0.25;

  // Confidence calculation
  let confidence = 0.6; // Base confidence
  if (metadata.institutionTier === 'TIER_1_NATIONAL') {
    confidence = 0.8; // High confidence for national exams
  } else if (metadata.institutionTier === 'TIER_3_REGIONAL') {
    confidence = 0.5; // Lower confidence for small regional exams
  }

  return {
    difficulty,
    discrimination,
    guessing,
    confidence,
    components: { ...difficultyComponents, ...discriminationComponents },
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
  const confStr = irt.confidence ? ` [confidence: ${(irt.confidence * 100).toFixed(0)}%]` : '';
  return `b=${diffStr}, a=${discStr}, c=${guesStr}${confStr}`;
}
