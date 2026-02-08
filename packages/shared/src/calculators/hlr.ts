/**
 * Half-Life Regression (HLR) Calculator
 * =======================================
 *
 * Personalized forgetting curve model using feature-based half-life prediction.
 * Complements FSRS with explicit feature engineering.
 *
 * Model:
 *   Half-life:  h = 2^(w · x)  (feature-weighted)
 *   Retention:  P = 2^(-delta/h) (power-law decay)
 *
 * Where:
 *   delta = time elapsed since last review (days)
 *   x = feature vector
 *   w = learned weight vector
 *
 * Training via online SGD with L2 regularization.
 *
 * Reference: Settles, B. & Meeder, B. (2016). A trainable spaced
 * repetition model for language learning. ACL.
 */

import type {
  HLRFeatures,
  HLRWeights,
  HLRPrediction,
  ForgettingCurvePoint,
  PersonalizedForgettingCurve,
  HLRTrainingObservation,
  HLRTrainingConfig,
  DEFAULT_HLR_CONFIG,
} from '../types/hlr';
import { DEFAULT_HLR_WEIGHTS, HLR_FEATURE_COUNT } from '../types/hlr';

// Re-import config defaults
const DEFAULT_CONFIG: HLRTrainingConfig = {
  learningRate: 0.01,
  l2Lambda: 0.001,
  targetRetention: 0.85,
  maxHalfLife: 365,
  minHalfLife: 0.5,
};

// ============================================
// Core Model
// ============================================

/**
 * Compute half-life from features and weights.
 * h = 2^(w · x), clamped to [minHalfLife, maxHalfLife]
 */
export function computeHalfLife(
  features: HLRFeatures,
  weights: number[],
  config: Partial<HLRTrainingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const featureArray = featuresToArray(features);
  const dotProduct = dot(weights, featureArray);
  const halfLife = Math.pow(2, dotProduct);
  return Math.max(cfg.minHalfLife, Math.min(cfg.maxHalfLife, halfLife));
}

/**
 * Predict retention probability after delta days.
 * P = 2^(-delta / h)
 */
export function predictRetention(
  features: HLRFeatures,
  weights: number[],
  deltaDays: number,
  config: Partial<HLRTrainingConfig> = {}
): number {
  const h = computeHalfLife(features, weights, config);
  if (deltaDays <= 0) return 1.0;
  return Math.pow(2, -deltaDays / h);
}

/**
 * Compute optimal review time for a target retention level.
 * Solve: targetRetention = 2^(-delta / h)  =>  delta = -h * log2(target)
 */
export function optimalReviewTime(
  features: HLRFeatures,
  weights: number[],
  config: Partial<HLRTrainingConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const h = computeHalfLife(features, weights, cfg);
  // delta = -h * log2(targetRetention)
  const delta = -h * Math.log2(cfg.targetRetention);
  return Math.max(0, delta);
}

/**
 * Full prediction for a single item.
 */
export function predictItem(
  features: HLRFeatures,
  weights: number[],
  elapsedDays: number,
  config: Partial<HLRTrainingConfig> = {}
): HLRPrediction {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const halfLife = computeHalfLife(features, weights, cfg);
  const retention = elapsedDays > 0 ? Math.pow(2, -elapsedDays / halfLife) : 1.0;
  const optimalDays = optimalReviewTime(features, weights, cfg);

  return {
    halfLife,
    predictedRetention: retention,
    optimalReviewDays: Math.max(0, optimalDays - elapsedDays),
    elapsedDays,
    isOverdue: retention < cfg.targetRetention,
  };
}

// ============================================
// Forgetting Curve Generation
// ============================================

/**
 * Generate forgetting curve data points for visualization.
 */
export function generateForgettingCurve(
  features: HLRFeatures,
  weights: number[],
  maxDays: number = 90,
  numPoints: number = 50,
  config: Partial<HLRTrainingConfig> = {}
): ForgettingCurvePoint[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const h = computeHalfLife(features, weights, cfg);
  const points: ForgettingCurvePoint[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const day = (i / numPoints) * maxDays;
    const retention = day > 0 ? Math.pow(2, -day / h) : 1.0;
    points.push({ day, retention });
  }

  return points;
}

/**
 * Generate a labeled forgetting curve for an item/area.
 */
export function generateLabeledCurve(
  identifier: string,
  label: string,
  features: HLRFeatures,
  weights: number[],
  reviewHistory: { day: number; correct: boolean }[],
  maxDays: number = 90,
  config: Partial<HLRTrainingConfig> = {}
): PersonalizedForgettingCurve {
  const h = computeHalfLife(features, weights, config);
  const points = generateForgettingCurve(features, weights, maxDays, 50, config);

  return {
    identifier,
    label,
    halfLife: h,
    points,
    reviewMarkers: reviewHistory,
  };
}

