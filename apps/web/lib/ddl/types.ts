// ============================================================
// DDL TYPES
// Diagnostico Diferencial de Lacunas de Aprendizagem
// ============================================================

// Lacuna types
export type LacunaType = 'LE' | 'LEm' | 'LIE' | 'MIXED' | 'NONE'
export type ConfidenceLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'

// Question types
export interface KeyConcept {
  concept: string
  weight: number
  synonyms: string[]
}

export interface Integration {
  from: string
  to: string
  relation: string
}

export interface DDLQuestion {
  id: string
  question_code: string
  question_text: string
  discipline: string
  topic: string
  subtopic?: string
  difficulty_level: number
  cognitive_level: string
  reference_answer: string
  key_concepts: KeyConcept[]
  required_integrations: Integration[]
}

// Behavioral data types
export interface KeystrokeDynamics {
  total_keystrokes: number
  backspace_count: number
  delete_count: number
  avg_inter_key_interval_ms: number
}

export interface RevisionEvent {
  timestamp: string
  type: string
  position?: number
  start?: number
  end?: number
}

export interface FocusEvent {
  timestamp: string
  type: 'blur' | 'focus'
  duration_ms?: number
}

export interface BehavioralData {
  start_timestamp: string
  end_timestamp: string
  total_time_ms: number
  time_to_first_keystroke_ms: number
  pause_count: number
  pause_durations_ms: number[]
  keystroke_dynamics: KeystrokeDynamics
  revision_events: RevisionEvent[]
  focus_events: FocusEvent[]
  scroll_events: number
  copy_paste_events: number
}

// Response types
export interface DDLResponse {
  id: string
  user_id: string
  question_id: string
  session_id: string
  response_text: string
  behavioral_data: BehavioralData
}

// Semantic analysis types
export interface ConceptDetail {
  concept: string
  status: 'present' | 'missing' | 'incorrect' | 'partial'
  evidence: string
  quality: 'accurate' | 'imprecise' | 'misconceived'
}

export interface DetectedIntegration {
  from: string
  to: string
  expected_relation: string
  detected: boolean
  quality: 'complete' | 'partial' | 'incorrect' | 'missing'
  evidence?: string
}

export interface SemanticAnalysisResult {
  concept_analysis: {
    matched_concepts: string[]
    missing_concepts: string[]
    incorrect_concepts: string[]
    coverage_ratio: number
    concept_details?: ConceptDetail[]
  }
  integration_analysis: {
    detected_integrations: DetectedIntegration[]
    integration_score: number
    integration_gaps?: string[]
  }
  linguistic_markers: {
    hedging: {
      count: number
      instances: string[]
      index: number
    }
    certainty: {
      count: number
      instances: string[]
      index: number
    }
    fragmentation: {
      logical_jumps: number
      incomplete_sentences: number
      context_mismatches: number
      examples?: string[]
    }
  }
  coherence: {
    score: number
    flow_assessment?: string
    breaks?: string[]
    lexical_diversity?: number
  }
  semantic_entropy: {
    value: number
    interpretation?: string
    contributing_factors?: string[]
  }
  overall_semantic_similarity: number
  preliminary_gap_indicators?: {
    LE_signals: string[]
    LEm_signals: string[]
    LIE_signals: string[]
  }
}

// Behavioral analysis types
export interface HesitationPattern {
  total_pause_time_ms: number
  pause_ratio: number
  long_pauses_count: number
  hesitation_index: number
  pause_positions?: string[]
}

export interface RevisionPattern {
  revision_count: number
  revision_ratio: number
  major_revisions?: number
  revision_positions?: string[]
  self_correction_index: number
}

export interface AnxietyIndicators {
  erratic_typing: boolean
  focus_loss_events: number
  rapid_deletion_bursts?: number
  time_pressure_indicator?: boolean
  behavioral_anxiety_score: number
}

export interface BehavioralAnalysisResult {
  response_time_ms: number
  time_per_word_ms: number
  time_to_first_keystroke_ms: number
  hesitation_pattern: HesitationPattern
  revision_pattern: RevisionPattern
  anxiety_indicators: AnxietyIndicators
  deviation_from_baseline?: {
    time_deviation_zscore: number
    hesitation_deviation_zscore: number
    revision_deviation_zscore: number
  }
}

// Classification types
export interface ClassificationResult {
  primary_type: LacunaType
  primary_probability: number
  primary_confidence: ConfidenceLevel
  secondary_type?: LacunaType
  secondary_probability?: number
  probabilities: Record<string, number>
  supporting_evidence: {
    for_primary: string[]
    against_alternatives?: string[]
  }
  reasoning_chain?: string
  fusion_details?: {
    semantic_contribution: Record<string, number>
    behavioral_contribution: Record<string, number>
    weights_used: {
      semantic: number
      behavioral: number
    }
  }
}

// Feedback types
export interface ActionItem {
  priority: 'high' | 'medium' | 'low'
  action: string
  rationale: string
  estimated_time: string
}

export interface AreaForGrowth {
  area: string
  explanation: string
  suggestion: string
}

export interface Resource {
  type: 'concept_review' | 'practice' | 'technique'
  topic: string
  description: string
}

export interface FeedbackContent {
  type: LacunaType
  title: string
  greeting: string
  main_message: string
  strengths: string[]
  areas_for_growth: AreaForGrowth[]
  action_items: ActionItem[]
  resources: Resource[]
  encouragement: string
  next_steps: string
}

export interface FeedbackMetadata {
  tone: 'encouraging' | 'supportive' | 'constructive'
  complexity_level: 'basic' | 'intermediate' | 'advanced'
  estimated_reading_time_seconds: number
}

export interface DDLFeedback {
  feedback: FeedbackContent
  metadata: FeedbackMetadata
}

// User baseline types
export interface UserBaseline {
  id: string
  user_id: string
  total_responses: number
  avg_response_time_ms: number
  std_response_time_ms: number
  avg_time_per_word_ms: number
  std_time_per_word_ms: number
  avg_hesitation_index: number
  std_hesitation_index: number
  avg_pause_ratio: number
  std_pause_ratio: number
  avg_revision_ratio: number
  std_revision_ratio: number
  avg_semantic_similarity: number
  avg_concept_coverage: number
  avg_hedging_index: number
  calculated_from_responses: number
  last_calculated_at: string
  baseline_by_difficulty?: Record<string, {
    avg_time_ms: number
    std_time_ms: number
  }>
}

// API response types
export interface DDLAnalysisResponse {
  success: boolean
  data: {
    classification: {
      type: LacunaType
      confidence: ConfidenceLevel
      probability: number
    }
    feedbackId: string
    summary: {
      conceptCoverage: number
      integrationScore: number
      anxietyScore: number
    }
  }
}

export interface DDLFullAnalysisResult {
  semantic: SemanticAnalysisResult
  behavioral: BehavioralAnalysisResult
  classification: ClassificationResult
  feedbackId: string
}
