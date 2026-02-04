// ============================================================
// DDL SERVICE - MAIN ORCHESTRATOR
// Diagnostico Diferencial de Lacunas de Aprendizagem
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { grokChat, extractJSON } from './grok-client'

// DDL tables are not in generated types yet - will be added after migration
// Using 'any' for Supabase operations until types are regenerated
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DDL_SEMANTIC_ANALYSIS_SYSTEM_PROMPT,
  DDL_SEMANTIC_ANALYSIS_USER_PROMPT_TEMPLATE,
  DDL_CLASSIFICATION_SYSTEM_PROMPT,
  DDL_CLASSIFICATION_USER_PROMPT_TEMPLATE,
  DDL_FEEDBACK_SYSTEM_PROMPT,
  DDL_FEEDBACK_USER_PROMPT_TEMPLATE,
} from '../prompts'
import type {
  DDLQuestion,
  DDLResponse,
  BehavioralData,
  SemanticAnalysisResult,
  BehavioralAnalysisResult,
  ClassificationResult,
  DDLFeedback,
  DDLFullAnalysisResult,
  UserBaseline,
  LacunaType,
} from '../types'

// ============================================================
// DDL SERVICE CLASS
// ============================================================

export class DDLService {
  private _supabase: SupabaseClient<any, any, any> | null = null
  private modelId: string = 'grok-4-1-fast-reasoning'

