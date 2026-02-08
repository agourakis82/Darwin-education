/**
 * Darwin Education - Response Time IRT (RT-IRT) Types
 * ====================================================
 *
 * Hierarchical framework for joint modeling of accuracy and response time.
 * Extends standard IRT 3PL with a log-normal response time model.
 *
 * Reference: van der Linden, W. J. (2006). A lognormal model for response
 * times on test items. Journal of Educational and Behavioral Statistics, 31(2).
 *
 * Model:
 *   Accuracy: P(X=1|theta, a, b, c) = c + (1-c) * logistic(a(theta-b))
 *   RT:       log(T) ~ N(beta_t - tau, sigma²)
 *     where tau = speed parameter (higher = faster)
 *     and beta_t = item time-intensity (higher = more time-consuming)
 *
 * Joint estimation via 2D EAP over theta × tau grid.
 */

import type { IRTParameters, ENAMEDArea } from './education';

// ============================================
// Item Parameters
// ============================================

/** Extended IRT parameters with response time model */
export interface RTIRTItem extends IRTParameters {
  /** Time-intensity parameter (higher = item takes more time) */
  timeIntensity: number;
  /** Residual variance of log-RT for this item */
  timeVariance: number;
}

// ============================================
// Response Data
// ============================================

/** A single response with timing data */
export interface RTIRTResponse {
  itemId: string;
  /** Whether the response was correct */
  correct: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Log-transformed response time: log(RT_seconds) */
  logTime: number;
  /** Area for this item */
  area?: ENAMEDArea;
}

// ============================================
// Estimation Results
// ============================================

/** Joint speed-accuracy profile from 2D EAP */
export interface SpeedAccuracyProfile {
  /** Ability parameter (standard IRT theta) */
  theta: number;
  /** Speed parameter (higher = faster responder) */
  tau: number;
  /** Standard error of theta estimate */
  thetaSE: number;
  /** Standard error of tau estimate */
  tauSE: number;
  /** Correlation between theta and tau estimates */
  thetaTauCorrelation: number;
  /** Speed-accuracy tradeoff coefficient */
  tradeoffCoefficient: number;
  /** Per-response behavioral classification */
  responseBehaviors: ResponseBehavior[];
  /** Summary statistics */
  summary: SpeedAccuracySummary;
}

/** Classification of a single response's timing behavior */
export interface ResponseBehavior {
  itemId: string;
  /** Observed log-RT */
  logRT: number;
  /** Expected log-RT given tau and item */
  expectedLogRT: number;
  /** Standardized residual: (observed - expected) / sigma */
  residual: number;
  /** Behavioral classification */
  classification: ResponseBehaviorType;
}

/** Response timing behavior categories */
export type ResponseBehaviorType =
  | 'rapid_guess'    // Extremely fast, likely guessing (residual < -2)
  | 'fast_correct'   // Fast and correct (good mastery)
  | 'normal'         // Within expected range
  | 'slow_careful'   // Slower than expected (effortful processing)
  | 'aberrant_slow'; // Extremely slow (possible disengagement, residual > 2)

/** Aggregate speed-accuracy statistics */
export interface SpeedAccuracySummary {
  /** Total responses analyzed */
  totalResponses: number;
  /** Mean response time (seconds) */
  meanRT: number;
  /** Median response time (seconds) */
  medianRT: number;
  /** Counts per behavior type */
  behaviorCounts: Record<ResponseBehaviorType, number>;
  /** Proportion of rapid-guess responses */
  rapidGuessRate: number;
  /** Estimated ability if rapid-guess items removed */
  thetaWithoutRapidGuess: number | null;
}

// ============================================
// Configuration
// ============================================

/** Configuration for RT-IRT estimation */
export interface RTIRTConfig {
  /** Number of theta grid points (default 21) */
  thetaGridPoints: number;
  /** Number of tau grid points (default 21) */
  tauGridPoints: number;
  /** Theta range [min, max] (default [-4, 4]) */
  thetaRange: [number, number];
  /** Tau range [min, max] (default [-3, 3]) */
  tauRange: [number, number];
  /** Prior correlation between theta and tau (default 0.2) */
  priorCorrelation: number;
  /** Rapid-guess threshold: residual below this = rapid guess (default -2.0) */
  rapidGuessThreshold: number;
  /** Aberrant-slow threshold: residual above this = aberrant (default 2.0) */
  aberrantSlowThreshold: number;
}

/** Default RT-IRT configuration */
export const DEFAULT_RT_IRT_CONFIG: RTIRTConfig = {
  thetaGridPoints: 21,
  tauGridPoints: 21,
  thetaRange: [-4, 4],
  tauRange: [-3, 3],
  priorCorrelation: 0.2,
  rapidGuessThreshold: -2.0,
  aberrantSlowThreshold: 2.0,
};
