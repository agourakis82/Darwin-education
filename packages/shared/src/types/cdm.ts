/**
 * Darwin Education — Cognitive Diagnostic Model (CDM) Types
 * ==========================================================
 *
 * Implements DINA and G-DINA models for binary attribute mastery
 * classification. K=6 cognitive attributes clinically grounded in
 * ENAMED (Brazilian medical licensure) competency frameworks.
 *
 * These models make a fundamental shift from IRT's scalar θ (how much)
 * to a binary mastery vector α ∈ {0,1}^K (exactly which micro-skills).
 *
 * References:
 *   DINA: Junker & Sijtsma (2001). Cognitive assessment models with
 *         few assumptions. Applied Psychological Measurement, 25(3).
 *   G-DINA: de la Torre (2011). The Generalized DINA Model Framework.
 *           Psychometrika, 76, 179-199.
 *   Q-matrix: Liu et al. (2012). Theoretical and Practical Issues
 *             of Q Matrix Specification in DINA Models.
 *   CDM-CAT: Xu et al. (2003). A simulation study to compare CAT
 *            strategies for cognitive diagnosis. Applied Measurement.
 */

// ============================================
// Cognitive Attributes
// ============================================

/** K=6 cognitive attributes for ENAMED — clinically grounded */
export const CDM_ATTRIBUTES = [
  'data_gathering',        // A1
  'diagnostic_reasoning',  // A2
  'clinical_judgment',     // A3
  'therapeutic_decision',  // A4
  'preventive_medicine',   // A5
  'emergency_management',  // A6
] as const;

export type CognitiveAttribute = (typeof CDM_ATTRIBUTES)[number];

/** Number of attributes K */
export const CDM_K = 6;

/** Number of latent classes 2^K */
export const CDM_NCLASSES = 64;

/** Human-readable labels in Portuguese */
export const CDM_ATTRIBUTE_LABELS_PT: Record<CognitiveAttribute, string> = {
  data_gathering: 'Coleta de Dados Clínicos',
  diagnostic_reasoning: 'Raciocínio Diagnóstico',
  clinical_judgment: 'Julgamento Clínico',
  therapeutic_decision: 'Decisão Terapêutica',
  preventive_medicine: 'Medicina Preventiva',
  emergency_management: 'Manejo de Emergências',
};

/** Brief descriptions in Portuguese */
export const CDM_ATTRIBUTE_DESCRIPTIONS_PT: Record<CognitiveAttribute, string> = {
  data_gathering: 'Anamnese e exame físico dirigido',
  diagnostic_reasoning: 'Diagnóstico diferencial e reconhecimento de padrão clínico',
  clinical_judgment: 'Melhor hipótese diagnóstica e estratificação de risco',
  therapeutic_decision: 'Plano terapêutico e seleção racional de fármacos',
  preventive_medicine: 'Saúde populacional, rastreamento e vacinação',
  emergency_management: 'Triagem, protocolos e condutas de urgência',
};

/** Mapping of attributes to FCR clinical reasoning levels */
export const CDM_ATTRIBUTE_FCR_MAPPING: Record<CognitiveAttribute, string> = {
  data_gathering: 'dados',
  diagnostic_reasoning: 'padrao',
  clinical_judgment: 'hipotese',
  therapeutic_decision: 'conduta',
  preventive_medicine: 'conduta',
  emergency_management: 'conduta',
};

// ============================================
// Q-Matrix
// ============================================

/**
 * Q-matrix row: binary vector of length K=6 per item.
 * q[k]=1 means this item requires mastery of attribute k.
 *
 * DINA identifiability conditions:
 *   - Each attribute must be required by ≥2 items (completeness)
 *   - All attribute pairs must be discernible (no identical columns)
 */
export type QMatrixRow = [number, number, number, number, number, number];

/** Full Q-matrix: itemId → binary attribute requirement vector */
export type QMatrix = Record<string, QMatrixRow>;

/** Q-matrix validation diagnostics */
export interface QMatrixDiagnostics {
  isComplete: boolean;
  isDiscernible: boolean;
  /** Number of items requiring each attribute */
  attributeCoverage: Record<CognitiveAttribute, number>;
  /** K×K symmetrical discernibility matrix */
  discernibilityMatrix: boolean[][];
  completenessWarnings: string[];
}

// ============================================
// DINA Model Parameters
// ============================================

