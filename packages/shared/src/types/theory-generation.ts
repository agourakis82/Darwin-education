/**
 * Theory Generation System Types
 *
 * Defines the complete type system for automated medical theory content generation,
 * research pipeline, validation, and citation management.
 */

import type { ENAMEDArea } from './education';
import type { ValidationIssue as QGenValidationIssue, ValidationStageResult as QGenValidationStageResult } from './qgen';

// Theory-specific difficulty levels (different from ENAMED questions)
export type TheoryDifficultyLevel = 'basico' | 'intermediario' | 'avancado';
export type EvidenceLevel = 'A' | 'B' | 'C' | 'unknown';
export type TopicStatus = 'draft' | 'review' | 'approved' | 'published';
export type SourceType = 'darwin-mfc' | 'manual' | 'hybrid';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ValidationStage = 'structural' | 'medical' | 'citations' | 'readability' | 'completeness';

/**
 * Research source from web search or medical database
 */
export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  source: 'brazilian_guideline' | 'pubmed' | 'uptodate' | 'web';
  relevance_score: number;  // 0-1
  publication_year?: number;
}

/**
 * Research result for a topic combining multiple sources
 */
export interface ResearchResult {
  topic: string;
  sources: ResearchSource[];
  darwinMFCData?: DarwinMFCDiseaseData;  // Disease data if available
  citations: Citation[];
  researchedAt: Date;
  cacheHit?: boolean;
}

/**
 * Citation with metadata and evidence level
 */
export interface Citation {
  url: string;
  title: string;
  source: string;  // 'Diretriz SBC', 'PubMed', 'UpToDate', etc.
  evidenceLevel: EvidenceLevel;
  publicationYear: number;
  authors?: string;
  journal?: string;
  doi?: string;
}

/**
 * Darwin-MFC disease data extracted for theory generation
 */
export interface DarwinMFCDiseaseData {
  id: string;
  title: string;
  definition: string;
  epidemiology?: string;
  pathophysiology?: string;
  clinicalPresentation?: string;
  diagnosis?: string;
  treatment?: string;
  complications?: string;
  prognosis?: string;
  keyPoints: string[];
  relatedDiseases?: string[];
  relatedMedications?: string[];
}

/**
 * Complete generated theory topic with all sections and metadata
 */
export interface GeneratedTheoryTopic {
  topicId: string;
  title: string;
  description: string;
  area: ENAMEDArea;
  difficulty: TheoryDifficultyLevel;

  // 8 content sections
  sections: {
    definition: string;
    epidemiology?: string;
    pathophysiology?: string;
    clinicalPresentation?: string;
    diagnosis?: string;
    treatment?: string;
    complications?: string;
    prognosis?: string;
  };

  // Learning metadata
  keyPoints: string[];  // 5-6 memorable takeaways
  estimatedReadTime: number;  // in minutes
  relatedDiseaseIds?: string[];
  relatedMedicationIds?: string[];

  // Citation and evidence
  citations: Citation[];
  citationProvenance: Record<string, string[]>;  // section -> citation URLs

  // Generation metadata
  generationMetadata: {
    sourceDiseaseId?: string;
    sourceType: SourceType;
    generatedAt: Date;
    validationScore: number;  // 0-1
    status: TopicStatus;
    generatedBy?: string;  // User ID
    publishedAt?: Date;
  };
}

/**
 * Validation result from 5-stage pipeline
 */
export interface ValidationResult {
  topicId: string;
  passed: boolean;
  score: number;  // 0-1, weighted average of all stages
  flags: ValidationFlag[];

  checks: {
    structural: TheoryValidationStageResult;
    medical: TheoryValidationStageResult;
    citations: TheoryValidationStageResult;
    readability: TheoryValidationStageResult;
    completeness: TheoryValidationStageResult;
  };

  details: {
    overallSummary: string;
    recommendedActions: string[];
    needsHumanReview: boolean;  // true if 0.70-0.89, false if auto-approved or rejected
  };
}

/**
 * Individual validation stage result for theory generation
 */
