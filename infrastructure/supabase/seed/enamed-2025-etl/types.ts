/**
 * Type definitions for ENAMED 2025 ETL Pipeline
 */

// ============================================================================
// Source Data Types (from microdata files)
// ============================================================================

/**
 * Raw item parameters from microdados2025_parametros_itens.txt
 */
export interface RawItemParameters {
  NU_ITEM_PROVA_1: number; // Item number in exam version 1 (1-100)
  NU_ITEM_PROVA_2: number; // Item number in exam version 2
  ITEM_MANTIDO: 0 | 1; // 1 = valid, 0 = excluded from analysis
  PARAMETRO_B: number | null; // IRT difficulty parameter
  COR_BISSERIAL: number | null; // Point-biserial correlation
  INFIT: number | null; // Infit statistic
  OUTFIT: number | null; // Outfit statistic
}

/**
 * Processed item parameters with estimated values
 */
export interface ProcessedItemParameters extends RawItemParameters {
  // Estimated IRT parameters
  estimatedDiscrimination: number; // Derived from biserial or default
  discriminationSource: 'biserial' | 'default';
  guessing: number; // Fixed at 0.25
}

/**
 * Raw participant data from ENADE/Demais Participantes files
 */
export interface RawParticipantData {
  NU_ANO: number; // Year (2025)
  TP_INSCRICAO: number; // 0 = ENADE, 1 = Demais
  CO_CADERNO: number; // Exam version (1 or 2)
  NU_ITEM: number; // Question count
  DS_VT_GAB_OBJ: string; // Answer key (100 chars)
  DS_VT_ACE_OBJ: string; // Student answers (100 chars)
  DS_VT_ESC_OBJ: string; // Scoring vector (100 chars)
  TP_PR_GER: number; // Attendance status (222 = valid)
  PROFICIENCIA: number | null; // Official theta estimate
  NT_GER: number | null; // Official scaled score (0-100)
  QT_ACERTO_AREA_1: number; // Correct in area 1
  QT_ACERTO_AREA_2: number; // Correct in area 2
  QT_ACERTO_AREA_3: number; // Correct in area 3
  QT_ACERTO_AREA_4: number; // Correct in area 4
  QT_ACERTO_AREA_5: number; // Correct in area 5
}

/**
 * Processed participant with parsed responses
 */
export interface ProcessedParticipant {
  inscriptionType: 'enade' | 'demais';
  examVersion: 1 | 2;
  responses: boolean[]; // true = correct, false = incorrect
  officialTheta: number | null;
  officialScaledScore: number | null;
  areaCorrect: Record<number, number>; // Area index -> correct count
  isValid: boolean; // TP_PR_GER = 222
}

// ============================================================================
// Scraped Data Types (from INEP portal PDFs)
// ============================================================================

/**
 * Question option extracted from PDF
 */
export interface QuestionOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

/**
 * Question extracted from exam PDF
 */
export interface ExtractedQuestion {
  itemNumber: number; // Position in exam (1-100)
  caderno: 1 | 2; // Exam version
  stem: string; // Clinical case/question text
  options: QuestionOption[];
  images?: string[]; // Base64 encoded images
  correctAnswer?: 'A' | 'B' | 'C' | 'D'; // From gabarito
}

/**
 * Gabarito (answer key) data
 */
export interface Gabarito {
  caderno: 1 | 2;
  answers: Record<number, 'A' | 'B' | 'C' | 'D' | null>; // itemNumber -> answer
}

// ============================================================================
// Merged/Output Types
// ============================================================================

/**
 * ENAMED Area type (matches Darwin Education types)
 */
export type ENAMEDArea =
  | 'clinica_medica'
  | 'cirurgia'
  | 'ginecologia_obstetricia'
  | 'pediatria'
  | 'saude_coletiva';

/**
 * Complete question ready for database insertion
 */
export interface CompleteQuestion {
  id: string; // UUID format: q-enamed-2025-XXX
  bankId: string;

  // Content (from PDF)
  stem: string;
  options: QuestionOption[];
  correctIndex: number; // 0-3 (A=0, B=1, C=2, D=3)
  explanation?: string;

  // IRT parameters (from microdata)
  irt: {
    difficulty: number; // PARAMETRO_B
    discrimination: number; // Estimated from biserial
    guessing: number; // 0.25
    infit: number | null;
    outfit: number | null;
  };

  // Classification
  area: ENAMEDArea;
  year: number;

  // Metadata
  examVersion: 1 | 2;
  originalItemNumber: number;
  validatedBy: 'expert';
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Individual validation result for one participant
 */
export interface ValidationResult {
  participantIndex: number;
  officialTheta: number;
  darwinTheta: number;
  thetaDifference: number;
  officialScaled: number | null;
  darwinScaled: number;
  responseCount: number;
  correctCount: number;
}

/**
 * Summary of validation across all participants
 */
export interface ValidationSummary {
  totalParticipants: number;
  validParticipants: number;

  // Correlation metrics
  pearsonR: number;
  spearmanRho: number;

  // Error metrics
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  maxError: number;

  // Distribution of errors
  percentWithin01: number; // Within 0.1 theta
  percentWithin025: number; // Within 0.25 theta
  percentWithin05: number; // Within 0.5 theta

  // Extreme cases
  worstCases: ValidationResult[];

  // Recommendations
  passed: boolean;
  recommendations: string[];
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Distribution statistics for theta scores
 */
export interface ThetaDistribution {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  percentiles: Record<number, number>; // 5, 10, 25, 50, 75, 90, 95
  histogram: HistogramBucket[];
}

/**
 * Histogram bucket for distributions
 */
export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

/**
 * Area performance statistics
 */
export interface AreaStatistics {
  area: ENAMEDArea;
  totalQuestions: number;
  meanCorrect: number;
  percentageCorrect: number;
  averageDifficulty: number;
}

/**
 * Complete statistics report
 */
export interface StatisticsReport {
  generatedAt: string;
  dataSource: string;

  // Participant counts
  totalRecords: number;
  validCompletions: number;

  // Score distributions
  thetaDistribution: ThetaDistribution;
  scaledScoreDistribution: ThetaDistribution;

  // Area breakdown
  areaStatistics: AreaStatistics[];

  // Item statistics
  itemDifficultyRange: { min: number; max: number };
  itemDiscriminationRange: { min: number; max: number };
  excludedItems: number[];
}

// ============================================================================
// Pipeline Types
// ============================================================================

/**
 * ETL Pipeline options
 */
export interface ETLOptions {
  // Modes
  scrapeOnly: boolean; // Only download/parse PDFs
  parseOnly: boolean; // Only parse microdata (no scraping)
  validateOnly: boolean; // Only run validation
  full: boolean; // Full pipeline

  // Limits
  sampleSize?: number; // Limit participant records for testing
  skipValidation: boolean; // Skip validation step

  // Output
  outputDir: string;
  verbose: boolean;
}

/**
 * Pipeline result
 */
export interface ETLResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds

  // Counts
  itemsParsed: number;
  questionsScraped: number;
  questionsMerged: number;
  participantsProcessed: number;

  // Outputs
  sqlFile?: string;
  validationReport?: string;
  statisticsReport?: string;

  // Errors
  errors: string[];
  warnings: string[];
}
