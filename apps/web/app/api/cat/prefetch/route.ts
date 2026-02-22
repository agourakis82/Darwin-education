// ============================================================
// CAT PREFETCH API ROUTE
// POST /api/cat/prefetch - Pre-compute and return the next question
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  selectNextItem,
  DEFAULT_CAT_CONFIG,
  type CATConfig,
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
 * POST /api/cat/prefetch
 *
 * Pre-compute and return the next question for shadow pre-fetching.
 * This endpoint is called while the user is reviewing the current answer
 * to eliminate latency between questions.
 *
 * Request body:
 *   - sessionId: string
 *   - attemptId: string
 *   - config?: CATConfig (optional, defaults to DEFAULT_CAT_CONFIG)
 *
 * Returns: { isComplete, question? }
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
    const { sessionId, attemptId, config: bodyConfig } = body as {
      sessionId: string
      attemptId: string
      config?: CATConfig
    }

    if (!sessionId || !attemptId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, attemptId' },
        { status: 400 }
      )
    }

    const config = bodyConfig || DEFAULT_CAT_CONFIG

    // Load CAT session from database
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

    const session = dbSession as DatabaseCATSession

    // If session is already complete, return completion status
    if (session.is_complete) {
      return NextResponse.json({ isComplete: true })
    }

    // Load item bank to select next question
    const configuredAreas = Object.keys(config.areaTargets) as ENAMEDArea[]
    let bankQuery = (supabase as any)
      .from('questions')
      .select('*')
      .not('irt_difficulty', 'is', null)
      .eq('validation_status', 'approved')
      .neq('flagged_for_review', true)

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

    // Reconstruct CATSession for selection
    const catSession = {
      theta: session.theta,
      se: session.se,
      itemsAdministered: session.items_administered,
      responses: session.responses,
      itemAreas: session.item_areas as ENAMEDArea[],
      thetaHistory: session.theta_history,
      isComplete: session.is_complete,
      stoppingReason: session.stopping_reason as any,
    }

    // Select next item
    const nextQuestion = selectNextItem(catSession, itemBank, exposureRates, config)

    if (!nextQuestion) {
      // No more items available
      return NextResponse.json({ isComplete: true })
    }

    // Strip correctIndex and explanation for security
    const { correctIndex, explanation, ...safeQuestion } = nextQuestion

    return NextResponse.json({
      isComplete: false,
      question: safeQuestion,
    })
  } catch (error) {
    console.error('CAT Prefetch Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to prefetch next question',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