// ============================================
// Feature Extraction
// ============================================

/**
 * Extract HLR features from card review history.
 *
 * @param historyCount Total number of prior reviews
 * @param lastLagDays Days since the most recent review
 * @param correctStreak Current consecutive correct count
 * @param normalizedDifficulty Item difficulty normalized to [0,1]
 * @param failCount Total incorrect reviews
 */
export function extractFeatures(
  historyCount: number,
  lastLagDays: number,
  correctStreak: number,
  normalizedDifficulty: number,
  failCount: number
): HLRFeatures {
  return {
    intercept: 1.0,
    sqrtHistoryCount: Math.sqrt(Math.max(0, historyCount)),
    logLastLag: Math.log(Math.max(0, lastLagDays) + 1),
    correctStreak: Math.max(0, correctStreak),
    normalizedDifficulty: Math.max(0, Math.min(1, normalizedDifficulty)),
    failCount: Math.max(0, failCount),
  };
}

/**
 * Normalize IRT difficulty to [0,1] range.
 * Maps from [-4, 4] to [0, 1].
 */
export function normalizeDifficulty(irtDifficulty: number): number {
  return (irtDifficulty + 4) / 8;
}

// ============================================
// Online Training (SGD)
// ============================================

/**
 * Update weights using a single training observation via SGD.
 *
 * Loss: L = (P_predicted - P_actual)² + lambda * ||w||²
 *
 * Gradient of P w.r.t. w:
 *   dP/dw = P * ln(2) * (-delta / h) * (-h * ln(2)) * x
 *         = P * ln(2)² * delta * x / h
 *   (simplified: since dh/dw = h * ln(2) * x)
 *
 * Then: dL/dw = 2*(P-y) * dP/dw + 2*lambda*w
 */
export function updateWeights(
  weights: number[],
  observation: HLRTrainingObservation,
  config: Partial<HLRTrainingConfig> = {}
): number[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { features, recalled, deltaDays } = observation;
  const featureArray = featuresToArray(features);

  // Predicted retention
  const h = computeHalfLife(features, weights, cfg);
  const pPredicted = deltaDays > 0 ? Math.pow(2, -deltaDays / h) : 1.0;
  const pActual = recalled ? 1.0 : 0.0;
  const error = pPredicted - pActual;

  // Gradient of P w.r.t. weights
  const ln2 = Math.LN2;
  const ln2sq = ln2 * ln2;
  const gradScale = pPredicted * ln2sq * deltaDays / Math.max(h, 0.001);

  // Update each weight
  const newWeights = [...weights];
  for (let i = 0; i < newWeights.length; i++) {
    const gradLoss = 2 * error * gradScale * featureArray[i];
    const gradReg = 2 * cfg.l2Lambda * newWeights[i];
    newWeights[i] -= cfg.learningRate * (gradLoss + gradReg);
  }

  return newWeights;
}

/**
 * Batch train weights on multiple observations.
 */
export function trainWeights(
  observations: HLRTrainingObservation[],
  initialWeights?: number[],
  config: Partial<HLRTrainingConfig> = {}
): HLRWeights {
  let weights = initialWeights
    ? [...initialWeights]
    : [...DEFAULT_HLR_WEIGHTS];

  let totalLoss = 0;
  for (const obs of observations) {
    const h = computeHalfLife(obs.features, weights, config);
    const pPred = obs.deltaDays > 0 ? Math.pow(2, -obs.deltaDays / h) : 1.0;
    const pActual = obs.recalled ? 1.0 : 0.0;
    totalLoss += (pPred - pActual) ** 2;

    weights = updateWeights(weights, obs, config);
  }

  return {
    values: weights,
    trainingCount: observations.length,
    trainingLoss: observations.length > 0 ? totalLoss / observations.length : 0,
    updatedAt: new Date(),
  };
}

// ============================================
// Utilities
// ============================================

function featuresToArray(f: HLRFeatures): number[] {
  return [
    f.intercept,
    f.sqrtHistoryCount,
    f.logLastLag,
    f.correctStreak,
    f.normalizedDifficulty,
    f.failCount,
  ];
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Initialize HLR weights with defaults.
 */
export function initializeWeights(): HLRWeights {
  return {
    values: [...DEFAULT_HLR_WEIGHTS],
    trainingCount: 0,
    trainingLoss: 0,
    updatedAt: new Date(),
  };
}
