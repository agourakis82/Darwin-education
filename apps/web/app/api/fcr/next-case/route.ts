// ============================================================
// FCR ADAPTIVE NEXT-CASE API ROUTE
// GET /api/fcr/next-case - Recommend next FCR case using SOTA adaptive selection
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type {
  FCRCase,
  FCRAttemptSummary,
  IRTParameters,
} from '@darwin-education/shared'
import {
  selectNextFCRCase,
  buildCalibrationModel,
  analyzeCascade,
  estimateThetaEAP,
} from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/fcr/next-case
 *
 * Adaptively recommend the best next FCR case for the current user.
 *
 * Uses multi-objective selection:
 *   1. Fisher Information maximization at current theta
 *   2. Calibration-aware targeting (probe miscalibrated bins)
 *   3. Cascade-targeted probing (strengthen weak transitions)
 *   4. Area coverage balancing
 *   5. Dunning-Kruger zone detection
 *
 * Returns: {
 *   recommendation: FCRAdaptiveRecommendation,
 *   diagnostics: FCRCalibrationDiagnostics,
 *   cascade: FCRCascadeAnalysis,
 *   currentTheta: number,
 *   totalAttempts: number,
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load user's completed FCR attempts (with level_results)
    const { data: attemptRows, error: attemptsError } = await (supabase as any)
      .from('fcr_attempts')
      .select(`
        id,
        case_id,
        theta,
        scaled_score,
        calibration_score,
        overconfidence_index,
        level_results,
        completed_at,
        fcr_cases!inner (
          area,
          difficulty,
          irt_difficulty,
          irt_discrimination,
          irt_guessing
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (attemptsError) {
      console.error('Error loading FCR attempts:', attemptsError)
      return NextResponse.json(
        { error: 'Failed to load attempt history' },
        { status: 500 }
      )
    }

    // Transform to FCRAttemptSummary
    const history: FCRAttemptSummary[] = (attemptRows || []).map((row: any) => ({
      caseId: row.case_id,
      area: row.fcr_cases.area,
      difficulty: row.fcr_cases.difficulty,
      theta: row.theta ?? 0,
      calibrationScore: row.calibration_score ?? 50,
      overconfidenceIndex: row.overconfidence_index ?? 0,
      levelResults: (row.level_results || []).map((lr: any) => ({
        level: lr.level,
        correct: lr.correct,
        confidence: lr.confidence,
        quadrant: lr.quadrant,
      })),
      completedAt: new Date(row.completed_at),
    }))

    // Estimate current theta from recent attempts
    let currentTheta = 0
    if (history.length > 0) {
      // Use weighted average of recent thetas (more recent = higher weight)
      const recentN = Math.min(10, history.length)
      let weightedSum = 0
      let weightSum = 0
      for (let i = 0; i < recentN; i++) {
        const weight = recentN - i // Most recent gets highest weight
        weightedSum += history[i].theta * weight
        weightSum += weight
      }
      currentTheta = weightedSum / weightSum
    }

    // Build calibration diagnostics
    const calibration = history.length >= 2
      ? buildCalibrationModel(history)
      : null

    // Build cascade analysis
    const cascade = history.length >= 3
      ? analyzeCascade(history)
      : null

    // Load available cases
    const { data: caseRows, error: casesError } = await (supabase as any)
      .from('fcr_cases')
      .select(`
        id,
        title_pt,
        area,
        difficulty,
        irt_difficulty,
        irt_discrimination,
        irt_guessing,
        is_public,
        is_ai_generated,
        times_attempted,
        times_completed,
        avg_score,
        clinical_presentation_pt,
        dados_options,
        padrao_options,
        hipotese_options,
        conduta_options,
        correct_dados,
        correct_padrao,
        correct_hipotese,
        correct_conduta,
        structured_explanation
      `)
      .eq('is_public', true)

    if (casesError) {
      console.error('Error loading FCR cases:', casesError)
      return NextResponse.json(
        { error: 'Failed to load available cases' },
        { status: 500 }
      )
    }

    // Transform to FCRCase
    const availableCases: FCRCase[] = (caseRows || []).map((row: any) => ({
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
    }))

    // Run adaptive selection
    const recommendation = selectNextFCRCase(
      availableCases,
      history,
      currentTheta,
      calibration,
      cascade
    )

    return NextResponse.json({
      recommendation,
      diagnostics: calibration,
      cascade,
      currentTheta: Math.round(currentTheta * 1000) / 1000,
      totalAttempts: history.length,
    })
  } catch (error) {
    console.error('FCR Next-Case Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute adaptive recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
