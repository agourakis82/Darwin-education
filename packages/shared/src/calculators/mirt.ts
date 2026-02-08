/**
 * Multidimensional IRT (MIRT) Calculator
 * ========================================
 *
 * Compensatory 5-dimensional IRT model for ENAMED areas.
 * Each item loads primarily on one dimension with small cross-loadings.
 *
 * Model:
 *   P(X=1|theta) = c + (1-c) * sigmoid(a'theta + d)
 *   where theta ∈ R^5, a ∈ R^5, d ∈ R (intercept)
 *
 * Estimation: MAP with N(0, I) prior via Newton-Raphson.
 *
 * Reference: Reckase (2009). Multidimensional Item Response Theory. Springer.
 */

import type { ENAMEDArea } from '../types/education';
import type {
  MIRTItemParameters,
  MIRTAbilityProfile,
  DimensionProfile,
  MIRTEstimationInfo,
  MIRTConfig,
} from '../types/mirt';
import {
  MIRT_DIMENSIONS,
  MIRT_NDIM,
  MIRT_DIMENSION_LABELS_PT,
  MIRT_DEFAULT_LOADINGS,
  DEFAULT_MIRT_CONFIG,
} from '../types/mirt';

// ============================================
// Probability Model
// ============================================

/**
 * Sigmoid (logistic) function.
 */
function sigmoid(x: number): number {
  if (x > 20) return 1 - 1e-9;
  if (x < -20) return 1e-9;
  return 1 / (1 + Math.exp(-x));
}

