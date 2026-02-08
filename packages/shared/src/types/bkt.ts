/**
 * Darwin Education - Bayesian Knowledge Tracing (BKT) Types
 * ==========================================================
 *
 * Per-knowledge-component mastery tracking using Hidden Markov Model.
 * Tracks P(Learned) over time using Bayesian updates.
 *
 * Reference: Corbett, A. T. & Anderson, J. R. (1995). Knowledge tracing:
 * Modeling the acquisition of procedural knowledge. User Modeling and
 * User-Adapted Interaction, 4(4), 253-278.
 *
 * Model (Hidden Markov):
 *   Hidden state: L_n ∈ {learned, unlearned}
 *   Observation: O_n ∈ {correct, incorrect}
 *
 *   P(L_0) = prior probability of knowing before any practice
 *   P(T)   = probability of learning on each opportunity
 *   P(S)   = probability of slip (error despite knowing)
 *   P(G)   = probability of guess (correct despite not knowing)
 *
 *   Update:
 *     P(L_n | obs) = Bayes' rule using P(S) and P(G)
 *     P(L_n+1)     = P(L_n | obs) + (1 - P(L_n | obs)) * P(T)
 */

import type { ENAMEDArea } from './education';

// ============================================
// Knowledge Components
// ============================================

/** A knowledge component (KC) — an atomic skill or concept */
export interface KnowledgeComponent {
  /** Unique KC identifier */
  id: string;
  /** Display name (Portuguese) */
  namePt: string;
  /** Parent area */
  area: ENAMEDArea;
  /** Subspecialty tag */
  subspecialty?: string;
  /** BKT parameters for this KC */
  params: BKTParameters;
}

/** BKT model parameters for a knowledge component */
export interface BKTParameters {
  /** P(L_0): Prior probability of knowing (default 0.1) */
  pInit: number;
  /** P(T): Probability of learning per opportunity (default 0.15) */
  pTransit: number;
  /** P(S): Probability of slip — error despite knowing (default 0.05) */
  pSlip: number;
  /** P(G): Probability of guess — correct despite not knowing (default 0.25) */
  pGuess: number;
}

/** Default BKT parameters (from literature) */
export const DEFAULT_BKT_PARAMS: BKTParameters = {
  pInit: 0.1,
  pTransit: 0.15,
  pSlip: 0.05,
  pGuess: 0.25,
};

// ============================================
// Mastery Tracking
// ============================================

/** Current mastery state for a KC */
export interface BKTMasteryState {
  /** Knowledge component ID */
  kcId: string;
  /** Current posterior P(Learned) after all observations */
  mastery: number;
  /** Number of practice opportunities */
  opportunityCount: number;
  /** Number of correct responses */
  correctCount: number;
  /** Mastery classification */
  classification: MasteryClassification;
  /** Last updated */
  lastObservationAt: Date | null;
}

/** Mastery threshold classifications */
export type MasteryClassification =
  | 'not_started'   // P(L) = P(L0), no practice yet
  | 'learning'      // P(L) < 0.80
  | 'near_mastery'  // 0.80 ≤ P(L) < 0.95
  | 'mastered';     // P(L) ≥ 0.95

/** Mastery thresholds */
export const BKT_MASTERY_THRESHOLDS = {
  mastered: 0.95,
  nearMastery: 0.80,
} as const;

// ============================================
// Trajectory
// ============================================

/** A single observation for BKT updates */
export interface BKTObservation {
  /** Whether the response was correct */
  correct: boolean;
  /** Timestamp of observation */
  timestamp: Date;
  /** Source of this observation (exam, flashcard, FCR, etc.) */
  source: BKTObservationSource;
  /** Optional item ID for traceability */
  itemId?: string;
}

/** Where the observation came from */
export type BKTObservationSource =
  | 'exam'
  | 'flashcard'
  | 'cat'
  | 'fcr'
  | 'cip';

/** Mastery trajectory point (for visualization) */
export interface MasteryTrajectoryPoint {
  /** Observation index */
  index: number;
  /** P(Learned) after this observation */
  mastery: number;
  /** Whether this observation was correct */
  correct: boolean;
  /** Timestamp */
  timestamp: Date;
}

// ============================================
// Heatmap Data
// ============================================

/** Mastery heatmap data for area × KC matrix */
export interface MasteryHeatmapData {
  /** Areas as rows */
  areas: ENAMEDArea[];
  /** KCs per area */
  kcsByArea: Record<ENAMEDArea, {
    kcId: string;
    kcName: string;
    mastery: number;
    classification: MasteryClassification;
    opportunityCount: number;
  }[]>;
  /** Aggregate mastery per area */
  areaMastery: Record<ENAMEDArea, number>;
  /** Overall mean mastery */
  overallMastery: number;
  /** Count of mastered KCs */
  masteredCount: number;
  /** Total KCs tracked */
  totalKCs: number;
}

// ============================================
// EM Parameter Estimation
// ============================================

/** Result of EM parameter estimation */
export interface BKTEMResult {
  /** Estimated parameters */
  params: BKTParameters;
  /** Number of EM iterations run */
  iterations: number;
  /** Final log-likelihood */
  logLikelihood: number;
  /** Whether EM converged */
  converged: boolean;
}

/** EM configuration */
export interface BKTEMConfig {
  /** Maximum EM iterations (default 5) */
  maxIterations: number;
  /** Convergence threshold for parameter change (default 0.001) */
  convergenceThreshold: number;
  /** Minimum observations needed to run EM (default 20) */
  minObservations: number;
}

/** Default EM configuration */
export const DEFAULT_BKT_EM_CONFIG: BKTEMConfig = {
  maxIterations: 5,
  convergenceThreshold: 0.001,
  minObservations: 20,
};
