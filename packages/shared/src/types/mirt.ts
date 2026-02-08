/**
 * Darwin Education - Multidimensional IRT (MIRT) Types
 * =====================================================
 *
 * Compensatory multidimensional IRT model for 5 ENAMED areas.
 * Each item loads on one primary dimension (high discrimination)
 * with small cross-loadings on other dimensions.
 *
 * Reference: Reckase, M. D. (2009). Multidimensional Item Response Theory.
 * Springer.
 *
 * Model (compensatory):
 *   P(X=1|theta) = c + (1-c) * logistic(a'theta + d)
 *     where theta = [theta_1, ..., theta_5] (5D ability vector)
 *     a = [a_1, ..., a_5] (discrimination vector)
 *     d = intercept (related to difficulty)
 *     c = guessing parameter
 *
 * Estimation: MAP with multivariate normal prior N(0, I)
 *   via Newton-Raphson optimization.
 */

import type { ENAMEDArea } from './education';

// ============================================
// Dimensions
// ============================================

/** MIRT dimensions — one per ENAMED area */
export const MIRT_DIMENSIONS: ENAMEDArea[] = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
];

/** Number of dimensions */
export const MIRT_NDIM = 5;

/** Dimension labels in Portuguese */
export const MIRT_DIMENSION_LABELS_PT: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clinica Medica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saude Coletiva',
};

// ============================================
// Item Parameters
// ============================================

/** MIRT item parameters */
export interface MIRTItemParameters {
  /** Item ID */
  itemId: string;
  /** Discrimination vector (5D): a_k for each dimension */
  discriminations: number[];
  /** Intercept (d = -sum(a_k * b_k) in 2PL parameterization) */
  intercept: number;
  /** Guessing parameter */
  guessing: number;
  /** Primary dimension (area with highest loading) */
  primaryDimension: ENAMEDArea;
}

/** Default item loading pattern */
export const MIRT_DEFAULT_LOADINGS = {
  /** Primary dimension discrimination */
  primaryDiscrimination: 1.2,
  /** Cross-loading discrimination (other dimensions) */
  crossDiscrimination: 0.3,
} as const;

// ============================================
// Ability Profile
// ============================================

/** 5D ability profile from MIRT estimation */
export interface MIRTAbilityProfile {
  /** Ability estimates per dimension */
  theta: Record<ENAMEDArea, number>;
  /** Standard errors per dimension */
  standardErrors: Record<ENAMEDArea, number>;
  /** 95% confidence intervals per dimension */
  confidenceIntervals: Record<ENAMEDArea, [number, number]>;
  /** 5×5 covariance matrix (row-major) */
  covarianceMatrix: number[][];
  /** Per-dimension details */
  dimensionProfiles: DimensionProfile[];
  /** Overall composite theta (weighted average) */
  compositeTheta: number;
  /** Estimation metadata */
  estimation: MIRTEstimationInfo;
}

/** Per-dimension detail */
export interface DimensionProfile {
  /** Area */
  area: ENAMEDArea;
  /** Label (Portuguese) */
  label: string;
  /** Theta estimate */
  theta: number;
  /** Standard error */
  se: number;
  /** 95% CI */
  ci: [number, number];
  /** Number of items loading primarily on this dimension */
  itemCount: number;
  /** Relative strength rank (1 = strongest) */
  rank: number;
}

/** Estimation convergence info */
export interface MIRTEstimationInfo {
  /** Number of Newton-Raphson iterations */
  iterations: number;
  /** Whether estimation converged */
  converged: boolean;
  /** Final gradient norm */
  gradientNorm: number;
  /** Total items used */
  totalItems: number;
  /** Estimation method */
  method: 'MAP' | 'EAP';
}

// ============================================
// Configuration
// ============================================

/** MIRT estimation configuration */
export interface MIRTConfig {
  /** Maximum Newton-Raphson iterations (default 25) */
  maxIterations: number;
  /** Convergence criterion for theta change (default 0.001) */
  convergenceThreshold: number;
  /** Step-halving maximum attempts (default 5) */
  maxStepHalving: number;
  /** Prior mean (default 0 for all dimensions) */
  priorMean: number[];
  /** Prior covariance (default identity matrix) */
  priorCovariance: number[][];
  /** Minimum items per dimension for reliable estimate (default 5) */
  minItemsPerDimension: number;
}

/** Default MIRT configuration */
export const DEFAULT_MIRT_CONFIG: MIRTConfig = {
  maxIterations: 25,
  convergenceThreshold: 0.001,
  maxStepHalving: 5,
  priorMean: [0, 0, 0, 0, 0],
  priorCovariance: [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ],
  minItemsPerDimension: 5,
};
