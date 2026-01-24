/**
 * Darwin Education - CIP (Comprehensive Integrative Puzzle) Types
 * ================================================================
 *
 * Types for ontology-based CIP assessment generation.
 * Based on: "Ontology-Based Generation of Multilingual Questions for
 * Assessment in Medical Education" (Radović et al., 2020)
 */

import type { ENAMEDArea, DifficultyLevel, IRTParameters } from './education';

// ============================================
// CIP Section Types
// ============================================

/**
 * CIP puzzle sections (columns in the puzzle grid)
 */
export type CIPSection =
  | 'medical_history'    // Anamnese - patient history, symptoms, risk factors
  | 'physical_exam'      // Exame Físico - physical examination findings
  | 'laboratory'         // Laboratório - lab test results
  | 'imaging'            // Imagem/ECG - imaging studies, ECG, X-ray
  | 'pathology'          // Patologia - histopathology, cytology
  | 'treatment';         // Tratamento - medications, procedures, therapy

/**
 * Section display labels in Portuguese
 */
export const CIP_SECTION_LABELS_PT: Record<CIPSection, string> = {
  medical_history: 'Anamnese',
  physical_exam: 'Exame Físico',
  laboratory: 'Laboratório',
  imaging: 'Imagem/ECG',
  pathology: 'Patologia',
  treatment: 'Tratamento',
};

/**
 * Section display labels in English
 */
export const CIP_SECTION_LABELS_EN: Record<CIPSection, string> = {
  medical_history: 'Medical History',
  physical_exam: 'Physical Exam',
  laboratory: 'Laboratory',
  imaging: 'Imaging/ECG',
  pathology: 'Pathology',
  treatment: 'Treatment',
};

/**
 * All available CIP sections
 */
export const ALL_CIP_SECTIONS: CIPSection[] = [
  'medical_history',
  'physical_exam',
  'laboratory',
  'imaging',
  'pathology',
  'treatment',
];

// ============================================
// CIP Finding Types
// ============================================

/**
 * A clinical finding that can be associated with a diagnosis
 * These are the "building blocks" of CIP puzzles
 */
export interface CIPFinding {
  /** Unique finding ID */
  id: string;
  /** Text in Portuguese */
  textPt: string;
  /** Text in English (optional for multilingual support) */
  textEn?: string;
  /** Which section this finding belongs to */
  section: CIPSection;
  /** ICD-10 codes this finding is commonly associated with */
  icd10Codes: string[];
  /** ATC medication codes if treatment-related */
  atcCodes: string[];
  /** Tags for filtering/search */
  tags: string[];
  /** AI-generated flag */
  isAIGenerated: boolean;
  /** Validation status */
  validatedBy?: 'community' | 'expert' | 'both';
}

// ============================================
// CIP Diagnosis Types
// ============================================

/**
 * A diagnosis with all its associated findings per section
 */
export interface CIPDiagnosis {
  /** Unique diagnosis ID */
  id: string;
  /** Diagnosis name in Portuguese */
  namePt: string;
  /** Diagnosis name in English */
  nameEn?: string;
  /** Primary ICD-10 code */
  icd10Code: string;
  /** Additional ICD-10 codes */
  icd10CodesSecondary: string[];
  /** ENAMED area */
  area: ENAMEDArea;
  /** Subspecialty within the area */
  subspecialty: string;
  /** Canonical findings for each section */
  findings: Record<CIPSection, CIPFinding[]>;
  /** Difficulty tier (1=very common, 5=rare) */
  difficultyTier: 1 | 2 | 3 | 4 | 5;
  /** Keywords for text-based similarity */
  keywords: string[];
}

// ============================================
// CIP Difficulty Settings
// ============================================

/**
 * Configuration for CIP puzzle difficulty
 */
