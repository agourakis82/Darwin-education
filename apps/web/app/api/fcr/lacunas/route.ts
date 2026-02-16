// ============================================================
// FCR LACUNAS API ROUTE
// GET /api/fcr/lacunas - FCR-detected lacunas for DDL integration
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/fcr/lacunas
 *
 * Returns aggregated lacuna profile from FCR attempts for DDL integration.
 * Each FCR level's calibration quadrant maps to a DDL lacuna type:
 *
 *   illusion_of_knowing → LEm (emotional lacuna — thinks they know but don't)
 *   known_unknown at dados/conduta → LE (epistemic — knowledge gap)
 *   known_unknown at padrao/hipotese → LIE (integration — can't connect concepts)
 *
 * Returns:
 *   - lacunaProfile: { LE: count, LEm: count, LIE: count }
 *   - levelBreakdown: per-level lacuna detection with evidence
 *   - recentAttempts: last N attempts with detected lacunas
 *   - riskAreas: areas with highest lacuna density
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load completed FCR attempts with detected lacunas
    const { data: attempts, error: attemptsError } = await (supabase as any)
      .from('fcr_attempts')
      .select(`
        id,
        case_id,
        level_results,
        detected_lacunas,
        calibration_score,
        overconfidence_index,
        completed_at,
        fcr_cases!inner (
          area,
          title_pt,
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (attemptsError) {
      console.error('Error loading FCR attempts for lacunas:', attemptsError)
      return NextResponse.json(
        { error: 'Failed to load FCR attempts' },
        { status: 500 }
      )
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({
        lacunaProfile: { LE: 0, LEm: 0, LIE: 0 },
        levelBreakdown: [],
        recentAttempts: [],
        riskAreas: [],
        totalAttempts: 0,
        message: 'Nenhuma tentativa FCR concluida.',
      })
    }

    // Aggregate lacuna counts from detected_lacunas
    const lacunaProfile = { LE: 0, LEm: 0, LIE: 0 }
    const areaLacunaCounts: Record<string, { LE: number; LEm: number; LIE: number; total: number }> = {}
    const levelBreakdown: Array<{
      level: string
      lacunaType: string
      evidence: string
      area: string
      caseTitle: string
      date: string
    }> = []

    for (const attempt of attempts) {
      const area = attempt.fcr_cases?.area || 'unknown'
      if (!areaLacunaCounts[area]) {
        areaLacunaCounts[area] = { LE: 0, LEm: 0, LIE: 0, total: 0 }
      }

      // From explicit detected_lacunas
      const lacunas = attempt.detected_lacunas || []
      for (const lacuna of lacunas) {
        const type = lacuna.type as 'LE' | 'LEm' | 'LIE'
        if (lacunaProfile[type] !== undefined) {
          lacunaProfile[type]++
          areaLacunaCounts[area][type]++
          areaLacunaCounts[area].total++

          levelBreakdown.push({
            level: lacuna.level,
            lacunaType: type,
            evidence: lacuna.evidence,
            area,
            caseTitle: attempt.fcr_cases?.title_pt || '',
            date: attempt.completed_at,
          })
        }
      }

      // Also scan level_results for illusion_of_knowing quadrants
      // that may not be in detected_lacunas (additional LEm signal)
      const levelResults = attempt.level_results || []
      for (const lr of levelResults) {
        if (lr.quadrant === 'illusion_of_knowing') {
          // Check if already counted via detected_lacunas
          const alreadyCounted = lacunas.some(
            (l: any) => l.level === lr.level && l.type === 'LEm'
          )
          if (!alreadyCounted) {
            lacunaProfile.LEm++
            areaLacunaCounts[area].LEm++
            areaLacunaCounts[area].total++

            levelBreakdown.push({
              level: lr.level,
              lacunaType: 'LEm',
              evidence: `Ilusão de saber no nível ${lr.level}: confiança ${lr.confidence}/5, mas resposta incorreta`,
              area,
              caseTitle: attempt.fcr_cases?.title_pt || '',
              date: attempt.completed_at,
            })
          }
        }
      }
    }

    // Sort level breakdown by date (most recent first), limit to 20
    levelBreakdown.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const recentBreakdown = levelBreakdown.slice(0, 20)

    // Compute risk areas (sorted by lacuna density)
    const riskAreas = Object.entries(areaLacunaCounts)
      .filter(([, counts]) => counts.total > 0)
      .map(([area, counts]) => ({
        area,
        totalLacunas: counts.total,
        LE: counts.LE,
        LEm: counts.LEm,
        LIE: counts.LIE,
        dominantType: counts.LE >= counts.LEm && counts.LE >= counts.LIE
          ? 'LE'
          : counts.LEm >= counts.LIE
            ? 'LEm'
            : 'LIE',
      }))
      .sort((a, b) => b.totalLacunas - a.totalLacunas)

    // Recent attempts summary
    const recentAttempts = attempts.slice(0, 10).map((a: any) => ({
      caseId: a.case_id,
      caseTitle: a.fcr_cases?.title_pt || '',
      area: a.fcr_cases?.area || '',
      calibrationScore: a.calibration_score,
      overconfidenceIndex: a.overconfidence_index,
      lacunaCount: (a.detected_lacunas || []).length,
      completedAt: a.completed_at,
    }))

    return NextResponse.json({
      lacunaProfile,
      levelBreakdown: recentBreakdown,
      recentAttempts,
      riskAreas,
      totalAttempts: attempts.length,
      totalLacunas: lacunaProfile.LE + lacunaProfile.LEm + lacunaProfile.LIE,
    })
  } catch (error) {
    console.error('FCR Lacunas Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute FCR lacunas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
