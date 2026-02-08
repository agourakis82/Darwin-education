/**
 * Darwin Education - Fractal Clinical Reasoning (FCR) Types
 * =========================================================
 *
 * Types for the Fractal Clinical Reasoning + Confidence Calibration system.
 *
 * The FCR system evaluates clinical reasoning across 4 abstraction levels:
 *   1. Dados (Data)      — Identify key findings from the case
 *   2. Padrão (Pattern)  — Recognize the clinical syndrome/pattern
 *   3. Hipótese (Hypothesis) — Differential diagnosis
 *   4. Conduta (Management) — Correct treatment/management
 *
 * At each level the student also rates their confidence (1-5),
 * producing a 2×2 metacognitive calibration matrix:
 *
 *                     Correct        Wrong
 *   High confidence   Mastery        Illusion of Knowing (LEm)
 *   Low  confidence   Unconscious    Known Unknown
 *                     Competence
 */

import type { ENAMEDArea, DifficultyLevel, IRTParameters } from './education';

// ============================================
// Core Enums / Unions
// ============================================

/** The four fractal levels of clinical reasoning */
export type FCRLevel = 'dados' | 'padrao' | 'hipotese' | 'conduta';

/** Confidence rating (1 = guess, 5 = certain) */
export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

/** Metacognitive calibration quadrant */
export type CalibrationQuadrant =
  | 'mastery'                // correct + high confidence
  | 'illusion_of_knowing'   // wrong + high confidence (DANGEROUS)
  | 'unconscious_competence' // correct + low confidence
  | 'known_unknown';        // wrong + low confidence (safest error)

// ============================================
// Constants
// ============================================

/** All FCR levels in order */
export const FCR_LEVEL_ORDER: FCRLevel[] = [
  'dados',
  'padrao',
  'hipotese',
  'conduta',
];

/** Portuguese labels for each level */
export const FCR_LEVEL_LABELS_PT: Record<FCRLevel, string> = {
  dados: 'Dados',
  padrao: 'Padrão',
  hipotese: 'Hipótese',
  conduta: 'Conduta',
};

/** English labels for each level */
export const FCR_LEVEL_LABELS_EN: Record<FCRLevel, string> = {
  dados: 'Data',
  padrao: 'Pattern',
  hipotese: 'Hypothesis',
  conduta: 'Management',
};

/** Scoring weights per level (must sum to 1.0) */
export const FCR_SCORING_WEIGHTS: Record<FCRLevel, number> = {
  dados: 0.15,
  padrao: 0.25,
  hipotese: 0.35,
  conduta: 0.25,
};

/** Confidence labels in Portuguese */
export const CONFIDENCE_LABELS_PT: Record<ConfidenceRating, string> = {
  1: 'Chute',
  2: 'Inseguro',
  3: 'Moderado',
  4: 'Confiante',
  5: 'Certo',
};

/** Calibration quadrant labels in Portuguese */
export const CALIBRATION_QUADRANT_LABELS_PT: Record<CalibrationQuadrant, string> = {
  mastery: 'Domínio',
  illusion_of_knowing: 'Ilusão de Saber',
  unconscious_competence: 'Competência Inconsciente',
  known_unknown: 'Lacuna Consciente',
};

// ============================================
// Case Definition
// ============================================

/** A multiple-choice option for an FCR level */
export interface FCROption {
  id: string;
  textPt: string;
  isCorrect: boolean;
  explanationPt?: string;
  clinicalPearlPt?: string;
}

/** Structured explanation for FCR case teaching */
export interface FCRExplanation {
  /** Key clinical findings to identify */
  keyFindings: string[];
  /** How to approach this type of case systematically */
  systematicApproach: string;
  /** Common reasoning errors */
  commonMistakes: string[];
  /** How findings connect across levels */
  clinicalCorrelation: string;
  /** References */
  references?: string[];
}

/** An FCR case definition */
export interface FCRCase {
  id: string;
  titlePt: string;
  /** Full clinical presentation text */
  clinicalPresentationPt: string;
  area: ENAMEDArea;
  difficulty: DifficultyLevel;

