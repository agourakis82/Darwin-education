/**
 * Darwin Education - Unified Learner Model Types
 * ================================================
 *
 * Cross-feature aggregation model that combines all psychometric
 * signals into a single learner profile. Produces composite scores,
 * pass predictions, and study recommendations.
 *
 * Inputs: IRT theta, MIRT profile, FCR calibration, BKT mastery,
 *         HLR retention, engagement metrics.
 *
 * Outputs: Per-area competency, pass probability, strength/weakness
 *          analysis, prioritized study recommendations.
 */

import type { ENAMEDArea } from './education';
import type { MIRTAbilityProfile } from './mirt';
import type { MasteryHeatmapData } from './bkt';

// ============================================
// Input Signals
// ============================================

/** All input signals for the unified model */
export interface UnifiedModelInputs {
  /** Standard IRT theta (unidimensional) */
  irtTheta: number | null;
  /** MIRT 5D ability profile */
  mirtProfile: MIRTAbilityProfile | null;
  /** FCR calibration score (0-100) */
  fcrCalibrationScore: number | null;
  /** FCR overconfidence index (-1 to +1) */
  fcrOverconfidenceIndex: number | null;
  /** BKT mastery data */
  bktMastery: MasteryHeatmapData | null;
  /** HLR average retention across items */
  hlrAverageRetention: number | null;
  /** Engagement metrics */
  engagement: EngagementMetrics | null;
}

/** User engagement metrics */
export interface EngagementMetrics {
  /** Total study sessions in last 30 days */
  sessionsLast30Days: number;
  /** Average session duration in minutes */
  avgSessionMinutes: number;
  /** Current daily streak */
  currentStreak: number;
  /** Total questions attempted */
  totalQuestionsAttempted: number;
  /** Total flashcard reviews */
  totalFlashcardReviews: number;
  /** Total FCR cases completed */
  totalFCRCases: number;
  /** Days since last activity */
  daysSinceLastActivity: number;
}

// ============================================
// Competency Weights
// ============================================

/** Per-area competency weights */
export const COMPETENCY_WEIGHTS = {
  mirt: 0.30,
  bkt: 0.25,
  fcr: 0.20,
  irt: 0.15,
  hlr: 0.10,
} as const;

/** Competency weight keys */
export type CompetencySource = keyof typeof COMPETENCY_WEIGHTS;

// ============================================
// Unified Profile
// ============================================

/** Complete unified learner profile */
export interface UnifiedLearnerProfile {
  /** Per-area competency scores (0-1) */
  areaCompetency: Record<ENAMEDArea, AreaCompetency>;
  /** Overall competency (weighted average across areas) */
  overallCompetency: number;
  /** Predicted pass probability (0-1) */
  passProbability: number;
  /** Pass probability confidence interval */
  passCI: [number, number];
  /** Strength/weakness analysis */
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  /** Study recommendations */
  recommendations: StudyRecommendation[];
  /** Data completeness (which signals are available) */
  dataCompleteness: DataCompleteness;
  /** Profile snapshot timestamp */
  snapshotAt: Date;
}

/** Per-area competency breakdown */
export interface AreaCompetency {
  /** Area */
  area: ENAMEDArea;
  /** Composite score (0-1) */
  composite: number;
  /** Contributing signals */
  signals: {
    mirt: number | null;
    bkt: number | null;
    fcr: number | null;
    irt: number | null;
    hlr: number | null;
  };
  /** Confidence in this estimate (0-1, based on data availability) */
  confidence: number;
  /** Trend: improving, stable, declining */
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

/** A strength or weakness */
export interface StrengthWeakness {
  /** Area */
  area: ENAMEDArea;
  /** Specific aspect (e.g., "Raciocinio clinico em Pediatria") */
  description: string;
  /** Source that identified this */
  source: CompetencySource;
  /** Score that generated this insight */
  score: number;
  /** Severity: how far from ideal (0=perfect, 1=critical) */
  severity: number;
}

// ============================================
// Recommendations
// ============================================

/** A study recommendation */
export interface StudyRecommendation {
  /** Priority rank (1 = highest) */
  priority: number;
  /** Recommendation type */
  type: RecommendationType;
  /** Target area */
  area: ENAMEDArea;
  /** Human-readable description (Portuguese) */
  descriptionPt: string;
  /** Why this is recommended */
  reasonPt: string;
  /** Priority score (internal, for ranking) */
  priorityScore: number;
  /** Suggested action */
  action: RecommendedAction;
}

/** Types of recommendations */
export type RecommendationType =
  | 'fill_lacuna'        // Address a specific knowledge gap
  | 'reduce_forgetting'  // Review items at risk of being forgotten
  | 'calibrate'          // Improve metacognitive calibration
  | 'deepen_mastery'     // Move from near-mastery to mastery
  | 'broaden_coverage'   // Study underrepresented areas
  | 'practice_speed';    // Improve response speed

/** Recommended action */
export interface RecommendedAction {
  /** Which feature to use */
  feature: 'exam' | 'flashcard' | 'fcr' | 'cat' | 'study_path';
  /** Navigation path */
  href: string;
  /** Label (Portuguese) */
  labelPt: string;
}

// ============================================
// Data Completeness
// ============================================

/** Tracks which data sources are available */
export interface DataCompleteness {
  hasIRT: boolean;
  hasMIRT: boolean;
  hasFCR: boolean;
  hasBKT: boolean;
  hasHLR: boolean;
  hasEngagement: boolean;
  /** Overall completeness (0-1) */
  overallCompleteness: number;
  /** Minimum data needed for reliable profile */
  isReliable: boolean;
}

// ============================================
// Trajectory
// ============================================

/** Time-series snapshot for trajectory visualization */
export interface LearnerTrajectoryPoint {
  /** Snapshot date */
  date: Date;
  /** Overall competency at this point */
  overallCompetency: number;
  /** Per-area competency */
  areaCompetency: Record<ENAMEDArea, number>;
  /** Pass probability */
  passProbability: number;
}

/** Complete trajectory for visualization */
export interface LearnerTrajectory {
  /** Data points */
  points: LearnerTrajectoryPoint[];
  /** Growth rate (slope of linear fit) */
  growthRate: number;
  /** Whether growth has plateaued */
  hasPlateaued: boolean;
  /** Estimated days until target competency (null if declining) */
  estimatedDaysToTarget: number | null;
}
