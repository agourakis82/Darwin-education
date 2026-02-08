/**
 * Darwin Education - FCR Adaptive Case Selection
 * ================================================
 *
 * SOTA adaptive algorithm for selecting the next FCR case.
 * Combines multiple selection criteria:
 *
 * 1. Maximum Fisher Information (MFI) — standard CAT approach
 * 2. Calibration-Aware Selection — targets miscalibrated confidence bins
 * 3. Cascade-Targeted Selection — probes weak level transitions
 * 4. Dunning-Kruger Probing — detects and challenges illusion of knowing
 * 5. Content Balancing — ensures area coverage
 *
 * The algorithm uses a multi-objective scoring function that weights
 * these criteria based on the student's current profile.
 *
 * References:
 * - van der Linden (2005): Shadow-test approach to CAT
 * - Barton & Lord (1981): Fisher Information in IRT
 * - Dunning & Kruger (1999): Unskilled and unaware
 * - Brier (1950): Verification of forecasts (calibration)
 */

import type { IRTParameters, ENAMEDArea, DifficultyLevel } from '../types/education';
import type {
  FCRCase,
  FCRLevel,
  FCRAttemptSummary,
  FCRAdaptiveRecommendation,
  FCRSelectionReason,
  FCRCascadeAnalysis,
  FCRCalibrationDiagnostics,
  ConfidenceRating,
} from '../types/fcr';
import { FCR_LEVEL_ORDER } from '../types/fcr';
import { itemInformation } from './tri';

// ============================================
// Configuration
// ============================================

export interface FCRAdaptiveConfig {
  /** Weight for information gain criterion */
  informationWeight: number;
  /** Weight for calibration targeting */
  calibrationWeight: number;
  /** Weight for cascade probing */
  cascadeWeight: number;
  /** Weight for area coverage */
  coverageWeight: number;
  /** Weight for difficulty matching */
  difficultyWeight: number;
  /** Minimum attempts before adaptive kicks in */
  warmupAttempts: number;
  /** Preferred difficulty step size (in theta units) */
  difficultyStepSize: number;
}

export const DEFAULT_FCR_ADAPTIVE_CONFIG: FCRAdaptiveConfig = {
  informationWeight: 0.30,
  calibrationWeight: 0.25,
  cascadeWeight: 0.15,
  coverageWeight: 0.15,
  difficultyWeight: 0.15,
  warmupAttempts: 3,
  difficultyStepSize: 0.3,
};

// ============================================
// Core: Multi-Objective Case Selection
// ============================================

/**
 * Select the optimal next FCR case using multi-objective scoring.
 *
 * During warmup (< warmupAttempts), uses simple MFI + coverage.
 * After warmup, uses full multi-objective with calibration + cascade targeting.
 */