/**
 * DINA per-item parameters.
 *
 * Ideal response: η_{ij} = ∏_{k: q_{jk}=1} α_{ik}
 *   (AND-gate: 1 iff student has ALL required attributes)
 *
 * Response probability:
 *   P(X_{ij}=1 | α_i) = (1 - s_j)^{η_{ij}} × g_j^{1-η_{ij}}
 *
 * where s_j ∈ [0,0.5) = slip (P(wrong | mastered all))
 *       g_j ∈ [0,0.5) = guessing (P(correct | lacks any))
 */
export interface DINAItemParameters {
  itemId: string;
  /** Slip parameter s_j ∈ [0.001, 0.499] */
  slip: number;
  /** Guessing parameter g_j ∈ [0.001, 0.499] */
  guessing: number;
  /** Indices (0-based) of required attributes from Q-matrix */
  requiredAttributes: number[];
}

export interface DINAParameters {
  items: DINAItemParameters[];
  /** Prior probabilities P(α_c) for each of 2^K=64 latent classes */
  classPriors: number[];
  estimatedAt?: Date;
}

// ============================================
// G-DINA Model Parameters
// ============================================

/**
 * G-DINA link function for the reduced-item model.
 *
 * 'identity' → ACDM (Additive CDM): P = δ₀ + Σ δₖα*ₖ + ...  (linear)
 * 'logit'    → LLM (Log-Linear CDM): log-odds form
 * 'log'      → RRUM: log form, reduces to Reparametrized Unified Model
 */
export type GDINALinkFunction = 'identity' | 'logit' | 'log';

/**
 * G-DINA per-item parameters (de la Torre, 2011).
 *
 * For item j with K_j* required attributes and reduced attribute
 * vector α* (sub-vector over required attributes only):
 *
 *   P(X_j=1 | α*) via identity link:
 *     = δ_{j0}
 *     + Σ_k δ_{jk} α*_k          (main effects)
 *     + Σ_{k<l} δ_{jkl} α*_k α*_l  (two-way interactions)
 *     + ... (up to K_j*-way)
 *
 * deltaCoeffs has length 2^{K_j*}:
 *   [intercept, main effects (K_j*), two-way interactions, ..., K_j*-way]
 */
export interface GDINAItemParameters {
  itemId: string;
  /** Delta coefficients — length 2^{numRequiredAttributes} */
  deltaCoeffs: number[];
  /** K_j*: number of required attributes for this item */
  numRequiredAttributes: number;
  /** 0-based indices of required attributes */
  requiredAttributes: number[];
  linkFunction: GDINALinkFunction;
}

export interface GDINAParameters {
  items: GDINAItemParameters[];
  /** Prior probabilities P(α_c) for 2^K=64 latent classes */
  classPriors: number[];
  linkFunction: GDINALinkFunction;
  estimatedAt?: Date;
}

// ============================================
// Attribute Profile (Classification Output)
// ============================================

/**
 * A student's attribute mastery profile after CDM classification.
 *
 * MAP  (Maximum A Posteriori): argmax_c P(α_c | X_i)
 * EAP  (Expected A Posteriori): E[α_k | X_i] = Σ_c α_{ck} P(α_c | X_i)
 *
 * Posterior entropy H = -Σ_c P(c|X) log₂ P(c|X)
 *   H = 0 → perfectly classified
 *   H = log₂(64) = 6 bits → maximally uncertain
 */
export interface AttributeProfile {
  userId: string;
  /** MAP binary mastery vector α̂ ∈ {true,false}^6 */
  mapEstimate: boolean[];
  /** EAP marginal posteriors per attribute ∈ [0,1]^6 */
  eapEstimate: number[];
  /** Full posterior distribution over 64 latent classes */
  posteriorProbabilities: number[];
  /** Index of MAP class in [0..63] */
  latentClass: number;
  /** Posterior entropy (bits); max = 6 */
  posteriorEntropy: number;
  /** Attributes where MAP = true */
  masteredAttributes: CognitiveAttribute[];
  /** Attributes where MAP = false */
  unmasteredAttributes: CognitiveAttribute[];
  classifiedAt: Date;
}

// ============================================
// Model Fit Statistics
// ============================================

