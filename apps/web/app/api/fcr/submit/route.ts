// ============================================================
// FCR SUBMIT API ROUTE
// POST /api/fcr/submit - Submit a completed FCR case attempt
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  calculateFCRScore,
  type FCRCase,
  type FCRAttempt,
  type FCRLevel,
  type ConfidenceRating,
  type IRTParameters,
} from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToFullCase(row: any): FCRCase {
  return {
    id: row.id,
    titlePt: row.title_pt,
    clinicalPresentationPt: row.clinical_presentation_pt,
    area: row.area,
    difficulty: row.difficulty,
    dadosOptions: row.dados_options || [],
    padraoOptions: row.padrao_options || [],
    hipoteseOptions: row.hipotese_options || [],
    condutaOptions: row.conduta_options || [],
    correctDados: row.correct_dados || [],
    correctPadrao: row.correct_padrao,
    correctHipotese: row.correct_hipotese,
    correctConduta: row.correct_conduta,
    structuredExplanation: row.structured_explanation,
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

/**
 * POST /api/fcr/submit
 *
 * Submit a completed FCR case.
 *
 * Request body:
 *   - attemptId: string
 *   - selectedDados: string[]
 *   - selectedPadrao: string
 *   - selectedHipotese: string
 *   - selectedConduta: string
 *   - confidenceDados: 1-5
 *   - confidencePadrao: 1-5
 *   - confidenceHipotese: 1-5
 *   - confidenceConduta: 1-5
 *   - stepTimes: Record<FCRLevel, number>
 *   - totalTimeSeconds: number
 *
 * Returns: FCRScore (with calibration matrix, lacunas, insights)
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
      selectedDados,
      selectedPadrao,
      selectedHipotese,
      selectedConduta,
      confidenceDados,
      confidencePadrao,
      confidenceHipotese,
      confidenceConduta,
      stepTimes,
      totalTimeSeconds,
    } = body as {
      attemptId: string
      selectedDados: string[]
      selectedPadrao: string
      selectedHipotese: string
      selectedConduta: string
      confidenceDados: ConfidenceRating
      confidencePadrao: ConfidenceRating
      confidenceHipotese: ConfidenceRating
      confidenceConduta: ConfidenceRating
      stepTimes: Record<FCRLevel, number>
      totalTimeSeconds: number
    }

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 })
    }

    // Load the attempt to get case_id
    const { data: attemptRow, error: attemptError } = await (supabase as any)
      .from('fcr_attempts')
      .select('id, case_id, user_id')
      .eq('id', attemptId)
      .single()

    if (attemptError || !attemptRow) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attemptRow.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Load the case with correct answers (server-side only)
    const { data: caseRow, error: caseError } = await (supabase as any)
      .from('fcr_cases')
      .select('*')
      .eq('id', attemptRow.case_id)
      .single()

    if (caseError || !caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const fcrCase = rowToFullCase(caseRow)

    // Build attempt object for scoring
    const attempt: FCRAttempt = {
      id: attemptId,
      caseId: attemptRow.case_id,
      userId: user.id,
      selectedDados: selectedDados || [],
      selectedPadrao: selectedPadrao || null,
      selectedHipotese: selectedHipotese || null,
      selectedConduta: selectedConduta || null,
      confidenceDados: confidenceDados || null,
      confidencePadrao: confidencePadrao || null,
      confidenceHipotese: confidenceHipotese || null,
      confidenceConduta: confidenceConduta || null,
      stepTimes: stepTimes || { dados: 0, padrao: 0, hipotese: 0, conduta: 0 },
      totalTimeSeconds: totalTimeSeconds || null,
      startedAt: new Date(),
      completedAt: new Date(),
    }

    // Calculate score (server-side)
    const score = calculateFCRScore(fcrCase, attempt)

    // Update attempt with results
    const { error: updateError } = await (supabase as any)
      .from('fcr_attempts')
      .update({
        selected_dados: selectedDados,
        selected_padrao: selectedPadrao,
        selected_hipotese: selectedHipotese,
        selected_conduta: selectedConduta,
        confidence_dados: confidenceDados,
        confidence_padrao: confidencePadrao,
        confidence_hipotese: confidenceHipotese,
        confidence_conduta: confidenceConduta,
        level_results: score.levelResults,
        theta: score.theta,
        scaled_score: score.scaledScore,
        calibration_score: score.calibrationScore,
        overconfidence_index: score.overconfidenceIndex,
        detected_lacunas: score.detectedLacunas,
        step_times: stepTimes,
        total_time_seconds: totalTimeSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Error updating FCR attempt:', updateError)
    }

    // Update case completion stats
    await (supabase as any)
      .from('fcr_cases')
      .update({
        times_completed: (caseRow.times_completed || 0) + 1,
      })
      .eq('id', caseRow.id)

    // Record calibration history
    const illusionCount = score.levelResults.filter(
      (r) => r.quadrant === 'illusion_of_knowing'
    ).length

    await (supabase as any)
      .from('fcr_calibration_history')
      .insert({
        user_id: user.id,
        area: fcrCase.area,
        calibration_score: score.calibrationScore,
        overconfidence_index: score.overconfidenceIndex,
        illusion_count: illusionCount,
        total_levels: score.levelResults.length,
      })

    return NextResponse.json({ score })
  } catch (error) {
    console.error('FCR Submit Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit FCR case',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