export interface CIPDifficultySettings {
  /** Number of diagnoses (rows): 4-7 */
  diagnosisCount: 4 | 5 | 6 | 7;
  /** Sections to include (subset of all 6) */
  sections: CIPSection[];
  /** Number of distractor options per section */
  distractorCount: number;
  /** Whether options can be reused across diagnoses */
  allowReuse: boolean;
  /** Minimum semantic similarity for distractors (0-1) */
  minDistractorSimilarity: number;
  /** Maximum semantic similarity for distractors (0-1) */
  maxDistractorSimilarity: number;
}

/**
 * Default difficulty settings per level
 */
export const CIP_DIFFICULTY_PRESETS: Record<DifficultyLevel, CIPDifficultySettings> = {
  muito_facil: {
    diagnosisCount: 4,
    sections: ['medical_history', 'physical_exam', 'treatment'],
    distractorCount: 2,
    allowReuse: false,
    minDistractorSimilarity: 0.00,
    maxDistractorSimilarity: 0.30,
  },
  facil: {
    diagnosisCount: 5,
    sections: ['medical_history', 'physical_exam', 'laboratory', 'treatment'],
    distractorCount: 2,
    allowReuse: false,
    minDistractorSimilarity: 0.25,
    maxDistractorSimilarity: 0.45,
  },
  medio: {
    diagnosisCount: 5,
    sections: ['medical_history', 'physical_exam', 'laboratory', 'imaging', 'treatment'],
    distractorCount: 3,
    allowReuse: false,
    minDistractorSimilarity: 0.40,
    maxDistractorSimilarity: 0.60,
  },
  dificil: {
    diagnosisCount: 6,
    sections: ALL_CIP_SECTIONS,
    distractorCount: 3,
    allowReuse: true,
    minDistractorSimilarity: 0.55,
    maxDistractorSimilarity: 0.75,
  },
  muito_dificil: {
    diagnosisCount: 7,
    sections: ALL_CIP_SECTIONS,
    distractorCount: 4,
    allowReuse: true,
    minDistractorSimilarity: 0.70,
    maxDistractorSimilarity: 0.95,
  },
};

// ============================================
// CIP Puzzle Types
// ============================================

/**
 * A single cell in the CIP puzzle grid
 */
export interface CIPCell {
  /** Row index (diagnosis) */
  row: number;
  /** Column (section) */
  column: CIPSection;
  /** Correct finding ID for this cell */
  correctFindingId: string;
  /** User's selected finding ID (null if unanswered) */
  selectedFindingId: string | null;
  /** Per-cell IRT parameters (optional) */
  irt?: IRTParameters;
}

/**
 * A complete CIP puzzle instance
 */
export interface CIPPuzzle {
  /** Unique puzzle ID */
  id: string;
  /** Puzzle title */
  title: string;
  /** Description/instructions */
  description: string;
  /** ENAMED areas covered */
  areas: ENAMEDArea[];
  /** Difficulty level */
  difficulty: DifficultyLevel;
  /** Difficulty settings used to generate */
  settings: CIPDifficultySettings;
  /** The diagnoses (rows) in order */
  diagnoses: CIPDiagnosis[];
  /** Grid of cells [row][column index] */
  grid: CIPCell[][];
  /** Available options per section (correct + distractors, shuffled) */
  optionsPerSection: Record<CIPSection, CIPFinding[]>;
  /** Time limit in minutes */
  timeLimitMinutes: number;
  /** Overall IRT difficulty (computed) */
  irt: IRTParameters;
  /** Puzzle type */
  type: 'practice' | 'exam' | 'custom';
  /** AI-generated flag */
  isAIGenerated: boolean;
  /** Validation status */
  validatedBy?: 'community' | 'expert' | 'both';
  /** Creator user ID (or 'system') */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
}

// ============================================
// CIP Attempt Types
// ============================================

/**
 * User's attempt at a CIP puzzle
 */
