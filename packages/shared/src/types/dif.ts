/**
 * Darwin Education - Differential Item Functioning (DIF) Types
 * =============================================================
 *
 * DIF analysis detects items that function differently across groups
 * (e.g., by specialty area, institution type) after controlling for ability.
 * Critical for test fairness and psychometric validity.
 *
 * Methods:
 *   1. Mantel-Haenszel (MH): Non-parametric, stratifies by total score
 *   2. Lord's Chi-Square: IRT-based, compares item parameters across groups
 *
 * ETS Classification (Educational Testing Service):
 *   A: |delta_MH| < 1.0 — Negligible DIF
 *   B: 1.0 ≤ |delta_MH| < 1.5 AND significant — Moderate DIF
 *   C: |delta_MH| ≥ 1.5 AND significant — Large DIF (flag for review)
 *
 * Reference: Holland, P. W. & Thayer, D. T. (1988). Differential item
 * performance and the Mantel-Haenszel procedure. In H. Wainer & H. Braun
 * (Eds.), Test validity (pp. 129-145).
 */

import type { IRTParameters, ENAMEDArea } from './education';

// ============================================
// Group Definitions
// ============================================

/** Grouping variable for DIF analysis */
export type DIFGroupVariable =
  | 'area'              // Compare across ENAMED specialty areas
  | 'institution_tier'  // Compare across institution tiers (A/B/C/D)
  | 'gender'            // Compare by gender
  | 'region';           // Compare by geographic region

/** Group definition for DIF comparison */
export interface DIFGroupDefinition {
  /** Grouping variable */
  variable: DIFGroupVariable;
  /** Reference group (typically the majority group) */
  referenceGroup: string;
  /** Focal group (the group being tested for DIF) */
  focalGroup: string;
}

// ============================================
// Response Data
// ============================================

/** Response data for DIF analysis */
export interface DIFResponseData {
  /** Item ID */
  itemId: string;
  /** Whether the response was correct */
  correct: boolean;
  /** Total test score for this examinee */
  totalScore: number;
  /** Group membership */
  group: string;
}

// ============================================
// Mantel-Haenszel Results
// ============================================

/** A single cell in the MH 2×2 contingency table */
export interface MHContingencyCell {
  /** Stratum index */
  stratum: number;
  /** Score range for this stratum */
  scoreRange: [number, number];
  /** Focal group correct count */
  focalCorrect: number;
  /** Focal group incorrect count */
  focalIncorrect: number;
  /** Reference group correct count */
  referenceCorrect: number;
  /** Reference group incorrect count */
  referenceIncorrect: number;
  /** Total in this stratum */
  total: number;
}

/** Mantel-Haenszel test result for a single item */
export interface MHResult {
  /** MH common odds ratio (alpha_MH) */
  alphaMH: number;
  /** MH delta (ETS delta scale): -2.35 * ln(alpha_MH) */
  deltaMH: number;
  /** MH chi-square statistic (1 df, with continuity correction) */
  chiSquare: number;
  /** p-value from chi-square */
  pValue: number;
  /** Number of strata used */
  strataCount: number;
  /** Per-stratum contingency tables */
  contingencyTables: MHContingencyCell[];
}

// ============================================
// Lord's Chi-Square Results
// ============================================

/** Lord's IRT-based DIF test result */
export interface LordResult {
  /** Lord's chi-square statistic (2 df for 2PL, 3 df for 3PL) */
  chiSquare: number;
  /** p-value */
  pValue: number;
  /** Degrees of freedom */
  df: number;
  /** Focal group IRT parameters */
  focalParams: IRTParameters;
  /** Reference group IRT parameters */
  referenceParams: IRTParameters;
  /** Parameter differences */
  paramDifferences: {
    difficultyDiff: number;
    discriminationDiff: number;
    guessingDiff: number;
  };
}

// ============================================
// DIF Classification
// ============================================

/** ETS DIF classification */
export type ETSClassification = 'A' | 'B' | 'C';

/** DIF classification thresholds */
export const DIF_THRESHOLDS = {
  /** |delta| below this = A (negligible) */
  negligible: 1.0,
  /** |delta| below this = B (moderate); above = C (large) */
  moderate: 1.5,
  /** Significance level for chi-square test */
  significanceLevel: 0.05,
} as const;

/** Complete DIF result for a single item */
export interface DIFItemResult {
  /** Item ID */
  itemId: string;
  /** Item area (for context) */
  area?: ENAMEDArea;
  /** Mantel-Haenszel results */
  mh: MHResult;
  /** Lord's chi-square results (if IRT params available) */
  lord?: LordResult;
  /** ETS classification */
  etsClassification: ETSClassification;
  /** Whether the item is flagged for review */
  flagged: boolean;
  /** Direction of DIF: favors focal or reference group */
  direction: 'favors_focal' | 'favors_reference' | 'none';
  /** Sample sizes */
  sampleSizeFocal: number;
  sampleSizeReference: number;
}

// ============================================
// Full Analysis
// ============================================

/** Complete DIF analysis across all items */
export interface DIFAnalysis {
  /** Group comparison description */
  groupDefinition: DIFGroupDefinition;
  /** Per-item DIF results */
  itemResults: DIFItemResult[];
  /** Items flagged as C (large DIF) */
  flaggedItems: DIFItemResult[];
  /** Summary statistics */
  summary: DIFSummary;
  /** Analysis timestamp */
  analyzedAt: Date;
}

/** DIF analysis summary */
export interface DIFSummary {
  /** Total items analyzed */
  totalItems: number;
  /** Count per ETS classification */
  classificationCounts: Record<ETSClassification, number>;
  /** Percentage of items with non-negligible DIF (B or C) */
  difRate: number;
  /** Mean |delta_MH| across all items */
  meanAbsDelta: number;
  /** Total sample size (focal + reference) */
  totalSampleSize: number;
  /** Whether the test appears fair overall */
  overallFairness: 'fair' | 'moderate_concern' | 'serious_concern';
}
