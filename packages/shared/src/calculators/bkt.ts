/**
 * Bayesian Knowledge Tracing (BKT) Calculator
 * =============================================
 *
 * Per-knowledge-component mastery tracking using Hidden Markov Model.
 *
 * Model:
 *   P(L_0) = prior probability of already knowing the KC
 *   P(T)   = probability of learning per opportunity
 *   P(S)   = probability of slip (wrong despite knowing)
 *   P(G)   = probability of guess (right despite not knowing)
 *
 * Update equations:
 *   After observing correct:
 *     P(L_n | correct) = P(L_n) * (1-P(S)) / P(correct)
 *     where P(correct) = P(L_n)*(1-P(S)) + (1-P(L_n))*P(G)
 *
 *   After observing incorrect:
 *     P(L_n | incorrect) = P(L_n) * P(S) / P(incorrect)
 *     where P(incorrect) = P(L_n)*P(S) + (1-P(L_n))*(1-P(G))
 *
 *   Learning transition:
 *     P(L_{n+1}) = P(L_n | obs_n) + (1 - P(L_n | obs_n)) * P(T)
 *
 * Reference: Corbett, A. T. & Anderson, J. R. (1995). Knowledge tracing:
 * Modeling the acquisition of procedural knowledge. UMUAI, 4(4).
 */

import type {
  BKTParameters,
  BKTMasteryState,
  BKTObservation,
  MasteryClassification,
  MasteryTrajectoryPoint,
  MasteryHeatmapData,
  BKTEMResult,
  BKTEMConfig,
} from '../types/bkt';
import {
  DEFAULT_BKT_PARAMS,
  BKT_MASTERY_THRESHOLDS,
  DEFAULT_BKT_EM_CONFIG,
} from '../types/bkt';
import type { ENAMEDArea } from '../types/education';

// ============================================
// Core BKT Updates
// ============================================

/**
 * Predict P(correct) given current mastery and params.
 */
export function predictCorrect(
  mastery: number,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): number {
  return mastery * (1 - params.pSlip) + (1 - mastery) * params.pGuess;
}

/**
 * Bayesian update: compute P(L_n | observation).
 */
export function posteriorUpdate(
  priorMastery: number,
  correct: boolean,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): number {
  if (correct) {
    // P(L | correct) = P(L) * (1 - P(S)) / P(correct)
    const pCorrect = predictCorrect(priorMastery, params);
    if (pCorrect <= 0) return priorMastery;
    return (priorMastery * (1 - params.pSlip)) / pCorrect;
  } else {
    // P(L | incorrect) = P(L) * P(S) / P(incorrect)
    const pIncorrect = 1 - predictCorrect(priorMastery, params);
    if (pIncorrect <= 0) return priorMastery;
    return (priorMastery * params.pSlip) / pIncorrect;
  }
}

/**
 * Learning transition: P(L_{n+1}) = P(L_n|obs) + (1-P(L_n|obs)) * P(T)
 */
export function learningTransition(
  posteriorMastery: number,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): number {
  return posteriorMastery + (1 - posteriorMastery) * params.pTransit;
}

/**
 * Full single-step update: observe → posterior → transition.
 */
export function updateMastery(
  priorMastery: number,
  correct: boolean,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): number {
  const posterior = posteriorUpdate(priorMastery, correct, params);
  return learningTransition(posterior, params);
}

// ============================================
// Mastery Classification
// ============================================

/**
 * Classify mastery level.
 */
export function classifyMastery(
  mastery: number,
  hasObservations: boolean = true
): MasteryClassification {
  if (!hasObservations) return 'not_started';
  if (mastery >= BKT_MASTERY_THRESHOLDS.mastered) return 'mastered';
  if (mastery >= BKT_MASTERY_THRESHOLDS.nearMastery) return 'near_mastery';
  return 'learning';
}

// ============================================
// Trajectory Tracing
// ============================================

/**
 * Trace mastery trajectory over a sequence of observations.
 * Returns the full trajectory (mastery after each observation).
 */
export function traceMastery(
  observations: BKTObservation[],
  params: BKTParameters = DEFAULT_BKT_PARAMS
): MasteryTrajectoryPoint[] {
  const trajectory: MasteryTrajectoryPoint[] = [];
  let mastery = params.pInit;

  for (let i = 0; i < observations.length; i++) {
    mastery = updateMastery(mastery, observations[i].correct, params);
    trajectory.push({
      index: i,
      mastery,
      correct: observations[i].correct,
      timestamp: observations[i].timestamp,
    });
  }

  return trajectory;
}

/**
 * Compute final mastery state for a KC.
 */
export function computeMasteryState(
  kcId: string,
  observations: BKTObservation[],
  params: BKTParameters = DEFAULT_BKT_PARAMS
): BKTMasteryState {
  let mastery = params.pInit;
  let correctCount = 0;

  for (const obs of observations) {
    mastery = updateMastery(mastery, obs.correct, params);
    if (obs.correct) correctCount++;
  }

  return {
    kcId,
    mastery,
    opportunityCount: observations.length,
    correctCount,
    classification: classifyMastery(mastery, observations.length > 0),
    lastObservationAt: observations.length > 0
      ? observations[observations.length - 1].timestamp
      : null,
  };
}

// ============================================
// Heatmap Aggregation
// ============================================

/**
 * Build mastery heatmap data from per-KC mastery states.
 */
