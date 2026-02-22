// ============================================================
// CAT START API ROUTE
// POST /api/cat/start - Initialize a new CAT session
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { safeInsert } from '@/lib/supabase/safe-queries'
import {
  initCATSession,
  selectNextItem,
  DEFAULT_CAT_CONFIG,
  type CATConfig,
  type ENAMEDQuestion,
  type ENAMEDArea,
  type IRTParameters,
} from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/**
 * Database question row shape from Supabase.
 * Used for type-safe transformation to ENAMEDQuestion.
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
  difficulty: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'
  area: ENAMEDArea
  subspecialty: string | null
  topic: string | null
  icd10_codes: string[]
  atc_codes: string[]
  reference_list: string[]
  is_ai_generated: boolean
  validated_by: 'community' | 'expert' | 'both' | null
  validation_status?: 'pending' | 'approved' | 'rejected'
  validation_feedback?: string | null
  flagged_for_review?: boolean
}

/**
 * Transforms a database question row to the ENAMEDQuestion type.
 */
function transformQuestion(q: DatabaseQuestion): ENAMEDQuestion {
  const letters = ['A', 'B', 'C', 'D', 'E']
  const options = q.options.map((text, i) => ({
    letter: letters[i] || String.fromCharCode(65 + i),
    text,
  }))

  return {
    id: q.id,
    bankId: q.bank_id,
    year: q.year,
    stem: q.stem,
    options,
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
    validatedBy: q.validated_by ?? undefined,
  }
}

/**
 * Request body shape for POST /api/cat/start
 */
interface CATStartRequest {
  areas?: ENAMEDArea[]
  minItems?: number
  maxItems?: number
  idempotencyKey?: string
}

/**
 * Response shape for POST /api/cat/start
 * Server-side CAT session - only returns opaque sessionId
 */
interface CATStartResponse {
  examId: string
  attemptId: string
  sessionId: string
  config: CATConfig
  question: Omit<ENAMEDQuestion, 'correctIndex' | 'explanation'>
  message?: string
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
 *   - idempotencyKey?: string (prevents duplicate exam creation)
 *
 * Returns: { examId, attemptId, session, config, question }
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
    const body = await request.json() as CATStartRequest
    const { areas, minItems, maxItems, idempotencyKey } = body

    // Check for existing exam with same idempotency key
    if (idempotencyKey) {
      const { data: existingExam } = await supabase
        .from('exams')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .eq('created_by', user.id)
        .single()

      if (existingExam) {
        return NextResponse.json(
          { 
            examId: existingExam.id,
            message: 'Exam already exists',
          },
          { status: 200 }
        )
      }
    }

    // Build CATConfig merging with defaults
    const config: CATConfig = {
      ...DEFAULT_CAT_CONFIG,
      ...(minItems !== undefined && { minItems }),
      ...(maxItems !== undefined && { maxItems }),
    }

    // Load item bank from questions table
    let query = supabase
      .from('questions')
      .select('*')
      .not('irt_difficulty', 'is', null)
      .eq('validation_status', 'approved')
      .neq('flagged_for_review', true)

    if (areas && areas.length > 0) {
      query = query.in('area', areas)
    }

    const { data: rawQuestions, error: questionsError } = await query.returns<DatabaseQuestion[]>()

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
    const { data: exam, error: examError } = await supabase
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
        idempotency_key: idempotencyKey ?? crypto.randomUUID(),
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
    const { data: attempt, error: attemptError } = await supabase
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

    // Persist CAT session to database (server-side storage)
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('cat_sessions')
      .insert({
        attempt_id: attempt.id,
        user_id: user.id,
        theta: session.theta,
        se: session.se,
        items_administered: session.itemsAdministered,
        responses: session.responses,
        item_areas: session.itemAreas,
        theta_history: session.thetaHistory,
        is_complete: session.isComplete,
        stopping_reason: session.stoppingReason,
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('Error creating CAT session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to initialize CAT session' },
        { status: 500 }
      )
    }

    const sessionId = sessionRecord.id

    // Select the first question
    const firstQuestion = selectNextItem(session, itemBank, new Map(), config)

    if (!firstQuestion) {
      return NextResponse.json(
        { error: 'Failed to select first question' },
        { status: 500 }
      )
    }

    // Log first item exposure (non-critical, fire-and-forget with retry)
    void safeInsert(
      supabase,
      'item_exposure_log',
      {
        question_id: firstQuestion.id,
        user_theta: session.theta,
        exam_attempt_id: attempt.id,
      },
      { maxRetries: 2, logError: true }
    )

    // Strip correctIndex and explanation for security
    const { correctIndex, explanation, ...safeQuestion } = firstQuestion

    return NextResponse.json({
      examId: exam.id,
      attemptId: attempt.id,
      sessionId,
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
