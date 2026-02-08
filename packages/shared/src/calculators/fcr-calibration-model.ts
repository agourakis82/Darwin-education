/**
 * Darwin Education - FCR Bayesian Calibration Model
 * ===================================================
 *
 * SOTA calibration analysis going beyond simple Brier Score:
 *
 * 1. Beta-Binomial Model — Bayesian posterior for P(correct | confidence=k)
 * 2. Expected Calibration Error (ECE) — standard ML calibration metric
 * 3. Maximum Calibration Error (MCE) — worst-case bin metric
 * 4. Dunning-Kruger Index — systematic overconfidence at low ability
 * 5. Calibration Drift — tracking calibration changes over time
 * 6. Cross-Level Cascade Analysis — error propagation detection
 *
 * References:
 * - Naeini et al. (2015): Obtaining Well Calibrated Probabilities (ECE)
 * - Guo et al. (2017): On Calibration of Modern Neural Networks
 * - Dunning & Kruger (1999): Unskilled and Unaware of It
 * - DeGroot & Fienberg (1983): Comparison and Evaluation of Forecasters
 */

import type {
  FCRLevel,
  ConfidenceRating,
  CalibrationQuadrant,
  FCRCalibrationDiagnostics,
  ConfidenceBinStats,
  ReliabilityPoint,
  DunningKrugerZone,
  FCRCascadeAnalysis,
  LevelTransition,
  FCRReasoningProfile,
  FCRAttemptSummary,
} from '../types/fcr';
import { FCR_LEVEL_ORDER } from '../types/fcr';

// ============================================
// Beta-Binomial Calibration Model
// ============================================

/** Prior parameters for Beta distribution (weakly informative) */
const BETA_PRIOR_ALPHA = 1;
const BETA_PRIOR_BETA = 1;

/**
 * Build Bayesian calibration model from historical attempt data.
 *
 * For each confidence bin k ∈ {1,2,3,4,5}, we model:
 *   P(correct | confidence=k) ~ Beta(α_k, β_k)
 *
 * Where:
 *   α_k = prior_α + count(correct AND confidence=k)
 *   β_k = prior_β + count(wrong AND confidence=k)
 *
 * This gives us:
 *   E[P(correct | confidence=k)] = α_k / (α_k + β_k)
 *   Var[P(correct | confidence=k)] = (α_k × β_k) / ((α_k + β_k)² × (α_k + β_k + 1))
 */
export function buildCalibrationModel(
  history: FCRAttemptSummary[]
): FCRCalibrationDiagnostics {
  // Initialize bins
  const bins: Map<ConfidenceRating, { correct: number; total: number }> = new Map();
  for (let k = 1; k <= 5; k++) {
    bins.set(k as ConfidenceRating, { correct: 0, total: 0 });
  }

  // Collect theta values for DK analysis
  const thetaConfidencePairs: { theta: number; avgConfidence: number }[] = [];

  // Accumulate observations across all attempts
  for (const attempt of history) {
    let attemptConfidenceSum = 0;
    let levelCount = 0;

    for (const lr of attempt.levelResults) {
      const bin = bins.get(lr.confidence);
      if (bin) {
        bin.total++;
        if (lr.correct) bin.correct++;
      }
      attemptConfidenceSum += lr.confidence;
      levelCount++;
    }

    if (levelCount > 0) {
      thetaConfidencePairs.push({
        theta: attempt.theta,
        avgConfidence: attemptConfidenceSum / levelCount,
      });
    }
  }

  // Build Beta-Binomial posteriors
  const confidenceBins: ConfidenceBinStats[] = [];
  for (let k = 1; k <= 5; k++) {
    const cr = k as ConfidenceRating;
    const bin = bins.get(cr)!;
    const alpha = BETA_PRIOR_ALPHA + bin.correct;
    const beta = BETA_PRIOR_BETA + (bin.total - bin.correct);

    confidenceBins.push({
      confidence: cr,
      alpha,
      beta,
      expectedAccuracy: alpha / (alpha + beta),
      totalObservations: bin.total,
    });
  }

  // Build reliability diagram
  const reliabilityDiagram = buildReliabilityDiagram(confidenceBins);

  // Calculate ECE and MCE
  const totalObs = confidenceBins.reduce((s, b) => s + b.totalObservations, 0);
  const { ece, mce } = calculateECEandMCE(confidenceBins, totalObs);

  // Dunning-Kruger analysis
  const { index: dkIndex, zone: dkZone } = analyzeDunningKruger(thetaConfidencePairs);

  // Calibration drift
  const { drift, trending } = analyzeCalibrationDrift(history);

  return {
    ece,
    mce,
    confidenceBins,
    reliabilityDiagram,
    dunningKrugerIndex: dkIndex,
    dunningKrugerZone: dkZone,
    calibrationDrift: drift,
    calibrationTrending: trending,
  };
}

