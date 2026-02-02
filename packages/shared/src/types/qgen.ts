/**
 * QGen-DDL Types
 * ================
 *
 * Types for the Question Generation system with DDL integration
 */

import { ENAMEDArea } from './education';

// ============================================================
// ENUMS
// ============================================================

export enum QuestionSource {
  ENAMED = 'ENAMED',
  ENARE = 'ENARE',
  USP = 'USP',
  UNIFESP = 'UNIFESP',
  UNICAMP = 'UNICAMP',
  SANTA_CASA = 'SANTA_CASA',
  EINSTEIN = 'EINSTEIN',
  SUS_SP = 'SUS_SP',
  MEDCURSO = 'MEDCURSO',
  GENERATED = 'GENERATED',
  OTHER = 'OTHER',
}

export enum QGenQuestionType {
  CLINICAL_CASE = 'CLINICAL_CASE',
  CONCEPTUAL = 'CONCEPTUAL',
  IMAGE_BASED = 'IMAGE_BASED',
  CALCULATION = 'CALCULATION',
  INTERPRETATION = 'INTERPRETATION',
  ETHICAL_LEGAL = 'ETHICAL_LEGAL',
  EPIDEMIOLOGICAL = 'EPIDEMIOLOGICAL',
  MIXED = 'MIXED',
}

export enum BloomLevel {
  KNOWLEDGE = 'KNOWLEDGE',
  COMPREHENSION = 'COMPREHENSION',
  APPLICATION = 'APPLICATION',
  ANALYSIS = 'ANALYSIS',
  SYNTHESIS = 'SYNTHESIS',
  EVALUATION = 'EVALUATION',
}

export enum ClinicalScenario {
  EMERGENCY = 'EMERGENCY',
  OUTPATIENT = 'OUTPATIENT',
  INPATIENT = 'INPATIENT',
  ICU = 'ICU',
  PRIMARY_CARE = 'PRIMARY_CARE',
  HOME_VISIT = 'HOME_VISIT',
  SURGERY = 'SURGERY',
  PRENATAL = 'PRENATAL',
  CHILDBIRTH = 'CHILDBIRTH',
  VACCINATION = 'VACCINATION',
  OTHER = 'OTHER',
}

export enum DistractorType {
  PLAUSIBLE_RELATED = 'PLAUSIBLE_RELATED',
  PARTIALLY_CORRECT = 'PARTIALLY_CORRECT',
  COMMON_MISCONCEPTION = 'COMMON_MISCONCEPTION',
  INVERTED = 'INVERTED',
  INCOMPLETE = 'INCOMPLETE',
  OUTDATED = 'OUTDATED',
  DIFFERENT_CONTEXT = 'DIFFERENT_CONTEXT',
  ABSOLUTE_TERM = 'ABSOLUTE_TERM',
  OBVIOUS_WRONG = 'OBVIOUS_WRONG',
}

export enum PatientAgeCategory {
  NEONATE = 'NEONATE',           // 0-28 days
  INFANT = 'INFANT',             // 29 days - 2 years
  PRESCHOOL = 'PRESCHOOL',       // 2-6 years
  SCHOOL_AGE = 'SCHOOL_AGE',     // 6-12 years
  ADOLESCENT = 'ADOLESCENT',     // 12-18 years
  YOUNG_ADULT = 'YOUNG_ADULT',   // 18-40 years
  MIDDLE_ADULT = 'MIDDLE_ADULT', // 40-65 years
  ELDERLY = 'ELDERLY',           // >65 years
}

export enum ValidationStatus {
  DRAFT = 'DRAFT',
  AUTO_VALIDATED = 'AUTO_VALIDATED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
  PUBLISHED = 'PUBLISHED',
}

export enum ValidationDecision {
  AUTO_APPROVE = 'AUTO_APPROVE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  NEEDS_REVISION = 'NEEDS_REVISION',
  REJECT = 'REJECT',
}

// ============================================================
// FEATURE INTERFACES
// ============================================================

/**
 * Structural features of a question
 */
export interface StructuralFeatures {
  // Stem metrics
  stemWordCount: number;
  stemSentenceCount: number;
  stemCharCount: number;
  avgWordsPerSentence: number;

  // Alternatives
  numAlternatives: number;
  alternativesWordCounts: Record<string, number>;
  alternativesLengthVariance: number;
  longestAlternative: string;
  shortestAlternative: string;

