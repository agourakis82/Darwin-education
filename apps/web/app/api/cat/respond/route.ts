// ============================================================
// CAT RESPOND API ROUTE
// POST /api/cat/respond - Process a response and get next item
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
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

function transformQuestion(q: any): ENAMEDQuestion {
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
      subspecialty: q.subspecialty || '',
      topic: q.topic || '',
      icd10: q.icd10_codes,
      atcCodes: q.atc_codes,
    },
    references: q.reference_list,
    isAIGenerated: q.is_ai_generated,
    validatedBy: q.validated_by,
  }
}

/**
 * POST /api/cat/respond
 *
 * Process a student's response and select the next item (or complete the test).
 *
 * Request body:
 *   - attemptId: string
 *   - questionId: string
 *   - selectedAnswerIndex: number
 *   - session: CATSession
 *   - config?: CATConfig (optional, defaults to DEFAULT_CAT_CONFIG)
 *
 * Returns: { isComplete, session, question?, correct, stoppingReason? }
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
      questionId,
      selectedAnswerIndex,
      session,
      config: bodyConfig,
    } = body as {
      attemptId: string
      questionId: string
      selectedAnswerIndex: number
      session: CATSession
      config?: CATConfig
    }

    if (!attemptId || !questionId || selectedAnswerIndex === undefined || !session) {
      return NextResponse.json(
        { error: 'Missing required fields: attemptId, questionId, selectedAnswerIndex, session' },
        { status: 400 }
      )
    }

    const config = bodyConfig || DEFAULT_CAT_CONFIG

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
        session: updatedSession,
        correct,
        stoppingReason: updatedSession.stoppingReason,
      })
    }

    // Session not complete: select the next item
    // Load remaining eligible questions for the item bank
    let bankQuery = (supabase as any)
      .from('questions')
      .select('*')
      .not('irt_difficulty', 'is', null)

    // Filter by configured areas if content balancing is on
    const configuredAreas = Object.keys(config.areaTargets) as ENAMEDArea[]
    if (configuredAreas.length > 0) {
      bankQuery = bankQuery.in('area', configuredAreas)
    }

    const { data: bankQuestions, error: bankError } = await bankQuery

    if (bankError) {
      console.error('Error loading item bank:', bankError)
      return NextResponse.json(
        { error: 'Failed to load item bank' },
        { status: 500 }
      )
    }

    // Transform to ENAMEDQuestion format
    const itemBank: ENAMEDQuestion[] = (bankQuestions || []).map(transformQuestion)

    // Select next item
    const nextQuestion = selectNextItem(updatedSession, itemBank, new Map(), config)

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

    // Strip correctIndex and explanation for security
    const { correctIndex, explanation, ...safeQuestion } = nextQuestion

    return NextResponse.json({
      isComplete: false,
      session: updatedSession,
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
