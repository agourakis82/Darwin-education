/**
 * TRI (Teoria de Resposta ao Item) / IRT Calculator
 * ==================================================
 *
 * Implementation of the 3-Parameter Logistic Model (3PL)
 * used by ENAMED for scoring.
 *
 * Formula: P(θ) = c + (1-c) * [e^(a(θ-b))] / [1 + e^(a(θ-b))]
 *
 * Where:
 * - θ (theta) = person ability
 * - a = discrimination parameter
 * - b = difficulty parameter
 * - c = guessing parameter (pseudo-chance)
 */

import type { IRTParameters, TRIScore, ENAMEDArea, AreaPerformance } from '../types/education';

// Constants
const THETA_MIN = -4;
const THETA_MAX = 4;
const THETA_PRECISION = 0.01;
const MAX_ITERATIONS = 100;
const CONVERGENCE_THRESHOLD = 0.001;

// Default guessing parameter for 4-option questions
const DEFAULT_GUESSING = 0.25;

// ENAMED scaling parameters (to convert theta to 0-1000 scale)
const SCALE_MEAN = 500;
const SCALE_SD = 100;
const PASS_THRESHOLD = 600;

/**
 * Calculate probability of correct response using 3PL model
 */
export function probability3PL(
  theta: number,
  params: IRTParameters
): number {
  const { difficulty: b, discrimination: a, guessing: c = DEFAULT_GUESSING } = params;
  const exponent = Math.exp(a * (theta - b));
  return c + (1 - c) * (exponent / (1 + exponent));
}

/**
 * Calculate information function for an item at given theta
 * Higher information = item is more useful for estimating ability at that level
 */
export function itemInformation(
  theta: number,
  params: IRTParameters
): number {
  const p = probability3PL(theta, params);
  const { discrimination: a, guessing: c = DEFAULT_GUESSING } = params;

  // I(θ) = a² * [(P - c)² / ((1 - c)² * P * (1 - P))]
  const numerator = Math.pow(a, 2) * Math.pow(p - c, 2);
  const denominator = Math.pow(1 - c, 2) * p * (1 - p);

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculate test information at given theta (sum of item informations)
 */
export function testInformation(
  theta: number,
  items: IRTParameters[]
): number {
  return items.reduce((sum, item) => sum + itemInformation(theta, item), 0);
}

/**
 * Calculate standard error of theta estimate
 * SE(θ) = 1 / sqrt(I(θ))
 */
export function standardError(
  theta: number,
  items: IRTParameters[]
): number {
  const info = testInformation(theta, items);
  if (info <= 0) return Infinity;
  return 1 / Math.sqrt(info);
}

/**
 * Estimate theta using Maximum Likelihood Estimation (MLE)
 * Newton-Raphson method
 */
export function estimateThetaMLE(
  responses: boolean[],
  items: IRTParameters[]
): number {
  if (responses.length !== items.length) {
    throw new Error('Responses and items arrays must have same length');
  }

  // Handle edge cases
  const allCorrect = responses.every(r => r);
  const allWrong = responses.every(r => !r);

  if (allCorrect) return THETA_MAX - 0.5; // Near maximum but not at boundary
  if (allWrong) return THETA_MIN + 0.5; // Near minimum but not at boundary

  // Initial theta estimate (weighted by difficulty)
  let theta = 0;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let firstDerivative = 0;
    let secondDerivative = 0;

    for (let i = 0; i < items.length; i++) {
      const p = probability3PL(theta, items[i]);
      const { discrimination: a, guessing: c = DEFAULT_GUESSING } = items[i];
      const u = responses[i] ? 1 : 0;

      // First derivative of log-likelihood
      const pStar = (p - c) / (1 - c);
      firstDerivative += a * (u - p) * pStar / p;

      // Second derivative of log-likelihood (negative expected information)
      const info = itemInformation(theta, items[i]);
      secondDerivative -= info;
    }

    // Newton-Raphson update
    if (secondDerivative === 0) break;
    const delta = firstDerivative / secondDerivative;
    theta = theta - delta;

    // Constrain theta to valid range
    theta = Math.max(THETA_MIN, Math.min(THETA_MAX, theta));

    // Check convergence
    if (Math.abs(delta) < CONVERGENCE_THRESHOLD) break;
  }

  return theta;
}

/**
 * Estimate theta using Expected A Posteriori (EAP) method
 * More stable than MLE, especially for extreme response patterns
 */