export function buildMasteryHeatmap(
  masteryStates: BKTMasteryState[],
  kcNames: Map<string, { name: string; area: ENAMEDArea }>
): MasteryHeatmapData {
  const areas: ENAMEDArea[] = [
    'clinica_medica', 'cirurgia', 'ginecologia_obstetricia',
    'pediatria', 'saude_coletiva',
  ];

  const kcsByArea: MasteryHeatmapData['kcsByArea'] = {
    clinica_medica: [],
    cirurgia: [],
    ginecologia_obstetricia: [],
    pediatria: [],
    saude_coletiva: [],
  };

  let totalMastery = 0;
  let masteredCount = 0;

  for (const state of masteryStates) {
    const kcInfo = kcNames.get(state.kcId);
    if (!kcInfo) continue;

    kcsByArea[kcInfo.area].push({
      kcId: state.kcId,
      kcName: kcInfo.name,
      mastery: state.mastery,
      classification: state.classification,
      opportunityCount: state.opportunityCount,
    });

    totalMastery += state.mastery;
    if (state.classification === 'mastered') masteredCount++;
  }

  // Compute per-area mastery
  const areaMastery: Record<ENAMEDArea, number> = {} as Record<ENAMEDArea, number>;
  for (const area of areas) {
    const kcs = kcsByArea[area];
    areaMastery[area] = kcs.length > 0
      ? kcs.reduce((sum, kc) => sum + kc.mastery, 0) / kcs.length
      : 0;
  }

  return {
    areas,
    kcsByArea,
    areaMastery,
    overallMastery: masteryStates.length > 0
      ? totalMastery / masteryStates.length
      : 0,
    masteredCount,
    totalKCs: masteryStates.length,
  };
}

// ============================================
// EM Parameter Estimation
// ============================================

/**
 * Estimate BKT parameters using Expectation-Maximization.
 * Requires at least minObservations data points.
 */
export function estimateBKTParams(
  observations: BKTObservation[],
  config: Partial<BKTEMConfig> = {}
): BKTEMResult {
  const cfg = { ...DEFAULT_BKT_EM_CONFIG, ...config };

  if (observations.length < cfg.minObservations) {
    return {
      params: { ...DEFAULT_BKT_PARAMS },
      iterations: 0,
      logLikelihood: 0,
      converged: false,
    };
  }

  let params = { ...DEFAULT_BKT_PARAMS };
  let prevLL = -Infinity;

  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    // E-step: compute expected mastery at each time point
    const masteryPrior: number[] = [];
    const masteryPosterior: number[] = [];
    let mastery = params.pInit;

    for (let i = 0; i < observations.length; i++) {
      masteryPrior.push(mastery);
      const posterior = posteriorUpdate(mastery, observations[i].correct, params);
      masteryPosterior.push(posterior);
      mastery = learningTransition(posterior, params);
    }

    // M-step: re-estimate parameters
    let sumPInit = 0;
    let sumPT = 0;
    let countPT = 0;
    let slipNum = 0;
    let slipDen = 0;
    let guessNum = 0;
    let guessDen = 0;

    for (let i = 0; i < observations.length; i++) {
      const pL = masteryPrior[i];

      if (i === 0) {
        sumPInit += pL;
      }

      // Estimate P(T) from transitions
      if (i > 0) {
        const pLprev = masteryPosterior[i - 1];
        if (pLprev < 1) {
          sumPT += (masteryPrior[i] - pLprev) / (1 - pLprev);
          countPT++;
        }
      }

      // Estimate P(S) and P(G)
      if (observations[i].correct) {
        // P(S) ≈ P(L) * P(S) / P(correct_given_L)
        slipDen += pL;
        // For correct: contribution is minimal to slip
        guessNum += (1 - pL);
        guessDen += (1 - pL);
      } else {
        slipNum += pL;
        slipDen += pL;
        guessDen += (1 - pL);
      }
    }

    const newParams: BKTParameters = {
      pInit: Math.max(0.01, Math.min(0.99, sumPInit)),
      pTransit: countPT > 0 ? Math.max(0.01, Math.min(0.99, sumPT / countPT)) : params.pTransit,
      pSlip: slipDen > 0 ? Math.max(0.01, Math.min(0.40, slipNum / slipDen)) : params.pSlip,
      pGuess: guessDen > 0 ? Math.max(0.01, Math.min(0.40, guessNum / guessDen)) : params.pGuess,
    };

    // Compute log-likelihood
    let ll = 0;
    let m = params.pInit;
    for (const obs of observations) {
      const pCorrect = predictCorrect(m, newParams);
      ll += obs.correct ? Math.log(Math.max(pCorrect, 1e-10)) : Math.log(Math.max(1 - pCorrect, 1e-10));
      m = updateMastery(m, obs.correct, newParams);
    }

    // Check convergence
    const paramChange = Math.abs(newParams.pInit - params.pInit) +
      Math.abs(newParams.pTransit - params.pTransit) +
      Math.abs(newParams.pSlip - params.pSlip) +
      Math.abs(newParams.pGuess - params.pGuess);

    params = newParams;

    if (paramChange < cfg.convergenceThreshold) {
      return { params, iterations: iter + 1, logLikelihood: ll, converged: true };
    }
    prevLL = ll;
  }

  // Did not converge within max iterations
  let finalLL = 0;
  let m = params.pInit;
  for (const obs of observations) {
    const pCorrect = predictCorrect(m, params);
    finalLL += obs.correct ? Math.log(Math.max(pCorrect, 1e-10)) : Math.log(Math.max(1 - pCorrect, 1e-10));
    m = updateMastery(m, obs.correct, params);
  }

  return {
    params,
    iterations: cfg.maxIterations,
    logLikelihood: finalLL,
    converged: false,
  };
}