/**
 * Dot product of two vectors.
 */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * MIRT probability: P(X=1|theta) = c + (1-c) * sigmoid(a'theta + d)
 */
export function mirtProbability(
  theta: number[],
  item: MIRTItemParameters
): number {
  const linearPredictor = dot(item.discriminations, theta) + item.intercept;
  return item.guessing + (1 - item.guessing) * sigmoid(linearPredictor);
}

// ============================================
// Log-Likelihood + Derivatives
// ============================================

/**
 * Log-likelihood of theta given responses.
 */
export function mirtLogLikelihood(
  theta: number[],
  responses: { correct: boolean; item: MIRTItemParameters }[]
): number {
  let ll = 0;
  for (const { correct, item } of responses) {
    const p = mirtProbability(theta, item);
    ll += correct
      ? Math.log(Math.max(p, 1e-10))
      : Math.log(Math.max(1 - p, 1e-10));
  }
  return ll;
}

/**
 * Log-posterior = log-likelihood + log-prior.
 * Prior: N(mu, Sigma) — add log N(theta | mu, Sigma).
 */
function logPosterior(
  theta: number[],
  responses: { correct: boolean; item: MIRTItemParameters }[],
  priorMean: number[],
  priorCovInv: number[][]
): number {
  let lp = mirtLogLikelihood(theta, responses);

  // Log-prior: -0.5 * (theta - mu)' Sigma^{-1} (theta - mu)
  for (let i = 0; i < MIRT_NDIM; i++) {
    for (let j = 0; j < MIRT_NDIM; j++) {
      lp -= 0.5 * (theta[i] - priorMean[i]) * priorCovInv[i][j] * (theta[j] - priorMean[j]);
    }
  }

  return lp;
}

/**
 * Gradient of log-posterior w.r.t. theta (5D vector).
 */
export function mirtGradient(
  theta: number[],
  responses: { correct: boolean; item: MIRTItemParameters }[],
  priorMean: number[],
  priorCovInv: number[][]
): number[] {
  const grad = new Array(MIRT_NDIM).fill(0);

  for (const { correct, item } of responses) {
    const p = mirtProbability(theta, item);
    const c = item.guessing;
    const pStar = (p - c) / (1 - c); // P* component

    // Residual
    const u = correct ? 1 : 0;
    const factor = (u - p) * pStar / Math.max(p * (1 - p), 1e-10) * (1 - c);

    // dP/dtheta_k = a_k * P*(1-P*) * (1-c) simplifies through chain rule
    for (let k = 0; k < MIRT_NDIM; k++) {
      grad[k] += item.discriminations[k] * (u - p) * pStar / Math.max(p, 1e-10);
    }
  }

  // Prior gradient: -Sigma^{-1} (theta - mu)
  for (let i = 0; i < MIRT_NDIM; i++) {
    for (let j = 0; j < MIRT_NDIM; j++) {
      grad[i] -= priorCovInv[i][j] * (theta[j] - priorMean[j]);
    }
  }

  return grad;
}

/**
 * Hessian of log-posterior (5×5 matrix).
 */
export function mirtHessian(
  theta: number[],
  responses: { correct: boolean; item: MIRTItemParameters }[],
  priorCovInv: number[][]
): number[][] {
  const H = Array.from({ length: MIRT_NDIM }, () => new Array(MIRT_NDIM).fill(0));

  for (const { item } of responses) {
    const p = mirtProbability(theta, item);
    const c = item.guessing;
    const pStar = (p - c) / (1 - c);

    // Approximate: -a_i * a_j * p * (1-p) * (pStar/p)^2
    const w = p * (1 - p) * (pStar * pStar) / (p * p);

    for (let i = 0; i < MIRT_NDIM; i++) {
      for (let j = 0; j < MIRT_NDIM; j++) {
        H[i][j] -= item.discriminations[i] * item.discriminations[j] * w;
      }
    }
  }

  // Prior Hessian: -Sigma^{-1}
  for (let i = 0; i < MIRT_NDIM; i++) {
    for (let j = 0; j < MIRT_NDIM; j++) {
      H[i][j] -= priorCovInv[i][j];
    }
  }

  return H;
}

// ============================================
// Matrix Operations (5×5)
// ============================================

/**
 * Invert a matrix via Gaussian elimination (works for small matrices).
 * Returns null if singular.
 */
function invertMatrix(mat: number[][]): number[][] | null {
  const n = mat.length;
  // Augmented matrix [A | I]
  const aug = mat.map((row, i) => {
    const augRow = [...row];
    for (let j = 0; j < n; j++) augRow.push(i === j ? 1 : 0);
    return augRow;
  });

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxVal = Math.abs(aug[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null; // Singular

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Eliminate
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Extract inverse
  return aug.map((row) => row.slice(n));
}

/**
 * Matrix × vector multiplication.
 */
function matVec(mat: number[][], vec: number[]): number[] {
  return mat.map((row) => dot(row, vec));
}

// ============================================
// MAP Estimation via Newton-Raphson
// ============================================

/**
 * Estimate 5D theta via MAP with Newton-Raphson.
 */
export function estimateMIRT_MAP(
  responses: { correct: boolean; item: MIRTItemParameters }[],
  config: Partial<MIRTConfig> = {}
): MIRTAbilityProfile {
  const cfg = { ...DEFAULT_MIRT_CONFIG, ...config };

  // Prior covariance inverse (for identity prior, this is just I)
  const priorCovInv = cfg.priorCovariance.map((row) => [...row]);
  // For identity, inverse is identity itself
  const priorCovInvActual = invertMatrix(priorCovInv) || cfg.priorCovariance;

  // Initialize theta at prior mean
  let theta = [...cfg.priorMean];
  let converged = false;
  let finalIter = 0;
  let gradNorm = Infinity;

  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    finalIter = iter + 1;

    // Gradient and Hessian
    const grad = mirtGradient(theta, responses, cfg.priorMean, priorCovInvActual);
    const H = mirtHessian(theta, responses, priorCovInvActual);

    gradNorm = Math.sqrt(grad.reduce((s, g) => s + g * g, 0));

    // Invert Hessian
    const Hinv = invertMatrix(H);
    if (!Hinv) break; // Singular Hessian

    // Newton step: delta = -H^{-1} * g
    const delta = matVec(Hinv, grad).map((d) => -d);

    // Step halving for stability
    let stepSize = 1.0;
    let newTheta = theta.map((t, k) => t + stepSize * delta[k]);
    let newLP = logPosterior(newTheta, responses, cfg.priorMean, priorCovInvActual);
    const currentLP = logPosterior(theta, responses, cfg.priorMean, priorCovInvActual);

    for (let half = 0; half < cfg.maxStepHalving; half++) {
      if (newLP >= currentLP) break;
      stepSize *= 0.5;
      newTheta = theta.map((t, k) => t + stepSize * delta[k]);
      newLP = logPosterior(newTheta, responses, cfg.priorMean, priorCovInvActual);
    }

    // Clamp theta to [-4, 4]
    theta = newTheta.map((t) => Math.max(-4, Math.min(4, t)));

    // Check convergence
    const maxDelta = Math.max(...delta.map((d) => Math.abs(d * stepSize)));
    if (maxDelta < cfg.convergenceThreshold) {
      converged = true;
      break;
    }
  }

  // Standard errors from inverse negative Hessian
  const H = mirtHessian(theta, responses, priorCovInvActual);
  const negH = H.map((row) => row.map((v) => -v));
  const covMatrix = invertMatrix(negH) || cfg.priorCovariance;

  // Build profile
  const ses: Record<ENAMEDArea, number> = {} as Record<ENAMEDArea, number>;
  const thetaRecord: Record<ENAMEDArea, number> = {} as Record<ENAMEDArea, number>;
  const cis: Record<ENAMEDArea, [number, number]> = {} as Record<ENAMEDArea, [number, number]>;

  for (let k = 0; k < MIRT_NDIM; k++) {
    const area = MIRT_DIMENSIONS[k];
    thetaRecord[area] = theta[k];
    const se = Math.sqrt(Math.max(covMatrix[k][k], 0.001));
    ses[area] = se;
    cis[area] = [theta[k] - 1.96 * se, theta[k] + 1.96 * se];
  }

  // Count items per dimension
  const itemCounts: Record<ENAMEDArea, number> = {} as Record<ENAMEDArea, number>;
  for (const area of MIRT_DIMENSIONS) itemCounts[area] = 0;
  for (const { item } of responses) {
    itemCounts[item.primaryDimension]++;
  }

  // Rank dimensions
  const sorted = MIRT_DIMENSIONS.map((area) => ({ area, theta: thetaRecord[area] }))
    .sort((a, b) => b.theta - a.theta);

  const dimensionProfiles: DimensionProfile[] = sorted.map((s, i) => ({
    area: s.area,
    label: MIRT_DIMENSION_LABELS_PT[s.area],
    theta: s.theta,
    se: ses[s.area],
    ci: cis[s.area],
    itemCount: itemCounts[s.area],
    rank: i + 1,
  }));

  // Composite theta (equal-weighted average)
  const compositeTheta = theta.reduce((s, t) => s + t, 0) / MIRT_NDIM;

  const estimation: MIRTEstimationInfo = {
    iterations: finalIter,
    converged,
    gradientNorm: gradNorm,
    totalItems: responses.length,
    method: 'MAP',
  };

  return {
    theta: thetaRecord,
    standardErrors: ses,
    confidenceIntervals: cis,
    covarianceMatrix: covMatrix,
    dimensionProfiles,
    compositeTheta,
    estimation,
  };
}

// ============================================
// Item Parameter Construction
// ============================================

/**
 * Convert a standard IRT item to MIRT parameters based on its area.
 * Primary area gets high discrimination, others get cross-loadings.
 */
export function toMIRTItem(
  itemId: string,
  area: ENAMEDArea,
  difficulty: number,
  discrimination: number = MIRT_DEFAULT_LOADINGS.primaryDiscrimination,
  guessing: number = 0.25
): MIRTItemParameters {
  const discriminations = MIRT_DIMENSIONS.map((dim) =>
    dim === area
      ? discrimination
      : MIRT_DEFAULT_LOADINGS.crossDiscrimination
  );

  // Intercept: d = -a_primary * b (approximate from unidimensional)
  const intercept = -discrimination * difficulty;

  return {
    itemId,
    discriminations,
    intercept,
    guessing,
    primaryDimension: area,
  };
}
