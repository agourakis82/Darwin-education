// ============================================================
// CAT RESPOND API ROUTE
// POST /api/cat/respond - Process a response and get next item
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { safeInsert } from '@/lib/supabase/safe-queries'
import {
  selectNextItem,
  updateCATSession,
  DEFAULT_CAT_CONFIG,
  type CATConfig,
  type CATSession,
  type ENAMEDQuestion,
  type ENAMEDArea,
  type IRTParameters,
} from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Database question row shape from Supabase.
 */
interface DatabaseQuestion {
  id: string
  bank_id: string
  year: number
  stem: string
  options: string[]
  correct_index: number
  explanation: string
  irt_difficulty: number
  irt_discrimination: number
  irt_guessing: number
  irt_infit: number | null
  irt_outfit: number | null
  difficulty: 'easy' | 'medium' | 'hard'
  area: ENAMEDArea
  subspecialty: string | null
  topic: string | null
  icd10_codes: string[]
  atc_codes: string[]
  reference_list: string[]
  is_ai_generated: boolean
  validated_by: string | null
  validation_status?: 'pending' | 'approved' | 'rejected'
  validation_feedback?: string | null
  flagged_for_review?: boolean
}

/**
 * Database CAT session row shape.
 */
interface DatabaseCATSession {
  id: string
  attempt_id: string
  user_id: string
  theta: number
  se: number
  items_administered: string[]
  responses: boolean[]
  item_areas: string[]
  theta_history: number[]
  is_complete: boolean
  stopping_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * Transforms a database question row to the ENAMEDQuestion type.
 */
function transformQuestion(q: DatabaseQuestion): ENAMEDQuestion {
  return {
    id: q.id,
    bankId: q.bank_id,
    year: q.year,
    stem: q.stem,
    options: q.options,
    correctIndex: q.correct_index,
    explanation: q.explanation,
    irt: {
      difficulty: q.irt_difficulty,
      discrimination: q.irt_discrimination,
      guessing: q.irt_guessing,
      infit: q.irt_infit,
      outfit: q.irt_outfit,
    } as IRTParameters,
    difficulty: q.difficulty,
    ontology: {
      area: q.area,
      subspecialty: q.subspecialty ?? '',
      topic: q.topic ?? '',
      icd10: q.icd10_codes,
      atcCodes: q.atc_codes,
    },
    references: q.reference_list,
    isAIGenerated: q.is_ai_generated,
    validatedBy: q.validated_by,
  }
}

/**
 * Converts database CAT session to CATSession type.
 */
function dbSessionToCATSession(dbSession: DatabaseCATSession): CATSession {
  return {
    theta: dbSession.theta,
    se: dbSession.se,
    itemsAdministered: dbSession.items_administered,
    responses: dbSession.responses,
    itemAreas: dbSession.item_areas as ENAMEDArea[],
    thetaHistory: dbSession.theta_history,
    isComplete: dbSession.is_complete,
    stoppingReason: dbSession.stopping_reason as CATSession['stoppingReason'],
  }
}

/**
 * POST /api/cat/respond
 *
 * Process a student's response and select the next item (or complete the test).
 *
 * Request body:
 *   - attemptId: string
 *   - sessionId: string (opaque session identifier)
 *   - questionId: string
 *   - selectedAnswerIndex: number
 *   - config?: CATConfig (optional, defaults to DEFAULT_CAT_CONFIG)
 *
 * Returns: { isComplete, question?, correct, stoppingReason? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      attemptId,
      sessionId,
      questionId,
      selectedAnswerIndex,
      config: bodyConfig,
    } = body as {
      attemptId: string
      sessionId: string
      questionId: string
      selectedAnswerIndex: number
      config?: CATConfig
    }

    if (!attemptId || !sessionId || !questionId || selectedAnswerIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: attemptId, sessionId, questionId, selectedAnswerIndex' },
        { status: 400 }
      )
    }

    const config = bodyConfig || DEFAULT_CAT_CONFIG

    // Load CAT session from database (server-side storage)
    const { data: dbSession, error: sessionError } = await supabase
      .from('cat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !dbSession) {
      console.error('Error loading CAT session:', sessionError)
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // Convert database session to CATSession
    const session = dbSessionToCATSession(dbSession as DatabaseCATSession)

    // Load the current question from DB to validate the answer
    const { data: currentQuestion, error: questionError } = await (supabase as any)
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !currentQuestion) {
      console.error('Error loading question:', questionError)
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Check if the answer is correct
    const correct = selectedAnswerIndex === currentQuestion.correct_index

    // Build IRT parameters for the current question
    const itemParams: IRTParameters = {
      difficulty: currentQuestion.irt_difficulty,
      discrimination: currentQuestion.irt_discrimination,
      guessing: currentQuestion.irt_guessing,
      infit: currentQuestion.irt_infit,
      outfit: currentQuestion.irt_outfit,
    }

    // Build allItemParams Map from all administered items (including current)
    const allItemIds = [...session.itemsAdministered, questionId]
    const { data: administeredQuestions, error: adminError } = await (supabase as any)
      .from('questions')
      .select('id, irt_difficulty, irt_discrimination, irt_guessing, irt_infit, irt_outfit')
      .in('id', allItemIds)

    if (adminError) {
      console.error('Error loading administered questions:', adminError)
      return NextResponse.json(
        { error: 'Failed to load question parameters' },
        { status: 500 }
      )
    }

    const allItemParams = new Map<string, IRTParameters>()
    for (const q of administeredQuestions || []) {
      allItemParams.set(q.id, {
        difficulty: q.irt_difficulty,
        discrimination: q.irt_discrimination,
        guessing: q.irt_guessing,
        infit: q.irt_infit,
        outfit: q.irt_outfit,
      })
    }

    // Get the area for the current question
    const area: ENAMEDArea = currentQuestion.area

    // Update CAT session
    const updatedSession = updateCATSession(
      session,
      questionId,
      correct,
      area,
      itemParams,
      allItemParams,
      config
    )

    // Log IRT response for calibration pipeline (fire-and-forget with retry)
    void safeInsert(
      supabase,
      'irt_response_log',
      {
        question_id: questionId,
        user_id: user.id,
        correct,
        user_theta: updatedSession.theta,
        exam_attempt_id: attemptId,
      },
      { maxRetries: 2, logError: true }
    )

    // Update CAT session in database (server-side storage)
    const { error: updateSessionError } = await supabase
      .from('cat_sessions')
      .update({
        theta: updatedSession.theta,
        se: updatedSession.se,
        items_administered: updatedSession.itemsAdministered,
        responses: updatedSession.responses,
        item_areas: updatedSession.itemAreas,
        theta_history: updatedSession.thetaHistory,
        is_complete: updatedSession.isComplete,
        stopping_reason: updatedSession.stoppingReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateSessionError) {
      console.error('Error updating CAT session:', updateSessionError)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    // Update exam_attempts with current progress
    await (supabase as any)
      .from('exam_attempts')
      .update({
        theta_trajectory: updatedSession.thetaHistory,
        items_administered: updatedSession.itemsAdministered,
      })
      .eq('id', attemptId)

    // If session is complete, return final state
    if (updatedSession.isComplete) {
      return NextResponse.json({
        isComplete: true,
        correct,
        stoppingReason: updatedSession.stoppingReason,
      })
    }

    // Session not complete: select the next item
    // Load item bank and real exposure rates in parallel
    let bankQuery = (supabase as any)
      .from('questions')
      .select('*')
      .not('irt_difficulty', 'is', null)
      .eq('validation_status', 'approved')
      .neq('flagged_for_review', true)

    const configuredAreas = Object.keys(config.areaTargets) as ENAMEDArea[]
    if (configuredAreas.length > 0) {
      bankQuery = bankQuery.in('area', configuredAreas)
    }

    const [{ data: bankQuestions, error: bankError }, { data: exposureRows }] = await Promise.all([
      bankQuery,
      (supabase as any).from('v_item_exposure_rates').select('question_id, exposure_rate'),
    ])

    if (bankError) {
      console.error('Error loading item bank:', bankError)
      return NextResponse.json(
        { error: 'Failed to load item bank' },
        { status: 500 }
      )
    }

    // Build exposure map for Sympson-Hetter control
    const exposureRates = new Map<string, number>()
    for (const row of (exposureRows || []) as { question_id: string; exposure_rate: number }[]) {
      exposureRates.set(row.question_id, row.exposure_rate)
    }

    // Transform to ENAMEDQuestion format
    const itemBank: ENAMEDQuestion[] = (bankQuestions || []).map(transformQuestion)

    // Select next item with real exposure rates
    const nextQuestion = selectNextItem(updatedSession, itemBank, exposureRates, config)

    if (!nextQuestion) {
      // No more items available - force completion
      return NextResponse.json({
        isComplete: true,
        session: {
          ...updatedSession,
          isComplete: true,
          stoppingReason: 'max_items' as const,
        },
        correct,
        stoppingReason: 'max_items',
      })
    }

    // Log next item exposure (fire-and-forget with retry)
    void safeInsert(
      supabase,
      'item_exposure_log',
      {
        question_id: nextQuestion.id,
        user_theta: updatedSession.theta,
        exam_attempt_id: attemptId,
      },
      { maxRetries: 2, logError: true }
    )

    // Strip correctIndex and explanation for security
    const { correctIndex, explanation, ...safeQuestion } = nextQuestion

    return NextResponse.json({
      isComplete: false,
      question: safeQuestion,
      correct,
    })
  } catch (error) {
    console.error('CAT Respond Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