// ============================================
// Expected Calibration Error (ECE / MCE)
// ============================================

/**
 * Calculate ECE and MCE.
 *
 * ECE = Σ (n_k / N) × |acc_k - conf_k|
 * MCE = max_k |acc_k - conf_k|
 *
 * Where:
 *   n_k = number of observations in bin k
 *   N = total observations
 *   acc_k = observed accuracy in bin k
 *   conf_k = expected confidence probability (k/5)
 */
function calculateECEandMCE(
  bins: ConfidenceBinStats[],
  totalObs: number
): { ece: number; mce: number } {
  if (totalObs === 0) return { ece: 0, mce: 0 };

  let ece = 0;
  let mce = 0;

  for (const bin of bins) {
    if (bin.totalObservations === 0) continue;

    const confProb = bin.confidence / 5;
    const gap = Math.abs(bin.expectedAccuracy - confProb);

    ece += (bin.totalObservations / totalObs) * gap;
    mce = Math.max(mce, gap);
  }

  return {
    ece: Math.round(ece * 1000) / 1000,
    mce: Math.round(mce * 1000) / 1000,
  };
}

// ============================================
// Reliability Diagram
// ============================================

/**
 * Build reliability diagram data for visualization.
 * Each point represents a confidence bin with observed vs expected accuracy.
 */
function buildReliabilityDiagram(
  bins: ConfidenceBinStats[]
): ReliabilityPoint[] {
  return bins
    .filter((b) => b.totalObservations > 0)
    .map((b) => {
      const n = b.totalObservations;
      const p = b.expectedAccuracy;
      // Standard error of a proportion: sqrt(p(1-p)/n)
      const se = n > 1 ? Math.sqrt((p * (1 - p)) / n) : 0.5;

      return {
        binMidpoint: b.confidence / 5,
        observedAccuracy: p,
        count: n,
        standardError: Math.round(se * 1000) / 1000,
      };
    });
}

// ============================================
// Dunning-Kruger Analysis
// ============================================

/**
 * Detect Dunning-Kruger effect from theta-confidence relationship.
 *
 * The DK effect manifests as:
 *   - Low-ability students overestimate their performance
 *   - High-ability students slightly underestimate
 *
 * We compute the correlation between:
 *   overconfidence(θ) = avgConfidence/5 - predictedAccuracy(θ)
 * and theta (ability).
 *
 * A negative correlation (low theta → high overconfidence) indicates DK.
 *
 * DK Index:
 *   -1.0 = strong DK effect
 *   0.0  = no systematic pattern
 *   +1.0 = inverse DK (high ability overconfident)
 */
function analyzeDunningKruger(
  pairs: { theta: number; avgConfidence: number }[]
): { index: number; zone: DunningKrugerZone } {
  if (pairs.length < 3) {
    return { index: 0, zone: 'low_risk' };
  }

  // Calculate overconfidence for each attempt
  const overconfidenceValues = pairs.map((p) => {
    // Predicted accuracy given theta (logistic approximation)
    const predictedAcc = 1 / (1 + Math.exp(-1.2 * p.theta));
    const selfAssessedAcc = p.avgConfidence / 5;
    return {
      theta: p.theta,
      overconfidence: selfAssessedAcc - predictedAcc,
    };
  });

  // Pearson correlation between theta and overconfidence
  const n = overconfidenceValues.length;
  const meanTheta = overconfidenceValues.reduce((s, v) => s + v.theta, 0) / n;
  const meanOC = overconfidenceValues.reduce((s, v) => s + v.overconfidence, 0) / n;

  let covThetaOC = 0;
  let varTheta = 0;
  let varOC = 0;

  for (const v of overconfidenceValues) {
    const dTheta = v.theta - meanTheta;
    const dOC = v.overconfidence - meanOC;
    covThetaOC += dTheta * dOC;
    varTheta += dTheta ** 2;
    varOC += dOC ** 2;
  }

  const denom = Math.sqrt(varTheta * varOC);
  const correlation = denom > 0 ? covThetaOC / denom : 0;

  // DK index is the negative of the correlation
  // (negative correlation → positive DK index)
  const dkIndex = Math.round(-correlation * 1000) / 1000;

  // Classify zone
  let zone: DunningKrugerZone;
  if (dkIndex > 0.4) {
    // Strong DK: low theta correlates with overconfidence
    zone = 'high_risk';
  } else if (dkIndex > 0.15) {
    zone = 'moderate';
  } else if (dkIndex > -0.15) {
    zone = 'low_risk';
  } else {
    // Inverse DK: high theta students are overconfident
    zone = 'inverse';
  }

  return { index: dkIndex, zone };
}