  // Lazy initialization to avoid build-time errors
  private get supabase(): SupabaseClient<any, any, any> {
    if (!this._supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!url || !key) {
        throw new Error('Supabase configuration missing')
      }
      this._supabase = createClient(url, key)
    }
    return this._supabase
  }

  // ============================================================
  // MAIN ANALYSIS PIPELINE
  // ============================================================

  async analyzeResponse(responseId: string): Promise<DDLFullAnalysisResult> {
    // 1. Fetch response and question data
    const { response, question } = await this.fetchResponseData(responseId)

    // 2. Fetch user baseline (if exists)
    const baseline = await this.fetchUserBaseline(response.user_id)

    // 3. Run semantic analysis (Grok API)
    const semanticResult = await this.runSemanticAnalysis(response, question)

    // 4. Run behavioral analysis (local computation)
    const behavioralResult = this.runBehavioralAnalysis(
      response.behavioral_data,
      response.response_text,
      baseline
    )

    // 5. Run classification (Grok API - Fusion Layer)
    const classificationResult = await this.runClassification(
      semanticResult,
      behavioralResult,
      question,
      baseline
    )

    // 6. Store all analysis results
    const { semanticId, behavioralId, classificationId } = await this.storeAnalysisResults(
      responseId,
      semanticResult,
      behavioralResult,
      classificationResult
    )

    // 7. Generate and store feedback
    const feedbackId = await this.generateAndStoreFeedback(
      classificationId,
      response,
      question,
      semanticResult,
      classificationResult
    )

    // 8. Update user baseline (async, non-blocking)
    this.updateUserBaseline(response.user_id, behavioralResult, semanticResult)
      .catch(err => console.error('Baseline update failed:', err))

    return {
      semantic: semanticResult,
      behavioral: behavioralResult,
      classification: classificationResult,
      feedbackId,
    }
  }

  // ============================================================
  // SEMANTIC ANALYSIS
  // ============================================================

  private async runSemanticAnalysis(
    response: DDLResponse,
    question: DDLQuestion
  ): Promise<SemanticAnalysisResult> {
    const userPrompt = this.interpolateTemplate(
      DDL_SEMANTIC_ANALYSIS_USER_PROMPT_TEMPLATE,
      {
        question_code: question.question_code,
        question_text: question.question_text,
        discipline: question.discipline,
        topic: question.topic,
        cognitive_level: question.cognitive_level,
        reference_answer: question.reference_answer,
        key_concepts_json: JSON.stringify(question.key_concepts, null, 2),
        required_integrations_json: JSON.stringify(question.required_integrations, null, 2),
        student_response: response.response_text,
      }
    )

    const responseText = await grokChat([
      { role: 'system', content: DDL_SEMANTIC_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      model: this.modelId,
      maxTokens: 4096,
    })

    try {
      const jsonStr = extractJSON(responseText)
      return JSON.parse(jsonStr) as SemanticAnalysisResult
    } catch (error) {
      console.error('Failed to parse semantic analysis:', responseText)
      throw new Error('Failed to parse semantic analysis response')
    }
  }

  // ============================================================
  // BEHAVIORAL ANALYSIS (Local Computation)
  // ============================================================

  private runBehavioralAnalysis(
    behavioralData: BehavioralData,
    responseText: string,
    baseline?: UserBaseline | null
  ): BehavioralAnalysisResult {
    const wordCount = responseText.trim().split(/\s+/).length
    const totalTime = behavioralData.total_time_ms

    // Calculate pause metrics
    const longPauseThreshold = 3000 // 3 seconds
    const longPauses = behavioralData.pause_durations_ms.filter(
      d => d > longPauseThreshold
    )
    const totalPauseTime = behavioralData.pause_durations_ms.reduce(
      (a, b) => a + b, 0
    )
    const pauseRatio = totalTime > 0 ? totalPauseTime / totalTime : 0

    // Calculate revision metrics
    const totalKeystrokes = behavioralData.keystroke_dynamics.total_keystrokes
    const revisionKeystrokes =
      behavioralData.keystroke_dynamics.backspace_count +
      behavioralData.keystroke_dynamics.delete_count
    const revisionRatio = totalKeystrokes > 0
      ? revisionKeystrokes / totalKeystrokes
      : 0

    // Calculate hesitation index
    const hesitationIndex = this.calculateHesitationIndex(
      behavioralData,
      totalTime
    )

    // Detect erratic typing (high variance in inter-key intervals)
    const avgIKI = behavioralData.keystroke_dynamics.avg_inter_key_interval_ms
    const erraticTyping = avgIKI > 400 // Threshold for irregular typing

    // Focus loss events
    const focusLossEvents = behavioralData.focus_events.filter(
      e => e.type === 'blur'
    ).length

    // Calculate behavioral anxiety score (0-1)
    const anxietyScore = this.calculateAnxietyScore({
      pauseRatio,
      longPausesCount: longPauses.length,
      revisionRatio,
      erraticTyping,
      focusLossEvents,
      hesitationIndex,
    })

    // Calculate deviation from baseline if available
    let deviationFromBaseline = undefined
    if (baseline && baseline.total_responses >= 5) {
      deviationFromBaseline = {
        time_deviation_zscore: baseline.std_response_time_ms > 0
          ? (totalTime - baseline.avg_response_time_ms) / baseline.std_response_time_ms
          : 0,
        hesitation_deviation_zscore: baseline.std_hesitation_index > 0
          ? (hesitationIndex - baseline.avg_hesitation_index) / baseline.std_hesitation_index
          : 0,
        revision_deviation_zscore: baseline.std_revision_ratio > 0
          ? (revisionRatio - baseline.avg_revision_ratio) / baseline.std_revision_ratio
          : 0,
      }
    }

    return {
      response_time_ms: totalTime,
      time_per_word_ms: wordCount > 0 ? totalTime / wordCount : 0,
      time_to_first_keystroke_ms: behavioralData.time_to_first_keystroke_ms,
      hesitation_pattern: {
        total_pause_time_ms: totalPauseTime,
        pause_ratio: pauseRatio,
        long_pauses_count: longPauses.length,
        hesitation_index: hesitationIndex,
      },
      revision_pattern: {
        revision_count: behavioralData.revision_events.length,
        revision_ratio: revisionRatio,
        self_correction_index: this.calculateSelfCorrectionIndex(
          behavioralData.revision_events
        ),
      },
      anxiety_indicators: {
        erratic_typing: erraticTyping,
        focus_loss_events: focusLossEvents,
        behavioral_anxiety_score: anxietyScore,
      },
      deviation_from_baseline: deviationFromBaseline,
    }
  }

  private calculateHesitationIndex(
    data: BehavioralData,
    totalTime: number
  ): number {
    if (totalTime === 0) return 0

    const pauseWeight = 0.4
    const firstKeystrokeWeight = 0.3
    const longPauseWeight = 0.3

    const pauseRatio = data.pause_durations_ms.reduce((a, b) => a + b, 0) / totalTime
    const firstKeystrokeRatio = Math.min(
      data.time_to_first_keystroke_ms / 10000,
      1
    ) // Normalize to 10s max
    const longPauseRatio = data.pause_durations_ms.filter(d => d > 3000).length /
      Math.max(data.pause_count, 1)

    return (
      pauseWeight * pauseRatio +
      firstKeystrokeWeight * firstKeystrokeRatio +
      longPauseWeight * longPauseRatio
    )
  }

  private calculateAnxietyScore(metrics: {
    pauseRatio: number
    longPausesCount: number
    revisionRatio: number
    erraticTyping: boolean
    focusLossEvents: number
    hesitationIndex: number
  }): number {
    let score = 0

    // Pause ratio contribution (0-0.25)
    score += Math.min(metrics.pauseRatio, 0.5) * 0.5

    // Long pauses contribution (0-0.2)
    score += Math.min(metrics.longPausesCount / 5, 1) * 0.2

    // Revision ratio contribution (0-0.15)
    score += Math.min(metrics.revisionRatio, 0.3) * 0.5

    // Erratic typing (0 or 0.15)
    if (metrics.erraticTyping) score += 0.15

    // Focus loss (0-0.15)
    score += Math.min(metrics.focusLossEvents / 3, 1) * 0.15

    // Hesitation index (0-0.1)
    score += metrics.hesitationIndex * 0.1

    return Math.min(score, 1) // Cap at 1
  }

  private calculateSelfCorrectionIndex(events: BehavioralData['revision_events']): number {
    if (events.length === 0) return 0

    const majorRevisions = events.filter(
      e => e.type === 'retype_section' ||
        (e.end && e.start && (e.end - e.start) > 10)
    ).length

    return majorRevisions / events.length
  }

  // ============================================================
  // CLASSIFICATION (Fusion Layer)
  // ============================================================

  private async runClassification(
    semantic: SemanticAnalysisResult,
    behavioral: BehavioralAnalysisResult,
    question: DDLQuestion,
    baseline?: UserBaseline | null
  ): Promise<ClassificationResult> {
    const userPrompt = this.interpolateTemplate(
      DDL_CLASSIFICATION_USER_PROMPT_TEMPLATE,
      {
        semantic_analysis_json: JSON.stringify(semantic, null, 2),
        behavioral_analysis_json: JSON.stringify(behavioral, null, 2),
        user_baseline_json: baseline
          ? JSON.stringify(baseline, null, 2)
          : 'Not available',
        difficulty_level: question.difficulty_level.toString(),
        cognitive_level: question.cognitive_level,
        topic: question.topic,
      }
    )

    const responseText = await grokChat([
      { role: 'system', content: DDL_CLASSIFICATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      model: this.modelId,
      maxTokens: 2048,
    })

    try {
      const jsonStr = extractJSON(responseText)
      const parsed = JSON.parse(jsonStr)

      return {
        primary_type: parsed.classification.primary_type,
        primary_probability: parsed.classification.primary_probability,
        primary_confidence: parsed.classification.primary_confidence,
        secondary_type: parsed.classification.secondary_type,
        secondary_probability: parsed.classification.secondary_probability,
        probabilities: parsed.probabilities,
        supporting_evidence: parsed.supporting_evidence,
        reasoning_chain: parsed.reasoning_chain,
        fusion_details: parsed.fusion_details,
      }
    } catch (error) {
      console.error('Failed to parse classification:', responseText)
      throw new Error('Failed to parse classification response')
    }
  }

  // ============================================================
  // FEEDBACK GENERATION
  // ============================================================

  private async generateAndStoreFeedback(
    classificationId: string,
    response: DDLResponse,
    question: DDLQuestion,
    semantic: SemanticAnalysisResult,
    classification: ClassificationResult
  ): Promise<string> {
    const userPrompt = this.interpolateTemplate(
      DDL_FEEDBACK_USER_PROMPT_TEMPLATE,
      {
        classification_json: JSON.stringify(classification, null, 2),
        student_response: response.response_text,
        question_text: question.question_text,
        topic: question.topic,
        discipline: question.discipline,
        matched_concepts: semantic.concept_analysis.matched_concepts.join(', '),
        missing_concepts: semantic.concept_analysis.missing_concepts.join(', '),
        integration_score: semantic.integration_analysis.integration_score.toString(),
        key_issues: this.summarizeKeyIssues(semantic, classification),
        interaction_count: 'N/A',
        common_pattern: 'N/A',
        learning_style: 'N/A',
      }
    )

    const responseText = await grokChat([
      { role: 'system', content: DDL_FEEDBACK_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      model: this.modelId,
      maxTokens: 2048,
    })

    const jsonStr = extractJSON(responseText)
    const feedbackData = JSON.parse(jsonStr) as DDLFeedback

    // Store feedback
    const { data, error } = await this.supabase
      .from('ddl_feedback')
      .insert({
        classification_id: classificationId,
        user_id: response.user_id,
        feedback_type: classification.primary_type,
        feedback_content: feedbackData.feedback,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  private summarizeKeyIssues(
    semantic: SemanticAnalysisResult,
    classification: ClassificationResult
  ): string {
    const issues: string[] = []

    if (semantic.concept_analysis.coverage_ratio < 0.5) {
      issues.push(`Low concept coverage (${(semantic.concept_analysis.coverage_ratio * 100).toFixed(0)}%)`)
    }

    if (semantic.integration_analysis.integration_score < 0.5) {
      issues.push(`Weak concept integration (${(semantic.integration_analysis.integration_score * 100).toFixed(0)}%)`)
    }

    if (semantic.linguistic_markers.hedging.index > 0.04) {
      issues.push('High uncertainty markers in response')
    }

    if (semantic.semantic_entropy.value > 2.0) {
      issues.push('High semantic fragmentation')
    }

    return issues.join('; ') || 'No major issues identified'
  }

  // ============================================================
  // DATA PERSISTENCE
  // ============================================================

  private async fetchResponseData(responseId: string): Promise<{
    response: DDLResponse
    question: DDLQuestion
  }> {
    const { data: response, error: respError } = await this.supabase
      .from('ddl_responses')
      .select('*')
      .eq('id', responseId)
      .single()

    if (respError) throw respError

    const { data: question, error: questError } = await this.supabase
      .from('ddl_questions')
      .select('*')
      .eq('id', response.question_id)
      .single()

    if (questError) throw questError

    return { response, question }
  }

  private async fetchUserBaseline(userId: string): Promise<UserBaseline | null> {
    const { data, error } = await this.supabase
      .from('ddl_user_baseline')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error
    }

    return data
  }

  private async storeAnalysisResults(
    responseId: string,
    semantic: SemanticAnalysisResult,
    behavioral: BehavioralAnalysisResult,
    classification: ClassificationResult
  ): Promise<{ semanticId: string; behavioralId: string; classificationId: string }> {
    // Store semantic analysis
    const { data: semData, error: semError } = await this.supabase
      .from('ddl_semantic_analysis')
      .insert({
        response_id: responseId,
        semantic_similarity_score: semantic.overall_semantic_similarity,
        concept_coverage: semantic.concept_analysis,
        integration_score: semantic.integration_analysis.integration_score,
        detected_integrations: semantic.integration_analysis.detected_integrations,
        linguistic_markers: semantic.linguistic_markers,
        semantic_entropy: semantic.semantic_entropy.value,
        llm_model_version: this.modelId,
      })
      .select('id')
      .single()

    if (semError) throw semError

    // Store behavioral analysis
    const { data: behData, error: behError } = await this.supabase
      .from('ddl_behavioral_analysis')
      .insert({
        response_id: responseId,
        response_time_ms: behavioral.response_time_ms,
        time_per_word_ms: behavioral.time_per_word_ms,
        time_to_first_keystroke_ms: behavioral.time_to_first_keystroke_ms,
        hesitation_pattern: behavioral.hesitation_pattern,
        revision_pattern: behavioral.revision_pattern,
        anxiety_indicators: behavioral.anxiety_indicators,
        deviation_from_baseline: behavioral.deviation_from_baseline,
      })
      .select('id')
      .single()

    if (behError) throw behError

    // Store classification
    const { data: classData, error: classError } = await this.supabase
      .from('ddl_classification')
      .insert({
        response_id: responseId,
        semantic_analysis_id: semData.id,
        behavioral_analysis_id: behData.id,
        primary_lacuna_type: classification.primary_type,
        primary_confidence: classification.primary_confidence,
        primary_probability: classification.primary_probability,
        secondary_lacuna_type: classification.secondary_type,
        secondary_probability: classification.secondary_probability,
        probabilities: classification.probabilities,
        supporting_evidence: classification.supporting_evidence,
        classifier_version: '1.0.0',
      })
      .select('id')
      .single()

    if (classError) throw classError

    return {
      semanticId: semData.id,
      behavioralId: behData.id,
      classificationId: classData.id,
    }
  }

  private async updateUserBaseline(
    userId: string,
    behavioral: BehavioralAnalysisResult,
    semantic: SemanticAnalysisResult
  ): Promise<void> {
    // Simplified baseline update - uses exponential moving average
    const { data: existing } = await this.supabase
      .from('ddl_user_baseline')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!existing) {
      // Create initial baseline
      await this.supabase
        .from('ddl_user_baseline')
        .insert({
          user_id: userId,
          total_responses: 1,
          avg_response_time_ms: behavioral.response_time_ms,
          std_response_time_ms: 0,
          avg_hesitation_index: behavioral.hesitation_pattern.hesitation_index,
          std_hesitation_index: 0,
          avg_pause_ratio: behavioral.hesitation_pattern.pause_ratio,
          std_pause_ratio: 0,
          avg_revision_ratio: behavioral.revision_pattern.revision_ratio,
          std_revision_ratio: 0,
          avg_semantic_similarity: semantic.overall_semantic_similarity,
          avg_concept_coverage: semantic.concept_analysis.coverage_ratio,
          avg_hedging_index: semantic.linguistic_markers.hedging.index,
          calculated_from_responses: 1,
          last_calculated_at: new Date().toISOString(),
        })
    } else {
      // Update with exponential moving average (alpha = 0.1)
      const alpha = 0.1

      await this.supabase
        .from('ddl_user_baseline')
        .update({
          total_responses: existing.total_responses + 1,
          avg_response_time_ms: alpha * behavioral.response_time_ms +
            (1 - alpha) * existing.avg_response_time_ms,
          avg_hesitation_index: alpha * behavioral.hesitation_pattern.hesitation_index +
            (1 - alpha) * existing.avg_hesitation_index,
          avg_pause_ratio: alpha * behavioral.hesitation_pattern.pause_ratio +
            (1 - alpha) * existing.avg_pause_ratio,
          avg_revision_ratio: alpha * behavioral.revision_pattern.revision_ratio +
            (1 - alpha) * existing.avg_revision_ratio,
          avg_semantic_similarity: alpha * semantic.overall_semantic_similarity +
            (1 - alpha) * existing.avg_semantic_similarity,
          avg_concept_coverage: alpha * semantic.concept_analysis.coverage_ratio +
            (1 - alpha) * existing.avg_concept_coverage,
          avg_hedging_index: alpha * semantic.linguistic_markers.hedging.index +
            (1 - alpha) * existing.avg_hedging_index,
          calculated_from_responses: existing.calculated_from_responses + 1,
          last_calculated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  private interpolateTemplate(
    template: string,
    values: Record<string, string>
  ): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => values[key] || ''
    )
  }

  // ============================================================
  // PUBLIC HELPER METHODS
  // ============================================================

  async submitResponse(
    userId: string,
    questionId: string,
    sessionId: string,
    responseText: string,
    behavioralData: BehavioralData
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('ddl_responses')
      .insert({
        user_id: userId,
        question_id: questionId,
        session_id: sessionId,
        response_text: responseText,
        behavioral_data: behavioralData,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async getFeedback(feedbackId: string): Promise<{
    feedback_content: DDLFeedback['feedback']
    feedback_type: LacunaType
  } | null> {
    const { data, error } = await this.supabase
      .from('ddl_feedback')
      .select('feedback_content, feedback_type')
      .eq('id', feedbackId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  async getQuestions(limit = 10, discipline?: string): Promise<DDLQuestion[]> {
    let query = this.supabase
      .from('ddl_questions')
      .select('*')
      .eq('is_active', true)
      .limit(limit)

    if (discipline) {
      query = query.eq('discipline', discipline)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }
}

// Export singleton instance
export const ddlService = new DDLService()
