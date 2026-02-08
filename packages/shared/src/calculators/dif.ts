/**
 * Differential Item Functioning (DIF) Calculator
 * ================================================
 *
 * Detects items that function differently across groups after controlling
 * for overall ability. Uses Mantel-Haenszel procedure and Lord's Chi-Square.
 *
 * Methods:
 *   1. Mantel-Haenszel: stratify by total score, compute common odds ratio
 *   2. Lord's Chi-Square: compare IRT parameters across groups
 *
 * ETS Classification:
 *   A: |delta_MH| < 1.0 — Negligible DIF
 *   B: 1.0 ≤ |delta_MH| < 1.5 AND significant — Moderate DIF
 *   C: |delta_MH| ≥ 1.5 AND significant — Large DIF
 *
 * Reference: Holland & Thayer (1988). Differential item performance and
 * the Mantel-Haenszel procedure.
 */

import type { IRTParameters } from '../types/education';
import type {
  DIFResponseData,
  DIFGroupDefinition,
  MHContingencyCell,
  MHResult,
  LordResult,
  DIFItemResult,
  DIFAnalysis,
  DIFSummary,
  ETSClassification,
} from '../types/dif';
import { DIF_THRESHOLDS } from '../types/dif';

// ============================================
// Normal CDF (local copy — also available from tri.ts)
// ============================================

function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  return 0.5 * (1.0 + sign * y);
}

/** Chi-square p-value (1 df) from CDF */
function chiSquarePValue(chiSq: number): number {
  if (chiSq <= 0) return 1.0;
  // Use normal approximation: sqrt(chi2) ~ N(0,1) for 1 df
  const z = Math.sqrt(chiSq);
  return 2 * (1 - normalCDF(z));
}

// ============================================
// Mantel-Haenszel Procedure
// ============================================

/**
 * Stratify examinees by total score into K strata.
 */