// ============================================
// Calibration Drift Analysis
// ============================================

/**
 * Analyze how calibration is changing over time.
 *
 * Uses a sliding window to compare recent calibration to earlier calibration.
 * Positive drift = calibration improving, negative = degrading.
 */
function analyzeCalibrationDrift(
  history: FCRAttemptSummary[]
): { drift: number; trending: 'improving' | 'stable' | 'degrading' } {
  if (history.length < 4) {
    return { drift: 0, trending: 'stable' };
  }

  // Sort by date
  const sorted = [...history].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const earlyHalf = sorted.slice(0, midpoint);
  const lateHalf = sorted.slice(midpoint);

  const earlyCalibration = meanCalibration(earlyHalf);
  const lateCalibration = meanCalibration(lateHalf);

  const drift = Math.round((lateCalibration - earlyCalibration) * 1000) / 1000;

  let trending: 'improving' | 'stable' | 'degrading';
  if (drift > 5) {
    trending = 'improving';
  } else if (drift < -5) {
    trending = 'degrading';
  } else {
    trending = 'stable';
  }

  return { drift, trending };
}

function meanCalibration(attempts: FCRAttemptSummary[]): number {
  if (attempts.length === 0) return 0;
  return (
    attempts.reduce((s, a) => s + a.calibrationScore, 0) / attempts.length
  );
}

// ============================================
// Cross-Level Cascade Analysis
// ============================================

/**
 * Analyze how errors propagate across FCR levels.
 *
 * Builds a transition matrix of conditional error probabilities:
 *   P(wrong at level j | wrong at level i)
 *   P(wrong at level j | correct at level i)
 *
 * Cascade lift = P(wrong_j | wrong_i) / P(wrong_j | correct_i)
 *   > 1.0 → errors at level i increase errors at level j (cascade)
 *   = 1.0 → no relationship
 *   < 1.0 → errors at level i decrease errors at level j (compensation)
 *
 * A high cascade severity means the student's reasoning is sequential:
 * fixing foundation (level 1) would fix downstream errors.
 *
 * A low cascade severity means errors are independent:
 * each level needs separate remediation.
 */
