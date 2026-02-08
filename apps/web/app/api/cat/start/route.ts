// ============================================================
// CAT START API ROUTE
// POST /api/cat/start - Initialize a new CAT session
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  initCATSession,
  selectNextItem,
  DEFAULT_CAT_CONFIG,
  type CATConfig,
  type ENAMEDQuestion,
  type ENAMEDArea,
  type IRTParameters,
} from '@darwin-education/shared'

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
 * POST /api/cat/start
 *
 * Initialize a new Computerized Adaptive Testing session.
 *
 * Request body:
 *   - areas?: ENAMEDArea[] (filter item bank by areas)
 *   - minItems?: number (minimum items before SE stopping)
 *   - maxItems?: number (maximum items to administer)
 *
 * Returns: { examId, attemptId, session, config, question }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { areas, minItems, maxItems } = body as {
      areas?: ENAMEDArea[]
      minItems?: number
      maxItems?: number
    }

    // Build CATConfig merging with defaults
    const config: CATConfig = {
      ...DEFAULT_CAT_CONFIG,
      ...(minItems !== undefined && { minItems }),
      ...(maxItems !== undefined && { maxItems }),
    }

    // Load item bank from questions table
    let query = (supabase as any)
      .from('questions')
      .select('*')
      .not('irt_difficulty', 'is', null)

    if (areas && areas.length > 0) {
      query = query.in('area', areas)
    }

    const { data: rawQuestions, error: questionsError } = await query

    if (questionsError) {
      console.error('Error loading item bank:', questionsError)
      return NextResponse.json(
        { error: 'Failed to load question bank' },
        { status: 500 }
      )
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available for the selected areas' },
        { status: 404 }
      )
    }

    // Transform DB questions to ENAMEDQuestion format
    const itemBank: ENAMEDQuestion[] = rawQuestions.map(transformQuestion)

    // Create exam record (adaptive type)
    const { data: exam, error: examError } = await (supabase as any)
      .from('exams')
      .insert({
        title: 'Simulado Adaptativo',
        description: 'Prova adaptativa gerada por CAT',
        question_count: 0,
        time_limit_minutes: 0,
        question_ids: [],
        type: 'adaptive',
        created_by: user.id,
        is_public: false,
      })
      .select('id')
      .single()

    if (examError) {
      console.error('Error creating exam:', examError)
      return NextResponse.json(
        { error: 'Failed to create exam' },
        { status: 500 }
      )
    }

    // Create exam attempt record
    const { data: attempt, error: attemptError } = await (supabase as any)
      .from('exam_attempts')
      .insert({
        exam_id: exam.id,
        user_id: user.id,
        answers: {},
        is_adaptive: true,
      })
      .select('id')
      .single()

    if (attemptError) {
      console.error('Error creating attempt:', attemptError)
      return NextResponse.json(
        { error: 'Failed to create exam attempt' },
        { status: 500 }
      )
    }

    // Initialize CAT session
    const session = initCATSession()

    // Select the first question
    const firstQuestion = selectNextItem(session, itemBank, new Map(), config)

    if (!firstQuestion) {
      return NextResponse.json(
        { error: 'Failed to select first question' },
        { status: 500 }
      )
    }

    // Strip correctIndex and explanation for security
    const { correctIndex, explanation, ...safeQuestion } = firstQuestion

    return NextResponse.json({
      examId: exam.id,
      attemptId: attempt.id,
      session,
      config,
      question: safeQuestion,
    })
  } catch (error) {
    console.error('CAT Start Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start CAT session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
