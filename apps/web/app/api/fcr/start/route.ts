// ============================================================
// FCR START API ROUTE
// POST /api/fcr/start - Initialize an FCR case attempt
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { FCRCase, IRTParameters } from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors'

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformCase(row: any): Omit<FCRCase, 'correctDados' | 'correctPadrao' | 'correctHipotese' | 'correctConduta'> & { correctDados?: never; correctPadrao?: never; correctHipotese?: never; correctConduta?: never } {
  return {
    id: row.id,
    titlePt: row.title_pt,
    clinicalPresentationPt: row.clinical_presentation_pt,
    area: row.area,
    difficulty: row.difficulty,
    dadosOptions: (row.dados_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false, // Strip correct flag for security
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    padraoOptions: (row.padrao_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false,
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    hipoteseOptions: (row.hipotese_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false,
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    condutaOptions: (row.conduta_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false,
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    structuredExplanation: undefined, // Don't reveal explanations before submission
    irt: {
      difficulty: row.irt_difficulty ?? 0,
      discrimination: row.irt_discrimination ?? 1.2,
      guessing: row.irt_guessing ?? 0.25,
    } as IRTParameters,
    isPublic: row.is_public,
    isAIGenerated: row.is_ai_generated,
    timesAttempted: row.times_attempted,
    timesCompleted: row.times_completed,
    avgScore: row.avg_score,
  }
}

interface ExistingAttemptRow {
  id: string
  selected_dados: string[] | null
  selected_padrao: string | null
  selected_hipotese: string | null
  selected_conduta: string | null
  confidence_dados: number | null
  confidence_padrao: number | null
  confidence_hipotese: number | null
  confidence_conduta: number | null
  step_times: Record<string, number> | null
  total_time_seconds: number | null
  started_at: string
}

function normalizeStepTimes(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const safeStepTimes: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      safeStepTimes[key] = Math.max(0, Math.round(value))
    }
  }
  return safeStepTimes
}

function inferCurrentLevel(attempt: ExistingAttemptRow): 'dados' | 'padrao' | 'hipotese' | 'conduta' {
  const hasDados =
    (attempt.selected_dados?.length || 0) > 0 &&
    attempt.confidence_dados !== null
  if (!hasDados) return 'dados'

  const hasPadrao =
    Boolean(attempt.selected_padrao) &&
    attempt.confidence_padrao !== null
  if (!hasPadrao) return 'padrao'

  const hasHipotese =
    Boolean(attempt.selected_hipotese) &&
    attempt.confidence_hipotese !== null
  if (!hasHipotese) return 'hipotese'

  return 'conduta'
}

/**
 * POST /api/fcr/start
 *
 * Start a new FCR case attempt.
 *
 * Request body:
 *   - caseId: string (UUID of the FCR case)
 *
 * Returns: { attemptId, fcrCase } (case without correct answers)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { caseId } = body as { caseId: string }

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    // Load case (without correct answers for response, but we need them for the record)
    const { data: caseRow, error: caseError } = await (supabase as any)
      .from('fcr_cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (caseError) {
      if (isMissingTableError(caseError) || isSchemaDriftError(caseError)) {
        console.warn('FCR start skipped due to schema drift:', caseError)
        return NextResponse.json(
          { error: 'Dados indisponíveis neste ambiente (schema em migração).' },
          { status: 503 }
        )
      }

      // Supabase returns an error for .single() when no rows match as well; treat it as 404.
      if (!caseRow) {
        return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
      }

      console.error('Error loading FCR case:', caseError)
      return NextResponse.json({ error: 'Falha ao carregar o caso' }, { status: 500 })
    }

    if (!caseRow) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
    }

    // Reuse in-progress attempt when available
    const { data: existingAttemptsRaw, error: existingAttemptsError } = await (supabase as any)
      .from('fcr_attempts')
      .select(`
        id,
        selected_dados,
        selected_padrao,
        selected_hipotese,
        selected_conduta,
        confidence_dados,
        confidence_padrao,
        confidence_hipotese,
        confidence_conduta,
        step_times,
        total_time_seconds,
        started_at
      `)
      .eq('case_id', caseId)
      .eq('user_id', user.id)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)

    if (existingAttemptsError) {
      if (isMissingTableError(existingAttemptsError) || isSchemaDriftError(existingAttemptsError)) {
        console.warn('FCR start skipped due to schema drift:', existingAttemptsError)
        return NextResponse.json(
          { error: 'Dados indisponíveis neste ambiente (schema em migração).' },
          { status: 503 }
        )
      }

      console.error('Error checking existing FCR attempts:', existingAttemptsError)
      return NextResponse.json(
        { error: 'Falha ao iniciar o caso (tentativas indisponíveis).' },
        { status: 500 }
      )
    }

    const existingAttempt = (existingAttemptsRaw?.[0] || null) as ExistingAttemptRow | null

    let attemptId: string
    if (existingAttempt) {
      attemptId = existingAttempt.id
    } else {
      const { data: attempt, error: attemptError } = await (supabase as any)
        .from('fcr_attempts')
        .insert({
          case_id: caseId,
          user_id: user.id,
        })
        .select('id')
        .single()

      if (attemptError || !attempt) {
        console.error('Error creating FCR attempt:', attemptError)
        return NextResponse.json(
          { error: 'Não foi possível iniciar sua tentativa agora.' },
          { status: 500 }
        )
      }

      attemptId = attempt.id

      // Increment times_attempted only for new attempts
      const { error: incrementError } = await (supabase as any)
        .from('fcr_cases')
        .update({ times_attempted: (caseRow.times_attempted || 0) + 1 })
        .eq('id', caseId)

      if (incrementError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to increment fcr_cases.times_attempted:', incrementError)
        }
      }
    }

    // Transform and strip correct answers
    const safeCase = transformCase(caseRow)

    return NextResponse.json({
      attemptId,
      resumed: Boolean(existingAttempt),
      attemptState: existingAttempt
        ? {
            currentLevel: inferCurrentLevel(existingAttempt),
            selectedDados: existingAttempt.selected_dados || [],
            selectedPadrao: existingAttempt.selected_padrao || null,
            selectedHipotese: existingAttempt.selected_hipotese || null,
            selectedConduta: existingAttempt.selected_conduta || null,
            confidenceDados: existingAttempt.confidence_dados || null,
            confidencePadrao: existingAttempt.confidence_padrao || null,
            confidenceHipotese: existingAttempt.confidence_hipotese || null,
            confidenceConduta: existingAttempt.confidence_conduta || null,
            stepTimes: normalizeStepTimes(existingAttempt.step_times),
            totalTimeSeconds: existingAttempt.total_time_seconds || 0,
            startedAt: existingAttempt.started_at,
          }
        : null,
      fcrCase: safeCase,
    })
  } catch (error) {
    console.error('FCR Start Error:', error)
    return NextResponse.json(
      {
        error: 'Falha ao iniciar o caso',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