function stratifyByScore(
  data: DIFResponseData[],
  numStrata: number = 5
): Map<number, DIFResponseData[]> {
  if (data.length === 0) return new Map();

  // Find score range
  const scores = data.map((d) => d.totalScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  if (range === 0) {
    const strata = new Map<number, DIFResponseData[]>();
    strata.set(0, data);
    return strata;
  }

  const strataMap = new Map<number, DIFResponseData[]>();
  const strataWidth = range / numStrata;

  for (const d of data) {
    const stratum = Math.min(
      numStrata - 1,
      Math.floor((d.totalScore - minScore) / strataWidth)
    );
    if (!strataMap.has(stratum)) strataMap.set(stratum, []);
    strataMap.get(stratum)!.push(d);
  }

  return strataMap;
}

/**
 * Compute Mantel-Haenszel statistic for a single item.
 */
export function computeMantelHaenszel(
  focalResponses: DIFResponseData[],
  referenceResponses: DIFResponseData[],
  numStrata: number = 5
): MHResult {
  const allData = [...focalResponses, ...referenceResponses];
  const strata = stratifyByScore(allData, numStrata);

  const contingencyTables: MHContingencyCell[] = [];
  let sumAD_T = 0; // Sum of A_k * D_k / T_k
  let sumBC_T = 0; // Sum of B_k * C_k / T_k
  let sumNumerator = 0; // For chi-square numerator
  let sumVariance = 0;  // For chi-square denominator

  for (const [stratum, stratumData] of strata) {
    const focalInStratum = stratumData.filter(
      (d) => focalResponses.some((f) => f.itemId === d.itemId && f.group === d.group && f.totalScore === d.totalScore)
    );
    const refInStratum = stratumData.filter(
      (d) => referenceResponses.some((r) => r.itemId === d.itemId && r.group === d.group && r.totalScore === d.totalScore)
    );

    const A = focalInStratum.filter((d) => d.correct).length;    // focal correct
    const B = focalInStratum.filter((d) => !d.correct).length;   // focal incorrect
    const C = refInStratum.filter((d) => d.correct).length;      // ref correct
    const D = refInStratum.filter((d) => !d.correct).length;     // ref incorrect
    const T = A + B + C + D;

    if (T === 0) continue;

    contingencyTables.push({
      stratum,
      scoreRange: [0, 0], // Simplified
      focalCorrect: A,
      focalIncorrect: B,
      referenceCorrect: C,
      referenceIncorrect: D,
      total: T,
    });

    sumAD_T += (A * D) / T;
    sumBC_T += (B * C) / T;

    // MH chi-square components
    const n1 = A + B; // focal total
    const n2 = C + D; // reference total
    const m1 = A + C; // correct total
    const m0 = B + D; // incorrect total

    const expectedA = (n1 * m1) / T;
    sumNumerator += A - expectedA;
    sumVariance += (n1 * n2 * m1 * m0) / (T * T * (T - 1 || 1));
  }

  // Common odds ratio
  const alphaMH = sumBC_T > 0 ? sumAD_T / sumBC_T : 1;

  // Delta MH (ETS scale)
  const deltaMH = -2.35 * Math.log(Math.max(alphaMH, 0.001));

  // Chi-square with continuity correction
  const continuityAdj = Math.max(0, Math.abs(sumNumerator) - 0.5);
  const chiSquare = sumVariance > 0
    ? (continuityAdj * continuityAdj) / sumVariance
    : 0;

  const pValue = chiSquarePValue(chiSquare);

  return {
    alphaMH,
    deltaMH,
    chiSquare,
    pValue,
    strataCount: contingencyTables.length,
    contingencyTables,
  };
}

// ============================================
// Lord's Chi-Square (IRT-based)
// ============================================

/**
 * Compute Lord's chi-square for IRT-based DIF detection.
 * Compares item parameters between focal and reference groups.
 */
export function computeLordChiSquare(
  focalParams: IRTParameters,
  referenceParams: IRTParameters
): LordResult {
  const diffDiff = focalParams.difficulty - referenceParams.difficulty;
  const discDiff = focalParams.discrimination - referenceParams.discrimination;
  const guessDiff = (focalParams.guessing ?? 0.25) - (referenceParams.guessing ?? 0.25);

  // Simplified Lord's chi-square (assuming independent parameter estimates)
  // In practice, this would use the variance-covariance matrix of estimates
  const seDiff = 0.3; // Assumed SE for difficulty difference
  const seDisc = 0.15; // Assumed SE for discrimination difference

  const chiSquare = (diffDiff / seDiff) ** 2 + (discDiff / seDisc) ** 2;
  const df = 2; // 2PL comparison
  const pValue = chiSquarePValue(chiSquare / df); // Approximate

  return {
    chiSquare,
    pValue,
    df,
    focalParams,
    referenceParams,
    paramDifferences: {
      difficultyDiff: diffDiff,
      discriminationDiff: discDiff,
      guessingDiff: guessDiff,
    },
  };
}

// ============================================
// ETS Classification
// ============================================

/**
 * Classify DIF severity using ETS A/B/C system.
 */
export function classifyDIF(
  deltaMH: number,
  chiSquare: number,
  sampleSize: number
): ETSClassification {
  const absDelta = Math.abs(deltaMH);
  const pValue = chiSquarePValue(chiSquare);
  const isSignificant = pValue < DIF_THRESHOLDS.significanceLevel;

  if (absDelta >= DIF_THRESHOLDS.moderate && isSignificant) return 'C';
  if (absDelta >= DIF_THRESHOLDS.negligible && isSignificant) return 'B';
  return 'A';
}

// ============================================
// Full DIF Analysis Pipeline
// ============================================

/**
 * Run complete DIF analysis across all items.
 */
export function analyzeDIF(
  responses: DIFResponseData[],
  groupDefinition: DIFGroupDefinition,
  itemParams?: Map<string, IRTParameters>
): DIFAnalysis {
  // Group responses by item
  const itemResponses = new Map<string, DIFResponseData[]>();
  for (const resp of responses) {
    if (!itemResponses.has(resp.itemId)) {
      itemResponses.set(resp.itemId, []);
    }
    itemResponses.get(resp.itemId)!.push(resp);
  }

  const itemResults: DIFItemResult[] = [];

  for (const [itemId, itemData] of itemResponses) {
    const focalData = itemData.filter((d) => d.group === groupDefinition.focalGroup);
    const refData = itemData.filter((d) => d.group === groupDefinition.referenceGroup);

    // Need minimum sample in both groups
    if (focalData.length < 10 || refData.length < 10) continue;

    // Mantel-Haenszel
    const mh = computeMantelHaenszel(focalData, refData);

    // Lord's (optional, if IRT params available)
    let lord: LordResult | undefined;
    if (itemParams?.has(itemId)) {
      // For Lord's, we'd need separate group params. Use overall as proxy.
      const params = itemParams.get(itemId)!;
      // Estimate group-specific difficulty from proportion correct
      const focalPropCorrect = focalData.filter((d) => d.correct).length / focalData.length;
      const refPropCorrect = refData.filter((d) => d.correct).length / refData.length;

      const focalDiffAdj = params.difficulty - Math.log(focalPropCorrect / Math.max(1 - focalPropCorrect, 0.01));
      const refDiffAdj = params.difficulty - Math.log(refPropCorrect / Math.max(1 - refPropCorrect, 0.01));

      lord = computeLordChiSquare(
        { ...params, difficulty: focalDiffAdj },
        { ...params, difficulty: refDiffAdj }
      );
    }

    const etsClassification = classifyDIF(
      mh.deltaMH,
      mh.chiSquare,
      focalData.length + refData.length
    );

    const direction = mh.deltaMH > 0.5
      ? 'favors_reference' as const
      : mh.deltaMH < -0.5
        ? 'favors_focal' as const
        : 'none' as const;

    itemResults.push({
      itemId,
      mh,
      lord,
      etsClassification,
      flagged: etsClassification === 'C',
      direction,
      sampleSizeFocal: focalData.length,
      sampleSizeReference: refData.length,
    });
  }

  // Sort by |delta| descending
  itemResults.sort((a, b) => Math.abs(b.mh.deltaMH) - Math.abs(a.mh.deltaMH));

  const flaggedItems = itemResults.filter((r) => r.flagged);

  const summary = computeDIFSummary(itemResults, responses.length);

  return {
    groupDefinition,
    itemResults,
    flaggedItems,
    summary,
    analyzedAt: new Date(),
  };
}

function computeDIFSummary(
  results: DIFItemResult[],
  totalSampleSize: number
): DIFSummary {
  const classificationCounts: Record<ETSClassification, number> = { A: 0, B: 0, C: 0 };
  let sumAbsDelta = 0;

  for (const r of results) {
    classificationCounts[r.etsClassification]++;
    sumAbsDelta += Math.abs(r.mh.deltaMH);
  }

  const nonNegligible = classificationCounts.B + classificationCounts.C;
  const difRate = results.length > 0 ? nonNegligible / results.length : 0;
  const meanAbsDelta = results.length > 0 ? sumAbsDelta / results.length : 0;

  let overallFairness: DIFSummary['overallFairness'];
  if (difRate > 0.20 || classificationCounts.C > 3) {
    overallFairness = 'serious_concern';
  } else if (difRate > 0.10 || classificationCounts.C > 0) {
    overallFairness = 'moderate_concern';
  } else {
    overallFairness = 'fair';
  }

  return {
    totalItems: results.length,
    classificationCounts,
    difRate,
    meanAbsDelta,
    totalSampleSize,
    overallFairness,
  };
}
