// ============================================================
// CLINICAL VALIDATION API ROUTE
// POST /api/admin/clinical-validate - Validate a question's clinical accuracy
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { validateClinicalQuestion, batchValidateQuestions, type QuestionToValidate } from '@/lib/ai/clinicalValidator'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Request body for clinical validation.
 */
interface ClinicalValidationRequest {
  questionId?: string
  question?: QuestionToValidate
  updateDb?: boolean
}

/**
 * POST /api/admin/clinical-validate
 *
 * Validate a medical question's clinical accuracy using LLM.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    const cronSecret = request.headers.get('x-cron-secret')
    const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET
    
    if (!user && !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ClinicalValidationRequest = await request.json()
    const { questionId, question, updateDb = false } = body

    if (!questionId && !question) {
      return NextResponse.json(
        { error: 'Either questionId or question must be provided' },
        { status: 400 }
      )
    }

    let questionToValidate: QuestionToValidate

    if (questionId && !question) {
      const { data: dbQuestion, error: dbError } = await (supabase as any)
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (dbError || !dbQuestion) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }

      questionToValidate = {
        id: dbQuestion.id,
        stem: dbQuestion.stem,
        options: dbQuestion.options.map((opt: string, idx: number) => ({
          text: opt,
          isCorrect: idx === dbQuestion.correct_index,
        })),
        correctIndex: dbQuestion.correct_index,
        explanation: dbQuestion.explanation || '',
        area: dbQuestion.area,
        topic: dbQuestion.topic || undefined,
        references: dbQuestion.reference_list || undefined,
      }
    } else {
      questionToValidate = question!
    }

    const validationResult = await validateClinicalQuestion(questionToValidate)

    if (updateDb && questionToValidate.id) {
      await (supabase as any)
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
        .eq('id', questionToValidate.id)
    }

    return NextResponse.json({
      success: true,
      questionId: questionToValidate.id,
      validation: validationResult,
    })
  } catch (error) {
    console.error('Clinical validation error:', error)
    return NextResponse.json(
      { error: 'Clinical validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/clinical-validate
 *
 * Batch validate multiple questions.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionIds, updateDb = true } = body as {
      questionIds: string[]
      updateDb?: boolean
    }

    if (!questionIds?.length) {
      return NextResponse.json({ error: 'questionIds array is required' }, { status: 400 })
    }

    const { data: dbQuestions, error: dbError } = await (supabase as any)
      .from('questions')
      .select('*')
      .in('id', questionIds)

    if (dbError) {
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    }

    const questionsToValidate: QuestionToValidate[] = (dbQuestions || []).map((q: any) => ({
      id: q.id,
      stem: q.stem,
      options: q.options.map((opt: string, idx: number) => ({
        text: opt,
        isCorrect: idx === q.correct_index,
      })),
      correctIndex: q.correct_index,
      explanation: q.explanation || '',
      area: q.area,
      topic: q.topic || undefined,
      references: q.reference_list || undefined,
    }))

    const results = await batchValidateQuestions(questionsToValidate, { concurrency: 3 })

    if (updateDb) {
      for (const [questionId, result] of results) {
        await (supabase as any)
          .from('questions')
          .update({
            validation_status: result.status,
            validation_feedback: JSON.stringify({
              critique: result.critique,
              issues: result.issues,
              confidence: result.confidence,
              modelUsed: result.modelUsed,
              checkedAt: result.checkedAt,
            }),
            validated_by: 'llm_reviewer',
            validated_at: new Date().toISOString(),
          })
          .eq('id', questionId)
      }
    }

    const summary = {
      total: results.size,
      approved: Array.from(results.values()).filter((r) => r.isApproved).length,
      rejected: Array.from(results.values()).filter((r) => !r.isApproved && r.status === 'rejected').length,
      pending: Array.from(results.values()).filter((r) => r.status === 'pending').length,
    }

    return NextResponse.json({ success: true, summary, results: Object.fromEntries(results) })
  } catch (error) {
    console.error('Batch clinical validation error:', error)
    return NextResponse.json(
      { error: 'Batch validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
