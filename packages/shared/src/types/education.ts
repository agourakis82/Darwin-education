/**
 * Darwin Education - Core Types
 * =============================
 *
 * Types for ENAMED exam preparation platform
 */

// ============================================
// ENAMED Question Types
// ============================================

/**
 * IRT (Item Response Theory) parameters for a question
 * These are calibrated from real ENAMED microdata
 */
export interface IRTParameters {
  /** Item difficulty (b parameter): -4 to +4, higher = harder */
  difficulty: number;
  /** Item discrimination (a parameter): how well it separates abilities */
  discrimination: number;
  /** Guessing parameter (c): probability of correct guess (default 0.25 for 4 options) */
  guessing: number;
  /** Model fit: infit mean-square statistic */
  infit?: number;
  /** Model fit: outfit mean-square statistic */
  outfit?: number;
}

/**
 * ENAMED question difficulty levels
 */
export type DifficultyLevel = 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil';

/**
 * ENAMED content areas (5 major areas)
 */
export type ENAMEDArea =
  | 'clinica_medica'        // Internal Medicine
  | 'cirurgia'              // Surgery
  | 'ginecologia_obstetricia' // OB/GYN
  | 'pediatria'             // Pediatrics
  | 'saude_coletiva';       // Public Health / Preventive Medicine

/**
 * Ontology hierarchy for question categorization
 */
export interface QuestionOntology {
  /** Major area (1 of 5) */
  area: ENAMEDArea;
  /** Subspecialty within the area */
  subspecialty: string;
  /** Specific topic */
  topic: string;
  /** ICD-10 codes if disease-related */
  icd10?: string[];
  /** Related medications (ATC codes) */
  atcCodes?: string[];
}

/**
 * A single ENAMED-style question
 */
export interface ENAMEDQuestion {
  /** Unique question ID */
  id: string;
  /** Question bank source */
  bankId: string;
  /** Year of origin (if from real exam) */
  year?: number;
  /** Question stem (clinical case or direct question) */
  stem: string;
  /** Answer options (A, B, C, D, E) */
  options: QuestionOption[];
  /** Index of correct option (0-4) */
  correctIndex: number;
  /** Detailed explanation of the answer */
  explanation: string;
  /** IRT calibration parameters */
  irt: IRTParameters;
  /** Computed difficulty level */
  difficulty: DifficultyLevel;
  /** Ontology classification */
  ontology: QuestionOntology;
  /** Academic references (Vancouver style) */
  references?: string[];
  /** AI-generated flag */
  isAIGenerated: boolean;
  /** Validation status */
  validatedBy?: 'community' | 'expert' | 'both';
}

export interface QuestionOption {
  /** Option letter (A-E) */
  letter: string;
  /** Option text */
  text: string;
  /** Why this option is right/wrong (shown after answering) */
  feedback?: string;
}

// ============================================
// Exam Types
// ============================================

/**
 * A complete exam (100 questions for ENAMED simulation)
 */
export interface Exam {
  id: string;
  title: string;
  description: string;
  /** Number of questions */
  questionCount: number;
  /** Time limit in minutes (ENAMED = 5 hours = 300 min) */
  timeLimitMinutes: number;
  /** Question IDs in order */
  questionIds: string[];
  /** Exam type */
  type: 'official_simulation' | 'custom' | 'practice' | 'review';
  /** Creator (user ID or 'system') */
  createdBy: string;
  createdAt: Date;
}

/**
 * User's exam attempt
 */
export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  /** Answers: question ID -> selected option index (0-4) or -1 for unanswered */
  answers: Record<string, number>;
  /** Questions marked for review */
  markedForReview: string[];
  /** Time spent in seconds per question */
  timePerQuestion: Record<string, number>;
  /** Total time spent in seconds */
  totalTimeSeconds: number;
  /** Start timestamp */
  startedAt: Date;
  /** Completion timestamp (null if in progress) */
  completedAt: Date | null;
  /** TRI score result (calculated after completion) */
  score?: TRIScore;
}

