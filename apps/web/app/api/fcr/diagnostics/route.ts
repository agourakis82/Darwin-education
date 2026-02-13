// ============================================================
// FCR DIAGNOSTICS API ROUTE
// GET /api/fcr/diagnostics - Full SOTA calibration + cascade analysis
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { FCRAttemptSummary } from '@darwin-education/shared'
import {
  buildCalibrationModel,
  analyzeCascade,
  buildCalibrationTimeline,
} from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/fcr/diagnostics
 *
 * Full calibration diagnostics for the calibration dashboard.
 *
 * Returns:
 *   - calibration: FCRCalibrationDiagnostics (ECE, MCE, DK, drift, bins)
 *   - cascade: FCRCascadeAnalysis (transitions, reasoning profile)
 *   - timeline: calibration trend over time
 *   - byArea: per-area calibration breakdown
 *   - summary: high-level stats
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load all completed FCR attempts with level results
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
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })

    if (attemptsError) {
      console.error('Error loading FCR attempts:', attemptsError)
      return NextResponse.json(
        { error: 'Failed to load attempt history' },
        { status: 500 }
      )
    }

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

    if (history.length < 2) {
      return NextResponse.json({
        calibration: null,
        cascade: null,
        timeline: { timeline: [], byArea: {} },
        summary: {
          totalAttempts: history.length,
          minAttemptsRequired: 3,
          message: 'Complete pelo menos 3 casos FCR para análise de calibração.',
        },
      })
    }

    // Full Bayesian calibration model
    const calibration = buildCalibrationModel(history)

    // Cross-level cascade analysis
    const cascade = history.length >= 3 ? analyzeCascade(history) : null

    // Calibration timeline + area breakdown
    const { timeline, byArea } = buildCalibrationTimeline(history)

    // High-level summary
    const latestTheta = history[history.length - 1]?.theta ?? 0
    const avgCalibration = history.reduce((s, h) => s + h.calibrationScore, 0) / history.length
    const totalIllusions = history.reduce((s, h) => {
      return s + h.levelResults.filter(lr => lr.quadrant === 'illusion_of_knowing').length
    }, 0)

    return NextResponse.json({
      calibration,
      cascade,
      timeline: { timeline, byArea },
      summary: {
        totalAttempts: history.length,
        currentTheta: Math.round(latestTheta * 1000) / 1000,
        avgCalibrationScore: Math.round(avgCalibration * 10) / 10,
        totalIllusionsOfKnowing: totalIllusions,
        dunningKrugerZone: calibration.dunningKrugerZone,
        reasoningProfile: cascade?.reasoningProfile ?? 'robust',
        calibrationTrending: calibration.calibrationTrending,
      },
    })
  } catch (error) {
    console.error('FCR Diagnostics Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
