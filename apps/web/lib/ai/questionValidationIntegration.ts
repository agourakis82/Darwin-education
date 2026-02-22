// ============================================================
// QUESTION VALIDATION INTEGRATION
// Helper functions to integrate clinical validation into question workflows
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import { validateClinicalQuestion, type QuestionToValidate, type ClinicalValidationResult } from '@/lib/ai/clinicalValidator'
import type { ENAMEDArea } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Result of validating and persisting a question.
 */
export interface ValidatedQuestionResult {
  questionId: string
  validation: ClinicalValidationResult
  persisted: boolean
}

/**
 * Validates a newly generated question and persists it with the appropriate status.
 * 
 * This function should be called after a question is generated but before it's
 * made available in the question bank.
 * 
 * @param questionData - The generated question data
 * @returns The validation result and question ID
 */
export async function validateAndPersistQuestion(
  questionData: {
    stem: string
    options: string[]
    correctIndex: number
    explanation: string
    area: ENAMEDArea
    topic?: string
    subspecialty?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    irtDifficulty?: number
    irtDiscrimination?: number
    irtGuessing?: number
    icd10Codes?: string[]
    atcCodes?: string[]
    references?: string[]
    isAIGenerated?: boolean
    bankId?: string
    year?: number
  }
): Promise<ValidatedQuestionResult> {
  const supabase = await createServerClient()

  // Build question for validation
  const questionToValidate: QuestionToValidate = {
    id: '', // Will be set after insert
    stem: questionData.stem,
    options: questionData.options.map((text, idx) => ({
      text,
      isCorrect: idx === questionData.correctIndex,
    })),
    correctIndex: questionData.correctIndex,
    explanation: questionData.explanation,
    area: questionData.area,
    topic: questionData.topic,
    references: questionData.references,
  }

  // Run clinical validation
  const validationResult = await validateClinicalQuestion(questionToValidate)

  // Determine validation status
  const validationStatus = validationResult.status

  // Insert question with validation status
  const { data: insertedQuestion, error: insertError } = await (supabase as any)
    .from('questions')
    .insert({
      stem: questionData.stem,
      options: questionData.options,
      correct_index: questionData.correctIndex,
      explanation: questionData.explanation,
      area: questionData.area,
      topic: questionData.topic || null,
      subspecialty: questionData.subspecialty || null,
      difficulty: questionData.difficulty || 'medium',
      irt_difficulty: questionData.irtDifficulty ?? 0,
      irt_discrimination: questionData.irtDiscrimination ?? 1,
      irt_guessing: questionData.irtGuessing ?? 0.25,
      icd10_codes: questionData.icd10Codes || [],
      atc_codes: questionData.atcCodes || [],
      reference_list: questionData.references || [],
      is_ai_generated: questionData.isAIGenerated ?? true,
      bank_id: questionData.bankId || 'ai_generated',
      year: questionData.year || new Date().getFullYear(),
      validation_status: validationStatus,
      validation_feedback: JSON.stringify({
        critique: validationResult.critique,
        issues: validationResult.issues,
        confidence: validationResult.confidence,
        modelUsed: validationResult.modelUsed,
        checkedAt: validationResult.checkedAt,
      }),
      validated_by: 'llm_reviewer',
      validated_at: new Date().toISOString(),
      flagged_for_review: false,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Failed to persist question:', insertError)
    throw new Error(`Failed to persist question: ${insertError.message}`)
  }

  return {
    questionId: insertedQuestion.id,
    validation: validationResult,
    persisted: true,
  }
}

/**
 * Re-validates an existing question.
 * Useful for periodic re-validation of questions in the bank.
 */
export async function revalidateQuestion(
  questionId: string
): Promise<ValidatedQuestionResult> {
  const supabase = await createServerClient()

  // Load question
  const { data: question, error: loadError } = await (supabase as any)
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single()

  if (loadError || !question) {
    throw new Error(`Question not found: ${questionId}`)
  }

  // Build for validation
  const questionToValidate: QuestionToValidate = {
    id: question.id,
    stem: question.stem,
    options: question.options.map((text: string, idx: number) => ({
      text,
      isCorrect: idx === question.correct_index,
    })),
    correctIndex: question.correct_index,
    explanation: question.explanation || '',
    area: question.area,
    topic: question.topic || undefined,
    references: question.reference_list || undefined,
  }

  // Validate
  const validationResult = await validateClinicalQuestion(questionToValidate)

  // Update question
  const { error: updateError } = await (supabase as any)
    .from('questions')
    .update({
      validation_status: validationResult.status,
      validation_feedback: JSON.stringify({
        critique: validationResult.critique,
        issues: validationResult.issues,
        confidence: validationResult.confidence,
        modelUsed: validationResult.modelUsed,
        checkedAt: validationResult.checkedAt,
      }),
      validated_by: 'llm_reviewer',
      validated_at: new Date().toISOString(),
    })
    .eq('id', questionId)

  if (updateError) {
    console.error('Failed to update question validation:', updateError)
  }

  return {
    questionId,
    validation: validationResult,
    persisted: true,
  }
}

/**
 * Gets statistics about question validation status.
 */
export async function getValidationStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  flagged: number
}> {
  const supabase = await createServerClient()

  const { data, error } = await (supabase as any)
    .rpc('get_validation_stats')
    .catch(async () => {
      // Fallback if RPC doesn't exist
      const [pending, approved, rejected, flagged] = await Promise.all([
        (supabase as any).from('questions').select('id', { count: 'exact', head: true }).eq('validation_status', 'pending'),
        (supabase as any).from('questions').select('id', { count: 'exact', head: true }).eq('validation_status', 'approved'),
        (supabase as any).from('questions').select('id', { count: 'exact', head: true }).eq('validation_status', 'rejected'),
        (supabase as any).from('questions').select('id', { count: 'exact', head: true }).eq('flagged_for_review', true),
      ])

      return {
        data: {
          pending: pending.count || 0,
          approved: approved.count || 0,
          rejected: rejected.count || 0,
          flagged: flagged.count || 0,
        },
      }
    })

  if (error) {
    console.error('Failed to get validation stats:', error)
    return { total: 0, pending: 0, approved: 0, rejected: 0, flagged: 0 }
  }

  const stats = data || {}
  return {
    total: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0),
    pending: stats.pending || 0,
    approved: stats.approved || 0,
    rejected: stats.rejected || 0,
    flagged: stats.flagged || 0,
  }
}
