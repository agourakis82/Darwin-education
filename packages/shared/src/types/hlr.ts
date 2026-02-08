/**
 * Darwin Education - Half-Life Regression (HLR) Types
 * ====================================================
 *
 * Personalized forgetting curve model using feature-based regression.
 * Complements FSRS by using explicit features (history, lag, difficulty)
 * to predict per-item half-lives.
 *
 * Reference: Settles, B. & Meeder, B. (2016). A trainable spaced
 * repetition model for language learning. ACL.
 *
 * Model:
 *   Half-life:  h = 2^(w · x)   (feature-weighted)
 *   Retention:  P = 2^(-delta/h) (exponential decay)
 *     where delta = time elapsed since last review
 *     x = feature vector, w = learned weights
 */

// ============================================
// Feature Engineering
// ============================================

/** Feature vector for HLR prediction */
export interface HLRFeatures {
  /** Intercept (always 1.0) */
  intercept: number;
  /** Square root of total review count */
  sqrtHistoryCount: number;
  /** Log of time since last review in days (+1 to avoid log(0)) */
  logLastLag: number;
  /** Current correct streak length */
  correctStreak: number;
  /** Item difficulty (IRT b parameter, normalized to [0,1]) */
  normalizedDifficulty: number;
  /** Total failure count */
  failCount: number;
}

/** Feature names for display and analysis */
export const HLR_FEATURE_NAMES: (keyof HLRFeatures)[] = [
  'intercept',
  'sqrtHistoryCount',
  'logLastLag',
  'correctStreak',
  'normalizedDifficulty',
  'failCount',
];

/** Number of features in the HLR model */
export const HLR_FEATURE_COUNT = 6;

// ============================================
// Model Parameters
// ============================================

/** Learned weight vector for HLR */
export interface HLRWeights {
  /** Weight values (one per feature) */
  values: number[];
  /** Number of training observations */
  trainingCount: number;
  /** Training loss (MSE) */
  trainingLoss: number;
  /** Last updated timestamp */
  updatedAt: Date;
}

/** Default initial weights */
export const DEFAULT_HLR_WEIGHTS: number[] = [
  2.0,   // intercept: base half-life of 4 days (2^2)
  0.5,   // sqrtHistoryCount: more reviews = longer half-life
  -0.3,  // logLastLag: longer gaps = shorter half-life
  0.4,   // correctStreak: streaks extend half-life
  -1.0,  // normalizedDifficulty: harder items decay faster
  -0.5,  // failCount: failures shorten half-life
];

// ============================================
// Prediction Results
// ============================================

/** HLR prediction for a single item */
export interface HLRPrediction {
  /** Predicted half-life in days */
  halfLife: number;
  /** Current predicted retention probability (0-1) */
  predictedRetention: number;
  /** Optimal next review time (days from now) for target retention */
  optimalReviewDays: number;
  /** Time elapsed since last review (days) */
  elapsedDays: number;
  /** Whether the item is overdue (retention < target) */
  isOverdue: boolean;
}

/** A point on a forgetting curve */
export interface ForgettingCurvePoint {
  /** Days since last review */
  day: number;
  /** Predicted retention at this point */
  retention: number;
}

/** Personalized forgetting curve for visualization */
export interface PersonalizedForgettingCurve {
  /** Item or area identifier */
  identifier: string;
  /** Display label */
  label: string;
  /** Half-life for this curve */
  halfLife: number;
  /** Curve data points */
  points: ForgettingCurvePoint[];
  /** Marker for actual review events */
  reviewMarkers: { day: number; correct: boolean }[];
}

// ============================================
// Training
// ============================================

/** Training observation for HLR weight updates */
export interface HLRTrainingObservation {
  /** Feature vector */
  features: HLRFeatures;
  /** Actual outcome: recalled (1) or forgotten (0) */
  recalled: boolean;
  /** Time delta in days since last review */
  deltaDays: number;
}

/** HLR training configuration */
export interface HLRTrainingConfig {
  /** Learning rate for SGD (default 0.01) */
  learningRate: number;
  /** L2 regularization lambda (default 0.001) */
  l2Lambda: number;
  /** Target retention for optimal review (default 0.85) */
  targetRetention: number;
  /** Maximum half-life cap in days (default 365) */
  maxHalfLife: number;
  /** Minimum half-life floor in days (default 0.5) */
  minHalfLife: number;
}

/** Default HLR training configuration */
export const DEFAULT_HLR_CONFIG: HLRTrainingConfig = {
  learningRate: 0.01,
  l2Lambda: 0.001,
  targetRetention: 0.85,
  maxHalfLife: 365,
  minHalfLife: 0.5,
};