export function analyzeCascade(
  history: FCRAttemptSummary[]
): FCRCascadeAnalysis {
  const transitions: LevelTransition[] = [];

  // Collect per-level error data
  const levelErrors: Record<FCRLevel, { correct: number; total: number }> = {
    dados: { correct: 0, total: 0 },
    padrao: { correct: 0, total: 0 },
    hipotese: { correct: 0, total: 0 },
    conduta: { correct: 0, total: 0 },
  };

  // Build conditional counts for each pair of levels
  const pairCounts: Map<
    string,
    {
      errorGivenError: number;
      correctGivenError: number;
      errorGivenCorrect: number;
      correctGivenCorrect: number;
    }
  > = new Map();

  // Initialize all pairs
  for (let i = 0; i < FCR_LEVEL_ORDER.length; i++) {
    for (let j = i + 1; j < FCR_LEVEL_ORDER.length; j++) {
      const key = `${FCR_LEVEL_ORDER[i]}→${FCR_LEVEL_ORDER[j]}`;
      pairCounts.set(key, {
        errorGivenError: 0,
        correctGivenError: 0,
        errorGivenCorrect: 0,
        correctGivenCorrect: 0,
      });
    }
  }

  // Process each attempt
  for (const attempt of history) {
    const levelMap = new Map<FCRLevel, boolean>();
    for (const lr of attempt.levelResults) {
      levelMap.set(lr.level, lr.correct);
      const entry = levelErrors[lr.level];
      entry.total++;
      if (lr.correct) entry.correct++;
    }

    // Update pair counts
    for (let i = 0; i < FCR_LEVEL_ORDER.length; i++) {
      for (let j = i + 1; j < FCR_LEVEL_ORDER.length; j++) {
        const fromLevel = FCR_LEVEL_ORDER[i];
        const toLevel = FCR_LEVEL_ORDER[j];
        const key = `${fromLevel}→${toLevel}`;
        const pair = pairCounts.get(key);
        if (!pair) continue;

        const fromCorrect = levelMap.get(fromLevel) ?? true;
        const toCorrect = levelMap.get(toLevel) ?? true;

        if (!fromCorrect && !toCorrect) pair.errorGivenError++;
        if (!fromCorrect && toCorrect) pair.correctGivenError++;
        if (fromCorrect && !toCorrect) pair.errorGivenCorrect++;
        if (fromCorrect && toCorrect) pair.correctGivenCorrect++;
      }
    }
  }

  // Calculate transition probabilities
  let maxLift = 0;
  let strongestCascade: LevelTransition | null = null;

  for (const [key, counts] of pairCounts) {
    const [fromStr, toStr] = key.split('→') as [FCRLevel, FCRLevel];
    const totalFromError = counts.errorGivenError + counts.correctGivenError;
    const totalFromCorrect =
      counts.errorGivenCorrect + counts.correctGivenCorrect;

    const pErrorGivenError =
      totalFromError > 0 ? counts.errorGivenError / totalFromError : 0;
    const pErrorGivenCorrect =
      totalFromCorrect > 0 ? counts.errorGivenCorrect / totalFromCorrect : 0;

    const cascadeLift =
      pErrorGivenCorrect > 0
        ? pErrorGivenError / pErrorGivenCorrect
        : pErrorGivenError > 0
          ? Infinity
          : 1;

    const transition: LevelTransition = {
      fromLevel: fromStr,
      toLevel: toStr,
      pErrorGivenError,
      pErrorGivenCorrect,
      cascadeLift: Math.round(Math.min(cascadeLift, 10) * 100) / 100,
      observations: totalFromError + totalFromCorrect,
    };

    transitions.push(transition);

    if (
      cascadeLift > maxLift &&
      transition.observations >= 3 &&
      isFinite(cascadeLift)
    ) {
      maxLift = cascadeLift;
      strongestCascade = transition;
    }
  }

  // Calculate level error rates
  const levelErrorRates: Record<FCRLevel, number> = {
    dados: 0,
    padrao: 0,
    hipotese: 0,
    conduta: 0,
  };
  for (const level of FCR_LEVEL_ORDER) {
    const entry = levelErrors[level];
    levelErrorRates[level] =
      entry.total > 0
        ? Math.round(((entry.total - entry.correct) / entry.total) * 1000) / 1000
        : 0;
  }

  // Calculate cascade severity (average lift across adjacent pairs, normalized)
  const adjacentLifts = transitions
    .filter((t) => {
      const fromIdx = FCR_LEVEL_ORDER.indexOf(t.fromLevel);
      const toIdx = FCR_LEVEL_ORDER.indexOf(t.toLevel);
      return toIdx === fromIdx + 1 && t.observations >= 2;
    })
    .map((t) => t.cascadeLift);

  const avgLift =
    adjacentLifts.length > 0
      ? adjacentLifts.reduce((s, l) => s + l, 0) / adjacentLifts.length
      : 1;

  // Normalize: lift=1 → severity=0, lift≥3 → severity=1
  const cascadeSeverity = Math.min(1, Math.max(0, (avgLift - 1) / 2));

  // Determine if cascade pattern exists
  const hasCascadePattern = cascadeSeverity > 0.3;

  // Independent error rate: errors at non-adjacent levels not explained by cascade
  const totalErrors = Object.values(levelErrorRates).reduce(
    (s, r) => s + r,
    0
  );
  const independentErrorRate =
    totalErrors > 0 ? totalErrors * (1 - cascadeSeverity) : 0;

  // Classify reasoning profile
  const reasoningProfile = classifyReasoningProfile(
    levelErrorRates,
    cascadeSeverity,
    history.length
  );

  return {
    transitions,
    hasCascadePattern,
    strongestCascade,
    independentErrorRate: Math.round(independentErrorRate * 1000) / 1000,
    cascadeSeverity: Math.round(cascadeSeverity * 1000) / 1000,
    levelErrorRates,
    reasoningProfile,
  };
}