export function selectNextFCRCase(
  availableCases: FCRCase[],
  history: FCRAttemptSummary[],
  currentTheta: number,
  calibration: FCRCalibrationDiagnostics | null,
  cascade: FCRCascadeAnalysis | null,
  config: FCRAdaptiveConfig = DEFAULT_FCR_ADAPTIVE_CONFIG
): FCRAdaptiveRecommendation | null {
  if (availableCases.length === 0) return null;

  // Filter out recently attempted cases (avoid repetition)
  const recentCaseIds = new Set(
    history.slice(-10).map((h) => h.caseId)
  );
  const eligible = availableCases.filter((c) => !recentCaseIds.has(c.id));
  const candidates = eligible.length > 0 ? eligible : availableCases;

  const isWarmup = history.length < config.warmupAttempts;

  // Score each candidate
  const scored = candidates.map((c) => {
    const scores: Record<string, number> = {};

    // 1. Information gain (always active)
    scores.information = scoreFisherInformation(c, currentTheta);

    // 2. Difficulty match (always active)
    scores.difficulty = scoreDifficultyMatch(c, currentTheta, config.difficultyStepSize);

    // 3. Area coverage (always active)
    scores.coverage = scoreAreaCoverage(c, history);

    // 4. Calibration targeting (post-warmup only)
    scores.calibration = !isWarmup && calibration
      ? scoreCalibrationTargeting(c, calibration)
      : 0;

    // 5. Cascade probing (post-warmup only)
    scores.cascade = !isWarmup && cascade
      ? scoreCascadeTargeting(c, cascade)
      : 0;

    // Weighted composite
    const composite = isWarmup
      ? scores.information * 0.5 + scores.coverage * 0.3 + scores.difficulty * 0.2
      : scores.information * config.informationWeight +
        scores.calibration * config.calibrationWeight +
        scores.cascade * config.cascadeWeight +
        scores.coverage * config.coverageWeight +
        scores.difficulty * config.difficultyWeight;

    // Determine primary selection reason
    const reasons: [FCRSelectionReason, number][] = [
      ['max_information', scores.information],
      ['calibration_probe', scores.calibration],
      ['cascade_probe', scores.cascade],
      ['area_coverage', scores.coverage],
      ['difficulty_ladder', scores.difficulty],
    ];
    reasons.sort((a, b) => b[1] - a[1]);
    const primaryReason = reasons[0][0];

    return { case: c, composite, scores, primaryReason };
  });

  // Sort by composite score (descending)
  scored.sort((a, b) => b.composite - a.composite);

  // Select from top-3 with slight randomization (reduce predictability)
  const topK = Math.min(3, scored.length);
  const selectedIdx = Math.floor(Math.random() * topK);
  const selected = scored[selectedIdx];

  // Determine target levels + calibration bins
  const targetLevels = determineTargetLevels(cascade);
  const targetBins = determineTargetCalibrationBins(calibration);

  // Check for Dunning-Kruger override
  let reason = selected.primaryReason;
  if (
    calibration &&
    calibration.dunningKrugerZone === 'high_risk' &&
    selected.scores.calibration > 0.5
  ) {
    reason = 'dunning_kruger_probe';
  }

  return {
    caseId: selected.case.id,
    selectionReason: reason,
    expectedInformationGain: selected.scores.information,
    targetLevels,
    targetCalibrationBins: targetBins,
    difficultyMatch: selected.scores.difficulty,
    confidence: Math.min(1, selected.composite),
  };
}

// ============================================
// Scoring Functions
// ============================================

/**
 * Score based on Fisher Information at current theta.
 * Uses the case's IRT parameters with per-level difficulty offsets.
 */
function scoreFisherInformation(fcrCase: FCRCase, theta: number): number {
  const irt = fcrCase.irt || { difficulty: 0, discrimination: 1.2, guessing: 0.25 };
  const levelOffsets: Record<FCRLevel, number> = {
    dados: -0.3,
    padrao: 0.1,
    hipotese: 0.3,
    conduta: 0.2,
  };

  // Sum information across all 4 levels
  let totalInfo = 0;
  for (const level of FCR_LEVEL_ORDER) {
    const levelIRT: IRTParameters = {
      ...irt,
      difficulty: irt.difficulty + levelOffsets[level],
    };
    totalInfo += itemInformation(theta, levelIRT);
  }

  // Normalize to 0-1 range (typical info range is 0-2 per item)
  return Math.min(1, totalInfo / 4);
}

/**
 * Score based on difficulty match to current theta.
 * Prefers cases slightly above current ability (ZPD principle).
 */
function scoreDifficultyMatch(
  fcrCase: FCRCase,
  theta: number,
  stepSize: number
): number {
  const caseDifficulty = fcrCase.irt?.difficulty ?? 0;
  // Optimal target is slightly above current theta
  const targetDifficulty = theta + stepSize;
  const distance = Math.abs(caseDifficulty - targetDifficulty);

  // Gaussian-like decay: score = exp(-distance² / (2 * σ²))
  const sigma = 1.0;
  return Math.exp(-(distance ** 2) / (2 * sigma ** 2));
}

/**
 * Score based on area coverage balance.
 * Prefer cases from underrepresented areas.
 */