  // Components present in stem
  components: {
    hasPatientDemographics: boolean;
    hasChiefComplaint: boolean;
    hasTimeEvolution: boolean;
    hasPhysicalExam: boolean;
    hasVitalSigns: boolean;
    hasLabResults: boolean;
    hasImaging: boolean;
    hasPathology: boolean;
    hasMedicationHistory: boolean;
    hasFamilyHistory: boolean;
    hasSocialHistory: boolean;
  };

  // Question format
  questionFormat: string;
  isNegativeStem: boolean;

  // Question target
  questionTarget: {
    asksDiagnosis: boolean;
    asksTreatment: boolean;
    asksNextStep: boolean;
    asksMechanism: boolean;
    asksPrognosis: boolean;
    asksEpidemiologic: boolean;
    asksEthical: boolean;
  };
}

/**
 * Clinical features (for clinical cases)
 */
export interface ClinicalFeatures {
  // Patient demographics
  patient: {
    sex: 'male' | 'female' | 'unspecified';
    ageValue: number | null;
    ageUnit: 'days' | 'months' | 'years' | null;
    ageCategory: PatientAgeCategory | null;
    occupation: string | null;
    ethnicity: string | null;
    isPregnant: boolean;
    gestationalAge: number | null;
  };

  // Scenario
  scenario: {
    type: ClinicalScenario;
    urgencyLevel: 'elective' | 'urgent' | 'emergent';
    setting: string;
  };

  // Presentation
  presentation: {
    chiefComplaint: string | null;
    timeEvolutionValue: number | null;
    timeEvolutionUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years' | null;
    isAcute: boolean;
    isChronic: boolean;
    isRecurrent: boolean;
    associatedSymptoms: string[];
  };

  // Vital signs
  vitalSigns: {
    bloodPressure: string | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    temperature: number | null;
    oxygenSaturation: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
  } | null;

  // Physical exam
  physicalExam: {
    systems: string[];
    findings: Record<string, string>;
    generalAppearance: string | null;
  } | null;

  // Lab tests
  labTests: {
    name: string;
    value: string;
    unit: string;
    isAbnormal: boolean;
  }[] | null;

  // Imaging tests
  imagingTests: {
    type: string;
    region: string;
    findings: string;
  }[] | null;

  // Diagnosis
  diagnosis: {
    primary: string | null;
    differentials: string[];
    icd10Codes: string[];
  };
}

/**
 * Cognitive features
 */
export interface CognitiveFeatures {
  // Bloom level
  bloomLevel: BloomLevel;
  bloomConfidence: number;

  // Cognitive domains activated
  cognitiveDomains: {
    requiresRecall: boolean;
    requiresUnderstanding: boolean;
    requiresApplication: boolean;
    requiresAnalysis: boolean;
    requiresSynthesis: boolean;
    requiresEvaluation: boolean;
  };

  // Knowledge types tested
  knowledgeTypes: {
    factual: boolean;
    conceptual: boolean;
    procedural: boolean;
    metacognitive: boolean;
  };

  // Required skills
  requiredSkills: {
    calculation: boolean;
    interpretation: boolean;
    clinicalReasoning: boolean;
    ethicalReasoning: boolean;
    integration: boolean;
    patternRecognition: boolean;
  };

  // Key concepts
  keyConcepts: {
    concept: string;
    weight: number;
    required: boolean;
    category: string;
  }[];

  // Required integrations
  requiredIntegrations: {
    from: string;
    to: string;
    type: 'causal' | 'temporal' | 'hierarchical' | 'comparative';
    description: string;
  }[];

  // Prerequisites
  prerequisiteConcepts: string[];

  // Complexity metrics
  complexity: {
    conceptCount: number;
    integrationCount: number;
    cognitiveLoadEstimate: number;
    estimatedTimeSeconds: number;
  };
}

/**
 * Linguistic features
 */
export interface LinguisticFeatures {
  // Hedging markers
  hedging: {
    count: number;
    markers: string[];
    density: number;
  };

  // Absolute terms
  absoluteTerms: {
    count: number;
    markers: string[];
    inCorrectAnswer: boolean;
  };

  // Logical connectives
  logicalConnectives: {
    connectives: string[];
    count: number;
    types: ('causal' | 'adversative' | 'additive' | 'temporal')[];
  };

  // Analysis per alternative
  alternativesAnalysis: Record<string, {
    hedgingCount: number;
    absoluteCount: number;
    wordCount: number;
    avgWordLength: number;
    hasNegation: boolean;
  }>;

  // Linguistic cues (problems)
  linguisticCues: {
    grammaticalCues: boolean;
    lengthCue: boolean;
    absoluteInCorrect: boolean;
    issues: string[];
  };

