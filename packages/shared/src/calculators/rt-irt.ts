/**
 * Response Time IRT (RT-IRT) Calculator
 * ======================================
 *
 * Joint modeling of accuracy and response time using van der Linden's
 * hierarchical framework. Extends IRT 3PL with log-normal RT model.
 *
 * Accuracy: P(X=1|theta) = c + (1-c) * logistic(a(theta-b))
 * RT:       log(T) ~ N(beta_t - tau, sigma²)
 *
 * Joint estimation via 2D EAP over theta × tau grid (21×21 = 441 points).
 *
 * Reference: van der Linden (2006). A lognormal model for response times
 * on test items. JEBS, 31(2), 181-204.
 */

import { probability3PL } from './tri';
import type { IRTParameters } from '../types/education';
import type {
  RTIRTItem,
  RTIRTResponse,
  SpeedAccuracyProfile,
  ResponseBehavior,
  ResponseBehaviorType,
  SpeedAccuracySummary,
  RTIRTConfig,
  DEFAULT_RT_IRT_CONFIG,
} from '../types/rt-irt';

// Re-import defaults
const DEFAULT_CONFIG: RTIRTConfig = {
  thetaGridPoints: 21,
  tauGridPoints: 21,
  thetaRange: [-4, 4],
  tauRange: [-3, 3],
  priorCorrelation: 0.2,
  rapidGuessThreshold: -2.0,
  aberrantSlowThreshold: 2.0,
};

// ============================================
// Log-Normal RT Model
// ============================================

/**
 * Log-normal probability density function.
 * f(t | mu, sigma²) = (1 / (t * sigma * sqrt(2pi))) * exp(-(log(t) - mu)² / (2*sigma²))
 */
export function logNormalDensity(
  logTime: number,
  mu: number,
  sigma2: number
): number {
  if (sigma2 <= 0) return 0;
  const diff = logTime - mu;
  const exponent = -(diff * diff) / (2 * sigma2);
  return (1 / Math.sqrt(2 * Math.PI * sigma2)) * Math.exp(exponent);
}

/**
 * Expected log-RT for an item given speed parameter tau.
 * E[log(T)] = beta_t - tau
 */
export function expectedLogRT(
  tau: number,
  item: RTIRTItem
): number {
  return item.timeIntensity - tau;
}

// ============================================
// Joint Likelihood
// ============================================

/**
 * Joint likelihood of a response and response time.
 * L(x, t | theta, tau) = P(x | theta) * f(log(t) | tau, item)
 */
export function jointLikelihood(
  correct: boolean,
  logTime: number,
  theta: number,
  tau: number,
  item: RTIRTItem
): number {
  // Accuracy component
  const p = probability3PL(theta, item as IRTParameters);
  const pAccuracy = correct ? p : (1 - p);

  // RT component
  const mu = expectedLogRT(tau, item);
  const pRT = logNormalDensity(logTime, mu, item.timeVariance);

  return pAccuracy * pRT;
}

// ============================================
// 2D EAP Estimation
// ============================================

/**
 * Bivariate normal prior density for (theta, tau).
 * N(0, 0, 1, 1, rho) where rho is the prior correlation.
 */
function bivariateNormalPrior(
  theta: number,
  tau: number,
  rho: number
): number {
  const coeff = 1 / (2 * Math.PI * Math.sqrt(1 - rho * rho));
  const z = (theta * theta - 2 * rho * theta * tau + tau * tau) / (2 * (1 - rho * rho));
  return coeff * Math.exp(-z);
}

/**
 * Estimate joint speed-accuracy profile via 2D EAP.
 *
 * Integrates over a theta × tau grid with bivariate normal prior.
 * O(gridSize² × N_items) complexity.
 */
export function estimateSpeedAccuracy(
  responses: RTIRTResponse[],
  items: Map<string, RTIRTItem>,
  config: Partial<RTIRTConfig> = {}
): SpeedAccuracyProfile {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const {
    thetaGridPoints, tauGridPoints,
    thetaRange, tauRange,
    priorCorrelation,
  } = cfg;

  const thetaStep = (thetaRange[1] - thetaRange[0]) / (thetaGridPoints - 1);
  const tauStep = (tauRange[1] - tauRange[0]) / (tauGridPoints - 1);

  // Grid integration
  let sumPosterior = 0;
  let sumThetaPosterior = 0;
  let sumTauPosterior = 0;
  let sumTheta2Posterior = 0;
  let sumTau2Posterior = 0;
  let sumThetaTauPosterior = 0;

  for (let i = 0; i < thetaGridPoints; i++) {
    const theta = thetaRange[0] + i * thetaStep;
    for (let j = 0; j < tauGridPoints; j++) {
      const tau = tauRange[0] + j * tauStep;

      // Prior
      const prior = bivariateNormalPrior(theta, tau, priorCorrelation);

      // Log-likelihood over all responses
      let logLik = 0;
      for (const resp of responses) {
        const item = items.get(resp.itemId);
        if (!item) continue;

        // Accuracy
        const p = probability3PL(theta, item as IRTParameters);
        logLik += resp.correct
          ? Math.log(Math.max(p, 1e-10))
          : Math.log(Math.max(1 - p, 1e-10));

        // RT
        const mu = expectedLogRT(tau, item);
        const rtDensity = logNormalDensity(resp.logTime, mu, item.timeVariance);
        logLik += Math.log(Math.max(rtDensity, 1e-30));
      }

      const posterior = Math.exp(logLik) * prior;
      sumPosterior += posterior;
      sumThetaPosterior += theta * posterior;
      sumTauPosterior += tau * posterior;
      sumTheta2Posterior += theta * theta * posterior;
      sumTau2Posterior += tau * tau * posterior;
      sumThetaTauPosterior += theta * tau * posterior;
    }
  }

  // EAP estimates
  const thetaEAP = sumPosterior > 0 ? sumThetaPosterior / sumPosterior : 0;
  const tauEAP = sumPosterior > 0 ? sumTauPosterior / sumPosterior : 0;

  // Posterior variances (for SEs)
  const thetaVar = sumPosterior > 0
    ? (sumTheta2Posterior / sumPosterior) - thetaEAP * thetaEAP
    : 1;
  const tauVar = sumPosterior > 0
    ? (sumTau2Posterior / sumPosterior) - tauEAP * tauEAP
    : 1;
  const covariance = sumPosterior > 0
    ? (sumThetaTauPosterior / sumPosterior) - thetaEAP * tauEAP
    : 0;

  const thetaSE = Math.sqrt(Math.max(thetaVar, 0.001));
  const tauSE = Math.sqrt(Math.max(tauVar, 0.001));
  const correlation = (thetaSE > 0 && tauSE > 0)
    ? covariance / (thetaSE * tauSE)
    : 0;

  // Classify response behaviors
  const behaviors = classifyAllResponses(responses, items, tauEAP, cfg);

  // Summary statistics
  const summary = computeSummary(responses, behaviors, thetaEAP, items);

  // Speed-accuracy tradeoff coefficient
  const tradeoff = computeTradeoff(thetaEAP, tauEAP);

  return {
    theta: thetaEAP,
    tau: tauEAP,
    thetaSE,
    tauSE,
    thetaTauCorrelation: Math.max(-1, Math.min(1, correlation)),
    tradeoffCoefficient: tradeoff,
    responseBehaviors: behaviors,
    summary,
  };
}