  /** Per-level options */
  dadosOptions: FCROption[];
  padraoOptions: FCROption[];
  hipoteseOptions: FCROption[];
  condutaOptions: FCROption[];

  /** Correct answers (dados allows multiple) */
  correctDados: string[];
  correctPadrao: string;
  correctHipotese: string;
  correctConduta: string;

  /** Teaching material */
  structuredExplanation?: FCRExplanation;
  irt: IRTParameters;

  isPublic: boolean;
  isAIGenerated: boolean;
  timesAttempted: number;
  timesCompleted: number;
  avgScore?: number;
}

// ============================================
// Attempt / Results
// ============================================

/** A user's attempt at an FCR case */
export interface FCRAttempt {
  id: string;
  caseId: string;
  userId: string;

  /** Selections per level */
  selectedDados: string[];
  selectedPadrao: string | null;
  selectedHipotese: string | null;
  selectedConduta: string | null;

  /** Confidence per level */
  confidenceDados: ConfidenceRating | null;
  confidencePadrao: ConfidenceRating | null;
  confidenceHipotese: ConfidenceRating | null;
  confidenceConduta: ConfidenceRating | null;

  /** Timing per level (ms) */
  stepTimes: Record<FCRLevel, number>;
  totalTimeSeconds: number | null;

  startedAt: Date;
  completedAt: Date | null;
}

/** Per-level result with confidence calibration */
export interface FCRLevelResult {
  level: FCRLevel;
  label: string;
  correct: boolean;
  /** For 'dados' level (multi-select) */
  partialCredit?: number;
  confidence: ConfidenceRating;
  quadrant: CalibrationQuadrant;
  weight: number;
  weightedScore: number;
  timeSpentMs: number;
  /** Text of selected option(s) */
  selectedOptionText?: string;
  /** Text of correct option(s) */
  correctOptionText?: string;
  /** Explanation for incorrect choice */
  selectedExplanation?: string;
  /** Explanation for correct answer */
  correctExplanation?: string;
  /** Clinical pearl for this level */
  clinicalPearl?: string;
}

/** Detected lacuna from FCR pattern analysis */
export interface FCRDetectedLacuna {
  type: 'LE' | 'LEm' | 'LIE';
  level: FCRLevel;
  evidence: string;
}

/** Complete FCR score */
export interface FCRScore {
  theta: number;
  standardError: number;
  scaledScore: number;
  passed: boolean;
  totalScore: number;
  percentageCorrect: number;
  levelResults: FCRLevelResult[];
  /** Brier-score based calibration (0-100, higher = better calibrated) */
  calibrationScore: number;
  /** Overconfidence index: +high = overconfident, -low = underconfident, ~0 = calibrated */
  overconfidenceIndex: number;
  detectedLacunas: FCRDetectedLacuna[];
  insights: string[];
}

// ============================================
// SOTA: Bayesian Calibration Model
// ============================================

/** Per-confidence-bin statistics for Beta-Binomial model */
export interface ConfidenceBinStats {
  confidence: ConfidenceRating;
  /** Beta distribution alpha (correct count + prior) */
  alpha: number;
  /** Beta distribution beta (incorrect count + prior) */
  beta: number;
  /** Expected accuracy P(correct | confidence=k) = alpha / (alpha + beta) */
  expectedAccuracy: number;
  /** Total observations in this bin */
  totalObservations: number;
}

/** Reliability diagram data point (for calibration curve visualization) */
export interface ReliabilityPoint {
  /** Bin midpoint (expected confidence as probability) */
  binMidpoint: number;
  /** Observed accuracy in this bin */
  observedAccuracy: number;
  /** Count of observations in this bin */
  count: number;
  /** Standard error of observed accuracy */
  standardError: number;
}

