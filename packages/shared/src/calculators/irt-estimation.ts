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
 * Estimate IRT parameters from question metadata (Phase 2)
 *
 * Phase 2 improvements over Phase 1:
 * - Polynomial position model (cubic) replaces linear
 * - Area × Institution interaction terms
 * - Area-specific discrimination multipliers
 * - Position-based discrimination variance (sinusoidal bell curve)
 * - Component-based confidence calculation
 * - Widened bounds: difficulty [-3.5, +3.0], discrimination [0.5, 2.0]
 */
export function estimateIRTFromMetadata(
  metadata: QuestionMetadata
): IRTEstimationResult {
  const config = IRT_ESTIMATION_CONFIG;
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
  const examAdj = config.difficulty.examTypeAdjustment[metadata.examType] ?? 0;
  difficulty += examAdj;
  difficultyComponents.examType = examAdj;

  // 4. Position — polynomial model (Phase 2) with linear fallback
  const pos = metadata.questionPosition;
  const total = metadata.totalQuestionsInExam;
  const positionRatio =
    (pos - 1) / Math.max(total - 1, 1);
  let positionAdj: number;

  if (config.difficulty.positionPolynomial) {
    // Polynomial: f(Δ) = a·Δ + b·Δ² + c·Δ³ where Δ = pos - total/2
    const centeredPos = pos - total / 2;
    const poly = config.difficulty.positionPolynomial;
    positionAdj =
      poly.linear * centeredPos +
      poly.quadratic * centeredPos * centeredPos +
      poly.cubic * centeredPos * centeredPos * centeredPos;
    // Clamp to prevent cubic overshoot on very large exams
    positionAdj = Math.max(-1.5, Math.min(1.5, positionAdj));
  } else {
    // Legacy linear model
    positionAdj =
      (positionRatio - 0.5) * 2 * config.difficulty.positionMaxAdjustment;
  }
  difficulty += positionAdj;
  difficultyComponents.position = positionAdj;

  // 5. Area adjustment
  if (metadata.area) {
    const areaAdj = config.difficulty.areaAdjustment[metadata.area as keyof typeof config.difficulty.areaAdjustment] ?? 0;
    difficulty += areaAdj;
    difficultyComponents.area = areaAdj;
  }

  // 6. Area × Institution interaction (Phase 2)
  if (metadata.area && config.difficulty.areaInstitutionInteraction) {
    const areaInteractions =
      config.difficulty.areaInstitutionInteraction[
        metadata.area as keyof typeof config.difficulty.areaInstitutionInteraction
      ];
    if (areaInteractions) {
      const interactionAdj =
        areaInteractions[metadata.institutionTier as keyof typeof areaInteractions] ?? 0;
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
    config.discrimination.institutionMultiplier[metadata.institutionTier] ??
    1.0;
  discrimination *= instMult;
  discriminationComponents.institution = instMult;

  // 2. Exam type multiplier
  const examMult =
    config.discrimination.examTypeMultiplier[metadata.examType] ?? 1.0;
  discrimination *= examMult;
  discriminationComponents.examType = examMult;

  // 3. Area-specific discrimination multiplier (Phase 2)
  if (metadata.area && config.discrimination.areaDiscrimination) {
    const areaMult =
      config.discrimination.areaDiscrimination[
        metadata.area as keyof typeof config.discrimination.areaDiscrimination
      ] ?? 1.0;
    discrimination *= areaMult;
    discriminationComponents.area = areaMult;
  }

  // 4. Position-based discrimination (Phase 2)
  // Sinusoidal bell curve: peaks at center (posRatio=0.5), troughs at edges
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

  // ── GUESSING PARAMETER ──

  const guessing =
    config.guessing.optionCountMap[metadata.optionCount as keyof typeof config.guessing.optionCountMap] ?? 0.25;

  // ── CONFIDENCE CALCULATION (Phase 2: component-based) ──

  let confidence: number;
  if (config.confidence) {
    const tierKey = metadata.institutionTier as keyof typeof config.confidence.baseConfidence;
    confidence = config.confidence.baseConfidence[tierKey] ?? 0.40;

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
    // Cap — metadata estimation can never match empirical calibration
    confidence = Math.min(0.85, confidence);
  } else {
    // Legacy confidence
    confidence = 0.6;
    if (metadata.institutionTier === 'TIER_1_NATIONAL') {
      confidence = 0.8;
    } else if (metadata.institutionTier === 'TIER_2_REGIONAL_STRONG') {
      confidence = 0.7;
    } else if (metadata.institutionTier === 'TIER_3_REGIONAL') {
      confidence = 0.5;
    }
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
 * Phase 2: wider CI widths to reflect honest uncertainty
 */
export function calculateConfidenceIntervals(
  estimate: IRTEstimationResult
): {
  difficulty: [number, number];
  discrimination: [number, number];
} {
  const diffCIWidth = (1 - estimate.confidence) * 1.5;
  const discCIWidth = (1 - estimate.confidence) * 0.4;

  return {
    difficulty: [
      Math.max(-3.5, estimate.difficulty - diffCIWidth),
      Math.min(3.0, estimate.difficulty + diffCIWidth),
    ],
    discrimination: [
      Math.max(0.5, estimate.discrimination - discCIWidth),
      Math.min(2.0, estimate.discrimination + discCIWidth),
    ],
  };
}