// ============================================
// Response Behavior Classification
// ============================================

/**
 * Classify a single response's timing behavior based on RT residual.
 */
export function classifyResponseBehavior(
  logRT: number,
  tau: number,
  item: RTIRTItem,
  config: Partial<RTIRTConfig> = {}
): ResponseBehaviorType {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const mu = expectedLogRT(tau, item);
  const sigma = Math.sqrt(item.timeVariance);
  const residual = sigma > 0 ? (logRT - mu) / sigma : 0;

  if (residual < cfg.rapidGuessThreshold) return 'rapid_guess';
  if (residual > cfg.aberrantSlowThreshold) return 'aberrant_slow';
  if (residual < -1) return 'fast_correct';
  if (residual > 1) return 'slow_careful';
  return 'normal';
}

function classifyAllResponses(
  responses: RTIRTResponse[],
  items: Map<string, RTIRTItem>,
  tau: number,
  config: RTIRTConfig
): ResponseBehavior[] {
  return responses
    .map((resp) => {
      const item = items.get(resp.itemId);
      if (!item) return null;

      const mu = expectedLogRT(tau, item);
      const sigma = Math.sqrt(item.timeVariance);
      const residual = sigma > 0 ? (resp.logTime - mu) / sigma : 0;

      return {
        itemId: resp.itemId,
        logRT: resp.logTime,
        expectedLogRT: mu,
        residual,
        classification: classifyResponseBehavior(resp.logTime, tau, item, config),
      };
    })
    .filter((b): b is ResponseBehavior => b !== null);
}

function computeSummary(
  responses: RTIRTResponse[],
  behaviors: ResponseBehavior[],
  theta: number,
  items: Map<string, RTIRTItem>
): SpeedAccuracySummary {
  const rts = responses.map((r) => Math.exp(r.logTime));
  const sorted = [...rts].sort((a, b) => a - b);
  const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
  const medianRT = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

  const behaviorCounts: Record<ResponseBehaviorType, number> = {
    rapid_guess: 0,
    fast_correct: 0,
    normal: 0,
    slow_careful: 0,
    aberrant_slow: 0,
  };
  for (const b of behaviors) {
    behaviorCounts[b.classification]++;
  }

  const rapidGuessRate = behaviors.length > 0
    ? behaviorCounts.rapid_guess / behaviors.length
    : 0;

  return {
    totalResponses: responses.length,
    meanRT,
    medianRT,
    behaviorCounts,
    rapidGuessRate,
    thetaWithoutRapidGuess: null, // Would require re-estimation
  };
}

function computeTradeoff(theta: number, tau: number): number {
  // Simple linear tradeoff: if high speed AND high accuracy => positive
  // Normalize both to [0,1] range from [-4,4] and [-3,3]
  const normTheta = (theta + 4) / 8;
  const normTau = (tau + 3) / 6;
  return normTheta - normTau; // Positive = accuracy dominates, negative = speed dominates
}

// ============================================
// Utility: Convert raw RT to RTIRTResponse
// ============================================

/**
 * Convert a raw response with timing to RTIRTResponse format.
 */
export function toRTIRTResponse(
  itemId: string,
  correct: boolean,
  responseTimeMs: number,
  area?: string
): RTIRTResponse {
  const rtSeconds = responseTimeMs / 1000;
  return {
    itemId,
    correct,
    responseTimeMs,
    logTime: Math.log(Math.max(rtSeconds, 0.1)),
    area: area as RTIRTResponse['area'],
  };
}

/**
 * Convert standard IRT parameters to RT-IRT item parameters.
 * Uses default time-intensity based on difficulty.
 */
export function toRTIRTItem(
  params: IRTParameters,
  medianLogRT?: number
): RTIRTItem {
  return {
    ...params,
    // Default: harder items take longer (beta_t ≈ 3.5 + 0.5*b)
    timeIntensity: medianLogRT ?? (3.5 + 0.5 * params.difficulty),
    // Default residual variance
    timeVariance: 0.5,
  };
}