export function estimateThetaEAP(
  responses: boolean[],
  items: IRTParameters[]
): number {
  if (responses.length !== items.length) {
    throw new Error('Responses and items arrays must have same length');
  }

  // Numerical integration over theta range
  const numPoints = 81; // -4 to +4 in 0.1 increments
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < numPoints; i++) {
    const theta = THETA_MIN + (i / (numPoints - 1)) * (THETA_MAX - THETA_MIN);

    // Prior distribution (standard normal)
    const prior = Math.exp(-0.5 * theta * theta) / Math.sqrt(2 * Math.PI);

    // Likelihood
    let logLikelihood = 0;
    for (let j = 0; j < items.length; j++) {
      const p = probability3PL(theta, items[j]);
      if (responses[j]) {
        logLikelihood += Math.log(Math.max(p, 1e-10));
      } else {
        logLikelihood += Math.log(Math.max(1 - p, 1e-10));
      }
    }
    const likelihood = Math.exp(logLikelihood);

    // Posterior
    const posterior = likelihood * prior;
    numerator += theta * posterior;
    denominator += posterior;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Convert theta to scaled score (0-1000 for ENAMED)
 */
export function thetaToScaledScore(theta: number): number {
  // Linear transformation: score = mean + (theta * sd)
  const score = SCALE_MEAN + (theta * SCALE_SD);
  return Math.round(Math.max(0, Math.min(1000, score)));
}

/**
 * Convert scaled score back to theta
 */
export function scaledScoreToTheta(score: number): number {
  return (score - SCALE_MEAN) / SCALE_SD;
}

/**
 * Calculate difficulty level from b parameter
 */
export function getDifficultyLevel(
  b: number
): 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil' {
  if (b < -1.5) return 'muito_facil';
  if (b < -0.5) return 'facil';
  if (b < 0.5) return 'medio';
  if (b < 1.5) return 'dificil';
  return 'muito_dificil';
}

/**
 * Calculate complete TRI score from exam responses
 */
export function calculateTRIScore(
  responses: { questionId: string; correct: boolean; area: ENAMEDArea }[],
  items: Map<string, IRTParameters>
): TRIScore {
  // Prepare data
  const responseArray: boolean[] = [];
  const itemArray: IRTParameters[] = [];
  const areaResponses: Record<ENAMEDArea, { correct: number; total: number; difficulties: number[] }> = {
    clinica_medica: { correct: 0, total: 0, difficulties: [] },
    cirurgia: { correct: 0, total: 0, difficulties: [] },
    ginecologia_obstetricia: { correct: 0, total: 0, difficulties: [] },
    pediatria: { correct: 0, total: 0, difficulties: [] },
    saude_coletiva: { correct: 0, total: 0, difficulties: [] },
  };

  for (const response of responses) {
    const params = items.get(response.questionId);
    if (!params) continue;

    responseArray.push(response.correct);
    itemArray.push(params);

    // Track by area
    areaResponses[response.area].total++;
    areaResponses[response.area].difficulties.push(params.difficulty);
    if (response.correct) {
      areaResponses[response.area].correct++;
    }
  }

  // Estimate theta using EAP (more stable)
  const theta = estimateThetaEAP(responseArray, itemArray);
  const se = standardError(theta, itemArray);
  const scaledScore = thetaToScaledScore(theta);

  // Calculate area breakdown
  const areaBreakdown: Record<ENAMEDArea, AreaPerformance> = {} as Record<ENAMEDArea, AreaPerformance>;
  for (const [area, data] of Object.entries(areaResponses)) {
    const avgDifficulty = data.difficulties.length > 0
      ? data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length
      : 0;

    areaBreakdown[area as ENAMEDArea] = {
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      averageDifficulty: avgDifficulty,
    };
  }

  const correctCount = responseArray.filter(r => r).length;

  return {
    theta,
    standardError: se,
    scaledScore,
    passThreshold: PASS_THRESHOLD,
    passed: scaledScore >= PASS_THRESHOLD,
    correctCount,
    totalAttempted: responseArray.length,
    areaBreakdown,
  };
}

/**
 * Predict probability of passing given current performance
 */
export function predictPassProbability(
  currentScore: TRIScore,
  remainingQuestions: number = 0
): number {
  if (remainingQuestions === 0) {
    return currentScore.passed ? 1 : 0;
  }

  // Use normal distribution to estimate probability
  // Given current theta and SE, what's P(scaled_score >= PASS_THRESHOLD)?
  const targetTheta = scaledScoreToTheta(PASS_THRESHOLD);
  const z = (currentScore.theta - targetTheta) / currentScore.standardError;

  // Approximate normal CDF
  return normalCDF(z);
}

/**
 * Standard normal cumulative distribution function (approximation)
 */
export function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}