/**
 * Classify the student's reasoning profile based on error patterns.
 */
function classifyReasoningProfile(
  errorRates: Record<FCRLevel, number>,
  cascadeSeverity: number,
  totalAttempts: number
): FCRReasoningProfile {
  if (totalAttempts < 3) return 'robust'; // Insufficient data

  const rates = Object.values(errorRates);
  const avgError = rates.reduce((s, r) => s + r, 0) / rates.length;
  const maxError = Math.max(...rates);

  // Low overall error rate
  if (avgError < 0.2) return 'robust';

  // High cascade severity → sequential reasoning
  if (cascadeSeverity > 0.5) return 'sequential';

  // One level dominates errors → bottleneck
  if (maxError > avgError * 2 && maxError > 0.4) return 'bottleneck';

  // Otherwise → parallel (independent gaps)
  return 'parallel';
}

// ============================================
// Utility: Aggregate Calibration History
// ============================================

/**
 * Build a calibration history summary for the dashboard.
 * Groups by area and computes rolling statistics.
 */
export function buildCalibrationTimeline(
  history: FCRAttemptSummary[],
  windowSize: number = 5
): {
  timeline: {
    date: Date;
    calibrationScore: number;
    overconfidenceIndex: number;
    ece: number;
    rollingCalibration: number;
    rollingOverconfidence: number;
  }[];
  byArea: Record<
    string,
    {
      area: string;
      avgCalibration: number;
      avgOverconfidence: number;
      attempts: number;
    }
  >;
} {
  const sorted = [...history].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const timeline = sorted.map((attempt, i) => {
    // Rolling window
    const windowStart = Math.max(0, i - windowSize + 1);
    const window = sorted.slice(windowStart, i + 1);
    const rollingCalibration =
      window.reduce((s, a) => s + a.calibrationScore, 0) / window.length;
    const rollingOverconfidence =
      window.reduce((s, a) => s + a.overconfidenceIndex, 0) / window.length;

    // Per-attempt ECE (quick approximation from level results)
    let ece = 0;
    if (attempt.levelResults.length > 0) {
      for (const lr of attempt.levelResults) {
        ece += Math.abs(lr.confidence / 5 - (lr.correct ? 1 : 0));
      }
      ece /= attempt.levelResults.length;
    }

    return {
      date: new Date(attempt.completedAt),
      calibrationScore: attempt.calibrationScore,
      overconfidenceIndex: attempt.overconfidenceIndex,
      ece: Math.round(ece * 1000) / 1000,
      rollingCalibration: Math.round(rollingCalibration * 10) / 10,
      rollingOverconfidence:
        Math.round(rollingOverconfidence * 1000) / 1000,
    };
  });

  // By area
  const byAreaMap: Record<
    string,
    { sumCal: number; sumOC: number; count: number }
  > = {};
  for (const attempt of history) {
    const area = attempt.area;
    if (!byAreaMap[area]) {
      byAreaMap[area] = { sumCal: 0, sumOC: 0, count: 0 };
    }
    byAreaMap[area].sumCal += attempt.calibrationScore;
    byAreaMap[area].sumOC += attempt.overconfidenceIndex;
    byAreaMap[area].count++;
  }

  const byArea: Record<
    string,
    {
      area: string;
      avgCalibration: number;
      avgOverconfidence: number;
      attempts: number;
    }
  > = {};
  for (const [area, data] of Object.entries(byAreaMap)) {
    byArea[area] = {
      area,
      avgCalibration: Math.round((data.sumCal / data.count) * 10) / 10,
      avgOverconfidence:
        Math.round((data.sumOC / data.count) * 1000) / 1000,
      attempts: data.count,
    };
  }

  return { timeline, byArea };
}