  // Readability metrics
  readability: {
    fleschReadingEase: number;
    gunningFogIndex: number;
    avgSyllablesPerWord: number;
    avgWordsPerSentence: number;
  };

  // Technical vocabulary
  vocabulary: {
    medicalTerms: string[];
    abbreviations: string[];
    eponyms: string[];
    technicalTermDensity: number;
  };
}

/**
 * Distractor features
 */
export interface DistractorFeatures {
  alternative: string;
  isCorrect: boolean;

  // Classification
  type: DistractorType;
  typeConfidence: number;

  // Plausibility
  plausibilityScore: number;

  // Relation to correct answer
  semanticSimilarityToCorrect: number;
  sharesKeyConcepts: boolean;
  conceptOverlapCount: number;

  // Misconception
  targetsMisconception: boolean;
  misconceptionId: string | null;
  misconceptionDescription: string | null;

  // Conduct analysis (if applicable)
  conductAnalysis: {
    isValidButNotBest: boolean;
    isContraindicated: boolean;
    isOutdated: boolean;
    isIncomplete: boolean;
    harmPotential: 'none' | 'low' | 'moderate' | 'high';
  } | null;

  // Empirical metrics (if available)
  empiricalMetrics: {
    selectionRate: number;
    discriminationIndex: number;
    pointBiserial: number;
  } | null;
}

/**
 * Complete extracted features object
 */
export interface ExtractedFeatures {
  // Identification
  questionId: string;
  extractionTimestamp: string;
  extractorVersion: string;

  // Features by category
  structural: StructuralFeatures;
  clinical: ClinicalFeatures | null;
  cognitive: CognitiveFeatures;
  linguistic: LinguisticFeatures;
  distractors: DistractorFeatures[];

  // IRT estimated/calculated
  irt: {
    difficulty: number;
    discrimination: number;
    guessing: number;
    source: 'calculated' | 'estimated' | 'unknown';
  };

  // Extraction metadata
  extractionMetadata: {
    confidence: number;
    warnings: string[];
    processingTimeMs: number;
  };
}

// ============================================================
// QGEN QUESTION & GENERATION TYPES
// ============================================================

/**
 * Question from corpus
 */
export interface QGenCorpusQuestion {
  id: string;
  source: QuestionSource;
  sourceYear: number | null;
  sourceExam: string | null;
  originalNumber: number | null;
  externalId: string | null;

  fullText: string;
  stem: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  explanation: string | null;

  questionType: QGenQuestionType;
  primaryArea: string;
  secondaryArea: string | null;
  topic: string | null;
  subtopic: string | null;

  extractedFeatures: ExtractedFeatures | null;

  hasImage: boolean;
  hasTable: boolean;
  hasLabValues: boolean;
  wordCount: number | null;

  irtDifficulty: number | null;
  irtDiscrimination: number | null;
  irtGuessing: number | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Generated question
 */
export interface QGenGeneratedQuestion {
  id: string;
  generationConfigId: string | null;
  generationTimestamp: string;

  stem: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  explanation: string | null;

  targetArea: string | null;
  targetTopic: string | null;
  targetDifficulty: number | null;
  targetBloomLevel: BloomLevel | null;

  generatedFeatures: ExtractedFeatures | null;

  validationStatus: ValidationStatus;
  qualityScores: QGenQualityScores | null;

  maxCorpusSimilarity: number | null;
  mostSimilarCorpusId: string | null;

  estimatedDifficulty: number | null;
  estimatedDiscrimination: number | null;

  reviewerId: string | null;
  reviewTimestamp: string | null;
  reviewNotes: string | null;
  reviewScore: number | null;

  llmModel: string | null;
  llmPromptVersion: string | null;
  llmRawResponse: unknown | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Quality scores for generated question
 */
export interface QGenQualityScores {
  medicalAccuracy: number;
  linguisticQuality: number;
  distractorQuality: number;
  originality: number;
  difficultyMatch: number;
  overall: number;
}

/**
 * Generation configuration
 */
export interface QGenGenerationConfig {
  id?: string;

  // Target parameters
  targetArea: ENAMEDArea | string;
  targetTopic?: string;
  targetDifficulty?: number;
  targetBloomLevel?: BloomLevel;
  targetQuestionType?: QGenQuestionType;

  // LLM settings
  llmModel?: string;
  llmTemperature?: number;
  llmMaxTokens?: number;

  // Prompt settings
  promptVersion?: string;
  useFewShot?: boolean;
  fewShotCount?: number;