/** Full Bayesian calibration diagnostics */
export interface FCRCalibrationDiagnostics {
  /** Expected Calibration Error (ML standard, lower = better) */
  ece: number;
  /** Maximum Calibration Error (worst bin) */
  mce: number;
  /** Per-bin Beta-Binomial posteriors */
  confidenceBins: ConfidenceBinStats[];
  /** Reliability diagram data for visualization */
  reliabilityDiagram: ReliabilityPoint[];
  /** Dunning-Kruger index: correlation between overconfidence and low ability */
  dunningKrugerIndex: number;
  /** Dunning-Kruger zone: 'high_risk' | 'moderate' | 'low_risk' | 'inverse' */
  dunningKrugerZone: DunningKrugerZone;
  /** Calibration drift: change in calibration over last N sessions */
  calibrationDrift: number;
  /** Whether calibration is improving over time */
  calibrationTrending: 'improving' | 'stable' | 'degrading';
}

export type DunningKrugerZone =
  | 'high_risk'   // low ability + high confidence (peak of Mt. Stupid)
  | 'moderate'    // some miscalibration but not extreme
  | 'low_risk'    // well-calibrated
  | 'inverse';    // high ability + low confidence (Valley of Despair)

// ============================================
// SOTA: Cross-Level Cascade Analysis
// ============================================

/** Transition probability between levels */
export interface LevelTransition {
  fromLevel: FCRLevel;
  toLevel: FCRLevel;
  /** P(wrong at toLevel | wrong at fromLevel) */
  pErrorGivenError: number;
  /** P(wrong at toLevel | correct at fromLevel) */
  pErrorGivenCorrect: number;
  /** Lift: how much more likely to err given prior error */
  cascadeLift: number;
  /** Number of observations */
  observations: number;
}

/** Complete cascade analysis for a user */
export interface FCRCascadeAnalysis {
  /** 4×4 transition matrix (conditional error probabilities) */
  transitions: LevelTransition[];
  /** Whether errors cascade (propagate) through levels */
  hasCascadePattern: boolean;
  /** Strongest cascade path (e.g., dados→padrao has lift 3.2) */
  strongestCascade: LevelTransition | null;
  /** Independent error rate (errors NOT caused by prior-level errors) */
  independentErrorRate: number;
  /** Cascade severity score (0-1, higher = more cascading) */
  cascadeSeverity: number;
  /** Per-level error rates */
  levelErrorRates: Record<FCRLevel, number>;
  /** Reasoning profile */
  reasoningProfile: FCRReasoningProfile;
}

/** How the student reasons across levels */
export type FCRReasoningProfile =
  | 'sequential'    // errors propagate strongly (fix foundation first)
  | 'parallel'      // errors are independent (gaps in multiple areas)
  | 'bottleneck'    // errors concentrate at one level
  | 'robust';       // few errors, good reasoning chain

// ============================================
// SOTA: Adaptive Case Selection
// ============================================

/** Recommendation for next FCR case */
export interface FCRAdaptiveRecommendation {
  /** Recommended case ID */
  caseId: string;
  /** Why this case was selected */
  selectionReason: FCRSelectionReason;
  /** Expected information gain from this case */
  expectedInformationGain: number;
  /** Target level(s) this case is designed to probe */
  targetLevels: FCRLevel[];
  /** Target calibration bins (confidence levels to probe) */
  targetCalibrationBins: ConfidenceRating[];
  /** Expected difficulty match (0-1, higher = better match) */
  difficultyMatch: number;
  /** Confidence in this recommendation (0-1) */
  confidence: number;
}

export type FCRSelectionReason =
  | 'max_information'       // Standard MFI: most informative at current theta
  | 'calibration_probe'     // Targets miscalibrated confidence bin
  | 'cascade_probe'         // Targets weak cascade transition
  | 'area_coverage'         // Covers underrepresented area
  | 'dunning_kruger_probe'  // Probes suspected DK zone
  | 'difficulty_ladder';    // Slight difficulty increase for growth

/** Historical attempt summary (for adaptive selection) */
export interface FCRAttemptSummary {
  caseId: string;
  area: ENAMEDArea;
  difficulty: DifficultyLevel;
  theta: number;
  calibrationScore: number;
  overconfidenceIndex: number;
  levelResults: {
    level: FCRLevel;
    correct: boolean;
    confidence: ConfidenceRating;
    quadrant: CalibrationQuadrant;
  }[];
  completedAt: Date;
}