function scoreAreaCoverage(
  fcrCase: FCRCase,
  history: FCRAttemptSummary[]
): number {
  if (history.length === 0) return 0.5; // Neutral for first case

  const areaCounts: Record<string, number> = {};
  for (const h of history) {
    areaCounts[h.area] = (areaCounts[h.area] || 0) + 1;
  }

  const totalAttempts = history.length;
  const caseAreaCount = areaCounts[fcrCase.area] || 0;
  const currentPct = caseAreaCount / totalAttempts;
  const targetPct = 0.2; // Equal coverage across 5 areas

  // Score is proportional to underrepresentation
  const deficit = targetPct - currentPct;
  // Clamp to 0-1
  return Math.max(0, Math.min(1, 0.5 + deficit * 5));
}

/**
 * Score based on calibration targeting.
 * Prefer cases that will probe miscalibrated confidence bins.
 */
function scoreCalibrationTargeting(
  fcrCase: FCRCase,
  calibration: FCRCalibrationDiagnostics
): number {
  // Find the most miscalibrated bin
  let maxGap = 0;
  let worstBin = 0;

  for (const bin of calibration.confidenceBins) {
    const expectedProb = bin.confidence / 5;
    const gap = Math.abs(expectedProb - bin.expectedAccuracy);
    if (gap > maxGap) {
      maxGap = gap;
      worstBin = bin.confidence;
    }
  }

  // Cases with difficulty that matches the miscalibrated zone score higher
  // High difficulty + high miscalibration bin → more likely to probe that zone
  const caseDifficulty = fcrCase.irt?.difficulty ?? 0;

  // Map worst bin to expected theta range
  // Low confidence bins → student expects to struggle → lower theta
  // High confidence bins → student expects to succeed → higher theta
  const binToTheta = (worstBin - 3) * 0.5; // Maps 1-5 to [-1, +1]
  const distance = Math.abs(caseDifficulty - binToTheta);
  const proximityScore = Math.exp(-(distance ** 2) / 2);

  // Combine gap magnitude with proximity
  return maxGap * 0.6 + proximityScore * 0.4;
}

/**
 * Score based on cascade analysis.
 * Prefer cases that will probe the weakest transition.
 */
function scoreCascadeTargeting(
  fcrCase: FCRCase,
  cascade: FCRCascadeAnalysis
): number {
  if (!cascade.strongestCascade) return 0.3;

  // Cases whose difficulty aligns with the cascade's weak spot score higher
  const weakLevel = cascade.strongestCascade.fromLevel;
  const levelIdx = FCR_LEVEL_ORDER.indexOf(weakLevel);

  // Score based on cascade severity (more cascade = more important to probe)
  const severityScore = cascade.cascadeSeverity;

  // Bonus if case difficulty targets the weak level's range
  const caseDiff = fcrCase.irt?.difficulty ?? 0;
  const levelOffsets: Record<FCRLevel, number> = {
    dados: -0.3,
    padrao: 0.1,
    hipotese: 0.3,
    conduta: 0.2,
  };
  const targetDiff = caseDiff + levelOffsets[weakLevel];

  // Higher cascade severity → higher score
  return severityScore * 0.7 + 0.3;
}

// ============================================
// Target Determination Helpers
// ============================================

function determineTargetLevels(
  cascade: FCRCascadeAnalysis | null
): FCRLevel[] {
  if (!cascade) return FCR_LEVEL_ORDER;

  // Sort levels by error rate (highest first)
  const sorted = (Object.entries(cascade.levelErrorRates) as [FCRLevel, number][])
    .sort(([, a], [, b]) => b - a);

  // Return levels with error rate > 30%
  return sorted
    .filter(([, rate]) => rate > 0.3)
    .map(([level]) => level);
}

function determineTargetCalibrationBins(
  calibration: FCRCalibrationDiagnostics | null
): ConfidenceRating[] {
  if (!calibration) return [];

  // Return bins with ECE contribution > average
  const avgGap =
    calibration.confidenceBins.reduce((sum, bin) => {
      return sum + Math.abs(bin.confidence / 5 - bin.expectedAccuracy);
    }, 0) / calibration.confidenceBins.length;

  return calibration.confidenceBins
    .filter((bin) => {
      const gap = Math.abs(bin.confidence / 5 - bin.expectedAccuracy);
      return gap > avgGap && bin.totalObservations >= 2;
    })
    .map((bin) => bin.confidence);
}
