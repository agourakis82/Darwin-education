/**
 * IRT Parameter Estimation (ETL copy)
 * Metadata-based estimation for question difficulty, discrimination, and confidence
 *
 * IMPORTANT: This is a duplicate of packages/shared/src/calculators/irt-estimation.ts
 * Any changes to the estimation algorithm MUST be synchronized.
 * Phase 2 implemented: polynomial position, area interactions, area discrimination,
 * position discrimination, component-based confidence.
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
    positionPolynomial?: {
      linear: number;
      quadratic: number;
      cubic: number;
    };
    areaInstitutionInteraction?: Record<string, Record<string, number>>;
  };
  discrimination: {
    baseValue: number;
    minValue: number;
    maxValue: number;
    institutionMultiplier: Record<string, number>;
    examTypeMultiplier: Record<string, number>;
    areaDiscrimination?: Record<string, number>;
    positionDiscrimination?: {
      centerBoost: number;
      edgePenalty: number;
    };
  };
  guessing: {
    optionCountMap: Record<number, number>;
  };
  confidence?: {
    baseConfidence: Record<string, number>;
    areaKnownBonus: number;
    interactionTermBonus: number;
    polynomialPositionBonus: number;
    modelVersionBonus: number;
  };
}

/**
 * Default IRT estimation configuration (Phase 2)
 */
export const DEFAULT_IRT_ESTIMATION_CONFIG: IRTEstimationConfig = {
  difficulty: {
    baseValue: 0.0,
    minValue: -3.5,
    maxValue: 3.0,
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
      clinica_medica: 0.12,
      cirurgia: 0.34,
      ginecologia_obstetricia: 0.21,
      pediatria: 0.08,
      saude_coletiva: -0.15,
    },
    positionPolynomial: {
      linear: 0.015,
      quadratic: 0.0002,
      cubic: -0.000003,
    },
    areaInstitutionInteraction: {
      clinica_medica: {
        TIER_1_NATIONAL: 0.10,
        TIER_2_REGIONAL_STRONG: 0.0,
        TIER_3_REGIONAL: -0.05,
      },
      cirurgia: {
        TIER_1_NATIONAL: 0.20,
        TIER_2_REGIONAL_STRONG: 0.05,
        TIER_3_REGIONAL: -0.10,
      },
      ginecologia_obstetricia: {
        TIER_1_NATIONAL: 0.08,
        TIER_2_REGIONAL_STRONG: 0.0,
        TIER_3_REGIONAL: -0.05,
      },
      pediatria: {
        TIER_1_NATIONAL: 0.12,
        TIER_2_REGIONAL_STRONG: 0.0,
        TIER_3_REGIONAL: -0.08,
      },
      saude_coletiva: {
        TIER_1_NATIONAL: -0.05,
        TIER_2_REGIONAL_STRONG: 0.0,
        TIER_3_REGIONAL: 0.05,
      },
    },
  },
  discrimination: {
    baseValue: 1.0,
    minValue: 0.5,
    maxValue: 2.0,
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
    areaDiscrimination: {
      clinica_medica: 1.15,
      cirurgia: 1.22,
      ginecologia_obstetricia: 1.08,
      pediatria: 1.18,
      saude_coletiva: 0.95,
    },
    positionDiscrimination: {
      centerBoost: 0.15,
      edgePenalty: -0.10,
    },
  },
  guessing: {
    optionCountMap: {
      4: 0.25,
      5: 0.2,
    },
  },
  confidence: {
    baseConfidence: {
      TIER_1_NATIONAL: 0.55,
      TIER_2_REGIONAL_STRONG: 0.50,
      TIER_3_REGIONAL: 0.40,
    },
    areaKnownBonus: 0.05,
    interactionTermBonus: 0.05,
    polynomialPositionBonus: 0.05,
    modelVersionBonus: 0.10,
  },
};

/**
 * Estimate IRT parameters from metadata (Phase 2)
 */