/**
 * TRI score calculation result
 */
export interface TRIScore {
  /** Theta (ability) estimate: -4 to +4 */
  theta: number;
  /** Standard error of theta estimate */
  standardError: number;
  /** Scaled score (0-1000, like ENAMED) */
  scaledScore: number;
  /** Pass threshold (typically 600) */
  passThreshold: number;
  /** Whether score meets passing threshold */
  passed: boolean;
  /** Number of correct answers */
  correctCount: number;
  /** Total questions attempted */
  totalAttempted: number;
  /** Performance breakdown by area */
  areaBreakdown: Record<ENAMEDArea, AreaPerformance>;
}

export interface AreaPerformance {
  correct: number;
  total: number;
  percentage: number;
  averageDifficulty: number;
}

// ============================================
// Flashcard Types (SM-2 Spaced Repetition)
// ============================================

/**
 * A flashcard for spaced repetition study
 */
export interface Flashcard {
  id: string;
  /** Front of card (question/prompt) */
  front: string;
  /** Back of card (answer) */
  back: string;
  /** Related question ID (if derived from question) */
  questionId?: string;
  /** Ontology for categorization */
  ontology: QuestionOntology;
  /** Tags for filtering */
  tags: string[];
  /** User who created (or 'system') */
  createdBy: string;
  createdAt: Date;
}

/**
 * SM-2 algorithm state for a card
 */
export interface SM2State {
  /** Card ID */
  cardId: string;
  /** Easiness factor (default 2.5) */
  easeFactor: number;
  /** Current interval in days */
  interval: number;
  /** Number of successful reviews */
  repetitions: number;
  /** Next review date */
  nextReview: Date;
  /** Last review date */
  lastReview: Date | null;
}

/**
 * Review quality rating (SM-2)
 */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = complete blackout
// 1 = incorrect, remembered upon seeing answer
// 2 = incorrect, answer seemed easy to recall
// 3 = correct with serious difficulty
// 4 = correct with hesitation
// 5 = perfect response

// ============================================
// Study Path Types
// ============================================

/**
 * A learning path with ordered modules
 */
export interface StudyPath {
  id: string;
  title: string;
  description: string;
  /** Target area(s) */
  areas: ENAMEDArea[];
  /** Estimated duration in hours */
  estimatedHours: number;
  /** Module IDs in order */
  moduleIds: string[];
  /** Difficulty progression */
  difficulty: DifficultyLevel;
  /** Prerequisites (other path IDs) */
  prerequisites: string[];
}

export interface StudyModule {
  id: string;
  title: string;
  type: 'reading' | 'video' | 'quiz' | 'flashcards' | 'case_study';
  /** Content or reference to content */
  content: string;
  /** Estimated time in minutes */
  estimatedMinutes: number;
  /** Question IDs for quiz type */
  questionIds?: string[];
  /** Flashcard IDs for flashcards type */
  flashcardIds?: string[];
}

// ============================================
// User Progress Types
// ============================================

export interface UserProgress {
  userId: string;
  /** Total XP earned */
  xp: number;
  /** Current level */
  level: number;
  /** Daily streak count */
  streak: number;
  /** Last activity date */
  lastActivity: Date;
  /** Completed exam IDs */
  completedExams: string[];
  /** Completed study path IDs */
  completedPaths: string[];
  /** Achievements unlocked */
  achievements: string[];
  /** Area-specific proficiency */
  areaProficiency: Record<ENAMEDArea, number>;
}

// ============================================
// Question Bank Types
// ============================================

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  /** Source of questions */
  source: 'official_enamed' | 'residencia' | 'concurso' | 'ai_generated' | 'community';
  /** Year range covered */
  yearRange: { start: number; end: number };
  /** Number of questions */
  questionCount: number;
  /** Areas covered */
  areas: ENAMEDArea[];
  /** Premium-only bank */
  isPremium: boolean;
}
