/**
 * ETL Plugin Interface
 * Defines the contract for all question source plugins
 */

export interface ScrapedData {
  pdfs: Map<string, Buffer>;      // filename -> buffer
  metadata: Record<string, any>;  // Source-specific metadata
  timestamp: Date;
}

export interface ParsedQuestions {
  questions: RawQuestion[];
  metadata: Record<string, any>;
  parseStats: {
    totalExtracted: number;
    successCount: number;
    failureCount: number;
    warnings: string[];
  };
}

export interface RawQuestion {
  number: number;
  stem: string;
  options: {
    letter: string;
    text: string;
  }[];
  correctAnswer?: string;
  metadata?: Record<string, any>;
}

export interface CompleteQuestions {
  questions: CompleteQuestion[];
  validationStats: {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    issues: string[];
  };
}

export interface CompleteQuestion {
  id: string;
  bankId: string;
  stem: string;
  options: {
    letter: string;
    text: string;
    feedback?: string;
  }[];
  correctIndex: number;
  area: string;
  year: number;
  metadata: QuestionMetadata;
  irt: IRTParameters;
}

export interface QuestionMetadata {
  institution: string;
  institutionTier: 'TIER_1_NATIONAL' | 'TIER_2_REGIONAL_STRONG' | 'TIER_3_REGIONAL';
  examType: 'R1' | 'R2' | 'R3' | 'national' | 'concurso';
  questionPosition: number;
  totalQuestionsInExam: number;
  optionCount: number;
  source: string;
}

export interface IRTParameters {
  difficulty: number;
  discrimination: number;
  guessing: number;
  infit?: number;
  outfit?: number;
  estimated: boolean;
  confidence: number;
  method: 'metadata' | 'expert' | 'empirical';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalQuestions: number;
    validQuestions: number;
    invalidQuestions: number;
  };
}

export interface ETLResult {
  success: boolean;
  pluginId: string;
  totalQuestions: number;
  sqlPath?: string;
  errors?: string[];
  warnings?: string[];
  duration: number; // milliseconds
}

/**
 * ETL Plugin Interface
 * Implement this interface for each question source
 */
export interface ETLPlugin {
  readonly id: string;                 // Unique identifier (e.g., 'enare-2024')
  readonly name: string;               // Display name
  readonly description: string;        // User-friendly description
  readonly version: string;            // Plugin version

  /**
   * Plugin lifecycle methods
   */
  initialize(): Promise<void>;
  scrape(): Promise<ScrapedData>;
  parse(data: ScrapedData): Promise<ParsedQuestions>;
  transform(questions: ParsedQuestions): Promise<CompleteQuestions>;
  validate(questions: CompleteQuestions): Promise<ValidationResult>;
  load(questions: CompleteQuestions): Promise<string>; // Returns SQL file path

  /**
   * Metadata methods
   */
  estimatedQuestionCount(): number;
  supportedYears(): number[];
  requiresManualSetup(): boolean;     // Do PDFs need manual download?
}