export interface TheoryValidationStageResult {
  passed: boolean;
  score: number;  // 0-1, weight varies by stage
  weight: number;  // percentage weight in overall score (e.g., 0.30 for 30%)
  issues: TheoryValidationIssue[];
}

/**
 * Individual validation issue for theory generation
 */
export interface TheoryValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  section?: string;
  suggestion?: string;
}

/**
 * Validation flag summary
 */
export interface ValidationFlag {
  stage: ValidationStage;
  level: 'critical' | 'warning' | 'info';
  message: string;
}

/**
 * Request to generate a single theory topic
 */
export interface GenerationRequest {
  source: SourceType;
  sourceId?: string;  // Darwin-MFC disease ID if source is darwin-mfc
  topicTitle: string;
  area: ENAMEDArea;
  targetDifficulty?: TheoryDifficultyLevel;  // defaults to inferred from source
  includeWebResearch?: boolean;  // defaults to true
  relatedDiseases?: string[];
  relatedMedications?: string[];
}

/**
 * Request for batch generation
 */
export interface BatchGenerationRequest {
  topics: GenerationRequest[];
  concurrency?: number;  // number of parallel generations (default: 3)
  costLimit?: number;  // max cost in USD (default: unlimited)
  autoApproveThreshold?: number;  // score >= this value skips human review (default: 0.90)
}

/**
 * Batch generation job
 */
export interface GenerationJob {
  id: string;
  batchName?: string;
  totalTopics: number;
  completedTopics: number;
  failedTopics: number;
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  costUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a single topic generation in a batch
 */
export interface GenerationJobTopic {
  jobId: string;
  topicId: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  costUsd?: number;
  generatedAt?: Date;
}

/**
 * Theory content section with metadata
 */
export interface TheorySection {
  name: string;
  label: string;
  icon: string;
  content?: string;
  citations: Citation[];
}

/**
 * Admin dashboard request/response types
 */
export interface AdminGenerationFormData {
  source: SourceType;
  sourceId?: string;
  topicTitle: string;
  area: ENAMEDArea;
  difficulty: TheoryDifficultyLevel;
  quantity?: number;  // for batch
}

export interface AdminReviewQueueItem {
  topicId: string;
  title: string;
  area: ENAMEDArea;
  difficulty: TheoryDifficultyLevel;
  validationScore: number;
  issues: ValidationFlag[];
  generatedAt: Date;
  citations: Citation[];
}

/**
 * Cost tracking
 */
export interface CostBreakdown {
  research: number;  // WebSearch and WebFetch calls
  generation: number;  // LLM generation calls
  validation: number;  // LLM validation calls
  total: number;
}

/**
 * Generation statistics
 */
export interface GenerationStatistics {
  totalTopicsGenerated: number;
  topicsInStatus: Record<TopicStatus, number>;
  topicsByArea: Record<ENAMEDArea, number>;
  topicsByDifficulty: Record<TheoryDifficultyLevel, number>;
  averageValidationScore: number;
  autoApprovalRate: number;  // percentage of 0.90+ scores
  averageCostPerTopic: number;
  totalCostUsd: number;
  citations: {
    total: number;
    bySource: Record<string, number>;
    byEvidenceLevel: Record<EvidenceLevel, number>;
    averageRecency: number;  // average publication year
  };
}

/**
 * Prompt context for theory generation
 */
export interface PromptContext {
  request: GenerationRequest;
  research: ResearchResult;
  baseContent?: Partial<GeneratedTheoryTopic>;
  examples: GeneratedTheoryTopic[];
  darwinMFCData?: DarwinMFCDiseaseData;
}

/**
 * Validation flag for RLS and audit
 */
export type ValidationFlagType =
  | 'missing_section'
  | 'insufficient_citations'
  | 'outdated_pattern'
  | 'drug_interaction_conflict'
  | 'readability_issue'
  | 'clinical_accuracy_concern'
  | 'evidence_quality_concern';

// Types are exported from index.ts to avoid circular dependencies