export function estimateIRTFromMetadata(
  metadata: QuestionMetadata,
  config: IRTEstimationConfig = DEFAULT_IRT_ESTIMATION_CONFIG
): IRTEstimationResult {
  const difficultyComponents: Record<string, number> = {};
  const discriminationComponents: Record<string, number> = {};

  // ── DIFFICULTY ESTIMATION ──

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
  const examAdj =
    config.difficulty.examTypeAdjustment[metadata.examType] ?? 0;
  difficulty += examAdj;
  difficultyComponents.examType = examAdj;

  // 4. Position — polynomial (Phase 2) with linear fallback
  const pos = metadata.questionPosition;
  const total = metadata.totalQuestionsInExam;
  const positionRatio =
    (pos - 1) / Math.max(total - 1, 1);
  let positionAdj: number;

  if (config.difficulty.positionPolynomial) {
    const centeredPos = pos - total / 2;
    const poly = config.difficulty.positionPolynomial;
    positionAdj =
      poly.linear * centeredPos +
      poly.quadratic * centeredPos * centeredPos +
      poly.cubic * centeredPos * centeredPos * centeredPos;
    positionAdj = Math.max(-1.5, Math.min(1.5, positionAdj));
  } else {
    positionAdj =
      (positionRatio - 0.5) * 2 * config.difficulty.positionMaxAdjustment;
  }
  difficulty += positionAdj;
  difficultyComponents.position = positionAdj;

  // 5. Area adjustment
  if (metadata.area) {
    const areaAdj = config.difficulty.areaAdjustment[metadata.area] ?? 0;
    difficulty += areaAdj;
    difficultyComponents.area = areaAdj;
  }

  // 6. Area × Institution interaction (Phase 2)
  if (metadata.area && config.difficulty.areaInstitutionInteraction) {
    const areaInteractions =
      config.difficulty.areaInstitutionInteraction[metadata.area];
    if (areaInteractions) {
      const interactionAdj =
        areaInteractions[metadata.institutionTier] ?? 0;
      difficulty += interactionAdj;
      difficultyComponents.areaInstitutionInteraction = interactionAdj;
    }
  }

  // Clamp to bounds
  difficulty = Math.max(
    config.difficulty.minValue,
    Math.min(config.difficulty.maxValue, difficulty)
  );

  // ── DISCRIMINATION ESTIMATION ──

  let discrimination = config.discrimination.baseValue;

  // 1. Institution multiplier
  const instMult =
    config.discrimination.institutionMultiplier[metadata.institutionTier] ?? 1.0;
  discrimination *= instMult;
  discriminationComponents.institution = instMult;

  // 2. Exam type multiplier
  const examMult =
    config.discrimination.examTypeMultiplier[metadata.examType] ?? 1.0;
  discrimination *= examMult;
  discriminationComponents.examType = examMult;

  // 3. Area-specific discrimination (Phase 2)
  if (metadata.area && config.discrimination.areaDiscrimination) {
    const areaMult =
      config.discrimination.areaDiscrimination[metadata.area] ?? 1.0;
    discrimination *= areaMult;
    discriminationComponents.area = areaMult;
  }

  // 4. Position-based discrimination (Phase 2)
  if (config.discrimination.positionDiscrimination) {
    const { centerBoost, edgePenalty } = config.discrimination.positionDiscrimination;
    const posDiscAdj =
      edgePenalty + (centerBoost - edgePenalty) * Math.sin(positionRatio * Math.PI);
    discrimination += posDiscAdj;
    discriminationComponents.position = posDiscAdj;
  }

  // Clamp to bounds
  discrimination = Math.max(
    config.discrimination.minValue,
    Math.min(config.discrimination.maxValue, discrimination)
  );

  // Guessing
  const guessing =
    config.guessing.optionCountMap[metadata.optionCount] ?? 0.25;

  // ── CONFIDENCE (Phase 2: component-based) ──

  let confidence: number;
  if (config.confidence) {
    confidence = config.confidence.baseConfidence[metadata.institutionTier] ?? 0.40;
    if (metadata.area) {
      confidence += config.confidence.areaKnownBonus;
    }
    if (config.difficulty.areaInstitutionInteraction && metadata.area) {
      confidence += config.confidence.interactionTermBonus;
    }
    if (config.difficulty.positionPolynomial) {
      confidence += config.confidence.polynomialPositionBonus;
    }
    confidence += config.confidence.modelVersionBonus;
    confidence = Math.min(0.85, confidence);
  } else {
    confidence = 0.6;
    if (metadata.institutionTier === 'TIER_1_NATIONAL') {
      confidence = 0.8;
    } else if (metadata.institutionTier === 'TIER_3_REGIONAL') {
      confidence = 0.5;
    }
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