  // Validation settings
  minQualityScore?: number;
  maxCorpusSimilarity?: number;
  requireHumanReview?: boolean;

  // Misconception targeting
  targetMisconceptions?: string[];

  // DDL integration
  ddlLacunaType?: string;
  studentProfile?: {
    theta: number;
    weakAreas: string[];
    recentErrors: string[];
  };
}

/**
 * Batch generation options
 */
export interface QGenBatchOptions {
  count: number;
  configs: QGenGenerationConfig[];
  parallelism?: number;
  stopOnError?: boolean;
}

/**
 * Exam generation config
 */
export interface QGenExamConfig {
  questionCount: number;
  areaDistribution?: Record<string, number>;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  bloomDistribution?: Partial<Record<BloomLevel, number>>;
  excludeQuestionIds?: string[];
  targetTheta?: number;
}

// ============================================================
// VALIDATION TYPES
// ============================================================

/**
 * Validation result
 */
export interface QGenValidationResult {
  questionId: string;
  validationTimestamp: string;

  // Stage results
  stages: {
    structural: ValidationStageResult;
    linguistic: ValidationStageResult;
    medicalAccuracy: ValidationStageResult;
    distractorQuality: ValidationStageResult;
    originality: ValidationStageResult;
    irtEstimation: ValidationStageResult;
  };

  // Overall
  overallScore: number;
  decision: ValidationDecision;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationStageResult {
  stageName: string;
  score: number;
  passed: boolean;
  details: Record<string, unknown>;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * Human review
 */
export interface QGenHumanReview {
  id: string;
  questionId: string;
  reviewerId: string;

  medicalAccuracyScore: number;
  clinicalRelevanceScore: number;
  linguisticClarityScore: number;
  distractorQualityScore: number;
  difficultyAppropriateScore: number;
  overallScore: number;

  medicalIssues: string | null;
  linguisticIssues: string | null;
  suggestedChanges: string | null;

  decision: 'approve' | 'reject' | 'revise';
  reviewDurationSeconds: number | null;

  createdAt: string;
}

// ============================================================
// MISCONCEPTION TYPES
// ============================================================

/**
 * Medical misconception
 */
export interface QGenMisconception {
  id: string;
  code: string | null;
  name: string;

  areaId: string | null;
  topicId: string | null;

  incorrectBelief: string;
  correctUnderstanding: string;
  whyCommon: string | null;

  conceptsInvolved: string[] | null;
  prevalenceEstimate: number | null;

  sourceStudies: unknown | null;
  correctionStrategies: string[] | null;

  createdAt: string;
}

// ============================================================
// STATISTICS TYPES
// ============================================================

/**
 * QGen statistics
 */
export interface QGenStats {
  totalGenerated: number;
  byStatus: Record<ValidationStatus, number>;
  byArea: Record<string, number>;
  avgQualityScore: number;
  avgGenerationTime: number;
  approvalRate: number;
  costEstimate: number;
}

/**
 * Corpus statistics
 */
export interface QGenCorpusStats {
  totalQuestions: number;
  bySource: Record<QuestionSource, number>;
  byArea: Record<string, number>;
  byType: Record<QGenQuestionType, number>;
  byBloomLevel: Record<BloomLevel, number>;
  avgDifficulty: number;
  avgWordCount: number;
}

// ============================================================
// API TYPES
// ============================================================

/**
 * Generation request
 */
export interface QGenGenerateRequest {
  config: QGenGenerationConfig;
}

/**
 * Generation response
 */
export interface QGenGenerateResponse {
  question: QGenGeneratedQuestion;
  validation: QGenValidationResult;
  generationTimeMs: number;
  tokensUsed: number;
  cost: number;
}

/**
 * Batch generation request
 */
export interface QGenBatchRequest {
  options: QGenBatchOptions;
}

/**
 * Batch generation response
 */
export interface QGenBatchResponse {
  questions: QGenGenerateResponse[];
  totalTimeMs: number;
  successCount: number;
  failureCount: number;
  totalCost: number;
}

/**
 * Adaptive generation request
 */
export interface QGenAdaptiveRequest {
  studentId: string;
  ddlClassification: {
    lacunaType: string;
    confidence: number;
    weakConcepts: string[];
  };
  currentTheta?: number;
}

/**
 * Adaptive generation response
 */
export interface QGenAdaptiveResponse extends QGenGenerateResponse {
  adaptiveRationale: string;
  targetedMisconceptions: string[];
  expectedLearningOutcome: string;
}
