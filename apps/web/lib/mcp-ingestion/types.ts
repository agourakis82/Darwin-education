export interface IngestionSource {
  id: string;
  name: string;
  search_terms: string[];
  trusted_domains: string[];
  is_active: boolean;
  last_run_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface IngestionRun {
  id: string;
  source_id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  links_found: number;
  questions_extracted: number;
  error_message: string | null;
  started_at: Date;
  completed_at: Date | null;
}

export interface IngestedQuestion {
  id: string;
  run_id: string | null;
  source_url: string;
  institution: string | null;
  year: number | null;
  exam_type: string | null;
  
  raw_text: string | null;
  stem: string;
  options: { letter: string; text: string }[];
  correct_index: number | null;
  image_url: string | null;
  
  area: 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva' | 'unknown' | null;
  tags: string[];
  
  status: 'pending' | 'approved' | 'rejected' | 'conflict' | 'needs_review';
  curator_notes: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  target_question_id: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface McpSearchResult {
  title: string;
  url: string;
  snippet: string;
  type?: 'prova' | 'gabarito' | 'unknown';
}

// ============================================================
// Convergence Pipeline Types
// ============================================================

export type ENAMEDAreaClassification = 'clinica_medica' | 'cirurgia' | 'ginecologia_obstetricia' | 'pediatria' | 'saude_coletiva';

export type LLMProviderName = 'grok-fast' | 'grok-reasoning' | 'gpt-4o';

export interface ClassificationLLMResult {
  area: ENAMEDAreaClassification | 'unknown';
  tags: string[];
  confidence: number;
  rawResponse: string;
  model: string;
  latencyMs: number;
}

export interface QualityIssue {
  type: 'incomplete_stem' | 'missing_options' | 'no_correct_answer' |
        'duplicate_options' | 'too_short' | 'language_issues' |
        'ambiguous_stem' | 'clinical_inaccuracy' | 'weak_distractor';
  severity: 'critical' | 'major' | 'minor';
  description: string;
}

export interface QualityLLMResult {
  qualityScore: number;
  isWellFormed: boolean;
  isComplete: boolean;
  hasCorrectAnswer: boolean;
  issues: QualityIssue[];
  critique: string;
  model: string;
}

export interface ConvergenceResult {
  finalArea: ENAMEDAreaClassification | 'unknown';
  finalTags: string[];
  convergenceStatus: 'agreed' | 'soft_agree' | 'disagreed';
  confidenceScore: number;
  providerA: { name: string; area: string; confidence: number; model: string };
  providerB: { name: string; area: string; confidence: number; model: string };
  qualityResult?: QualityLLMResult;
}

export interface ConvergenceMetadata {
  convergence: {
    providerA: { name: string; area: string; confidence: number };
    providerB: { name: string; area: string; confidence: number };
    status: 'agreed' | 'soft_agree' | 'disagreed';
  };
  quality: {
    score: number;
    issues: QualityIssue[];
    model: string;
  } | null;
  pipeline_version: string;
  processed_at: string;
}

export interface PipelineStats {
  totalProcessed: number;
  agreed: number;
  softAgreed: number;
  disagreed: number;
  approved: number;
  needsReview: number;
  conflicted: number;
  averageQualityScore: number;
  totalLLMCalls: number;
  totalDurationMs: number;
  providerA: string;
  providerB: string;
}