export interface CIPAttempt {
  /** Unique attempt ID */
  id: string;
  /** Puzzle ID */
  puzzleId: string;
  /** User ID */
  userId: string;
  /** Current state of selections: "row_section" -> findingId */
  gridState: Record<string, string>;
  /** Time spent in seconds per cell: "row_section" -> seconds */
  timePerCell: Record<string, number>;
  /** Total time spent in seconds */
  totalTimeSeconds: number;
  /** Started timestamp */
  startedAt: Date;
  /** Completed timestamp (null if in progress) */
  completedAt: Date | null;
  /** Score result (calculated after completion) */
  score?: CIPScore;
}

// ============================================
// CIP Score Types
// ============================================

/**
 * Performance breakdown by section
 */
export interface CIPSectionPerformance {
  /** Number of correct answers in this section */
  correct: number;
  /** Total cells in this section */
  total: number;
  /** Percentage correct */
  percentage: number;
}

/**
 * Performance breakdown by diagnosis
 */
export interface CIPDiagnosisPerformance {
  /** Diagnosis ID */
  diagnosisId: string;
  /** Diagnosis name (for display) */
  diagnosisName: string;
  /** Number of correct answers for this diagnosis */
  correct: number;
  /** Total cells for this diagnosis */
  total: number;
  /** Percentage correct */
  percentage: number;
}

/**
 * CIP puzzle score result
 */
export interface CIPScore {
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
  /** Number of correct cells */
  correctCount: number;
  /** Total cells */
  totalCells: number;
  /** Raw percentage correct */
  percentageCorrect: number;
  /** Performance breakdown by section */
  sectionBreakdown: Record<CIPSection, CIPSectionPerformance>;
  /** Performance breakdown by diagnosis */
  diagnosisBreakdown: CIPDiagnosisPerformance[];
}

// ============================================
// Similarity Types (for distractor generation)
// ============================================

/**
 * Weights for multi-dimensional similarity calculation
 */
export interface SimilarityWeights {
  /** Weight for ICD-10 hierarchy similarity (0-1) */
  icd10: number;
  /** Weight for ATC hierarchy similarity (0-1) */
  atc: number;
  /** Weight for ENAMED area match (0-1) */
  area: number;
  /** Weight for subspecialty match (0-1) */
  subspecialty: number;
  /** Weight for keyword overlap (0-1) */
  keyword: number;
}

/**
 * Default similarity weights
 */
export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
  icd10: 0.40,
  atc: 0.20,
  area: 0.15,
  subspecialty: 0.15,
  keyword: 0.10,
};

/**
 * Similarity thresholds for each difficulty level
 * Higher similarity = harder to distinguish = harder question
 */
export const DIFFICULTY_SIMILARITY_THRESHOLDS: Record<DifficultyLevel, { min: number; max: number }> = {
  muito_facil: { min: 0.00, max: 0.30 },
  facil: { min: 0.25, max: 0.45 },
  medio: { min: 0.40, max: 0.60 },
  dificil: { min: 0.55, max: 0.75 },
  muito_dificil: { min: 0.70, max: 0.95 },
};

// ============================================
// CIP Generation Options
// ============================================

/**
 * Options for generating a CIP puzzle
 */
export interface CIPGenerationOptions {
  /** Target difficulty level */
  difficulty: DifficultyLevel;
  /** Optional custom settings (overrides preset) */
  customSettings?: Partial<CIPDifficultySettings>;
  /** Focus on specific ENAMED areas */
  areas?: ENAMEDArea[];
  /** Custom time limit in minutes */
  timeLimitMinutes?: number;
  /** Custom title */
  title?: string;
  /** Similarity weights for distractor selection */
  similarityWeights?: SimilarityWeights;
}

/**
 * Result of distractor selection
 */
export interface DistractorCandidate {
  /** The finding to use as distractor */
  finding: CIPFinding;
  /** Similarity to correct answer (0-1) */
  similarity: number;
  /** How well it matches target difficulty (0-1, higher = better match) */
  difficultyMatch: number;
}