/**
 * CDM absolute and relative fit statistics.
 *
 * M₂ (limited-information): Maydeu-Olivares & Joe (2006). Psychometrika.
 *   Based on univariate + bivariate item margins; avoids sparse-cell problem
 *   that makes full-pattern G² invalid for large J (J > 15).
 *
 * df = J + J(J-1)/2 − numParameters
 *
 * RMSEA = sqrt(max(0, (M₂ − df) / (N × df)))
 *   < 0.05 = close fit; 0.05–0.08 = reasonable; > 0.10 = poor
 *
 * SRMR: standardized RMS residual of item-pair correlations
 */
export interface CDMFit {
  logLikelihood: number;
  numParameters: number;
  numObservations: number;
  /** -2LL + 2p */
  aic: number;
  /** -2LL + p×ln(N) */
  bic: number;
  /** M₂ limited-information GOF statistic (Maydeu-Olivares & Joe, 2006) */
  gSquared: number;
  /** df for M₂: J + J(J-1)/2 − numParameters */
  df: number;
  /** RMSEA based on M₂ */
  rmsea: number;
  /** Standardized Root Mean Square Residual */
  srmr: number;
  /** p-value for M₂ test */
  pValue: number;
}

/** Complete CDM classification result for one student */
export interface CDMClassification {
  profile: AttributeProfile;
  modelType: 'dina' | 'gdina';
  modelFit: CDMFit;
  /** DINA vs G-DINA comparison (when both are estimated) */
  modelComparison?: {
    dinaAIC: number;
    gdinaAIC: number;
    dinaBIC: number;
    gdina_BIC: number;
    preferred: 'dina' | 'gdina';
    /** BIC_GDINA - BIC_DINA; negative favors G-DINA */
    deltaBIC: number;
  };
}

// ============================================
// EM Algorithm Configuration
// ============================================

export interface CDMEMConfig {
  /** Maximum EM iterations (default 500) */
  maxIterations: number;
  /** Log-likelihood convergence threshold (default 1e-6) */
  convergenceThreshold: number;
  /** Lower bound for slip and guessing parameters */
  minSlipGuess: number;
  /** Upper bound for slip and guessing parameters */
  maxSlipGuess: number;
  /** Minimum class prior to prevent degeneracy */
  minClassPrior: number;
  /** Model type to estimate */
  modelType: 'dina' | 'gdina';
  /** Link function for G-DINA */
  linkFunction?: GDINALinkFunction;
}

export const DEFAULT_CDM_EM_CONFIG: CDMEMConfig = {
  maxIterations: 500,
  convergenceThreshold: 1e-6,
  minSlipGuess: 0.001,
  maxSlipGuess: 0.499,
  minClassPrior: 1e-6,
  modelType: 'dina',
  linkFunction: 'identity',
};

/** Result of EM estimation */
export interface CDMEstimationResult {
  params: DINAParameters | GDINAParameters;
  modelType: 'dina' | 'gdina';
  converged: boolean;
  iterations: number;
  finalLogLikelihood: number;
  fit: CDMFit;
}

// ============================================
// CDM-CAT Item Selection
// ============================================

/**
 * Item selection methods for CDM-based Computerized Adaptive Testing.
 *
 * 'shannon_entropy' (PWKL-based): minimize expected posterior entropy
 *   ΔH_j = H(current) − E_{X_j}[H(posterior | X_j)]
 *
 * 'kl_divergence': maximize KL(prior || posterior after item j)
 *
 * 'pwkl': Posterior-Weighted KL — weighted by current posterior
 */
export type CDMCATSelectionMethod = 'shannon_entropy' | 'kl_divergence' | 'pwkl';

export interface CDMCATConfig {
  selectionMethod: CDMCATSelectionMethod;
  /** Stop when max expected entropy reduction < threshold */
  entropyThreshold: number;
  maxItems: number;
  minItems: number;
  /** Target items per attribute for content balancing */
  attributeCoverageTargets?: Partial<Record<CognitiveAttribute, number>>;
}

export interface CDMCATSession {
  currentPosterior: number[];
  currentEntropy: number;
  itemsAdministered: string[];
  responses: boolean[];
  entropyHistory: Array<{ itemId: string; entropyBefore: number; entropyAfter: number }>;
  isComplete: boolean;
  stoppingReason?: 'entropy_threshold' | 'max_items' | 'all_attributes_decided';
}

export interface CDMCATNextItem {
  itemId: string;
  expectedEntropyReduction: number;
  /** Which attributes this item primarily targets */
  targetAttributes: CognitiveAttribute[];
}
