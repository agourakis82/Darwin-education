// ============================================================
// UNIFIED LEARNER PROFILE API ROUTE
// GET /api/learner/profile — Orchestrates all psychometric models
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  buildUnifiedProfile,
  type UnifiedModelInputs,
  type UnifiedLearnerProfile,
  type MIRTAbilityProfile,
  type MasteryHeatmapData,
  type EngagementMetrics,
  type ENAMEDArea,
} from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

const AREAS: ENAMEDArea[] = [
  'clinica_medica', 'cirurgia', 'ginecologia_obstetricia',
  'pediatria', 'saude_coletiva',
]

/**
 * GET /api/learner/profile
 *
 * Orchestrates IRT + MIRT + FCR + BKT + HLR + engagement signals
 * into a unified learner profile with pass probability and recommendations.
 *
 * Reads from latest learner_model_snapshots if available, otherwise
 * computes from available data sources.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to load latest snapshot first
    const { data: snapshotRow } = await (supabase as any)
      .from('learner_model_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single()

    // Load supplementary data from existing tables
    const [examResult, fcrResult, activityResult, profileResult] = await Promise.all([
      // Latest IRT theta from exam attempts
      (supabase as any)
        .from('exam_attempts')
        .select('theta, score, completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single(),

      // Latest FCR calibration
      (supabase as any)
        .from('fcr_attempts')
        .select('calibration_score, overconfidence_index, completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single(),

      // Activity count for engagement
      (supabase as any)
        .from('study_activity_log')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500),

      // User profile for streak
      (supabase as any)
        .from('profiles')
        .select('study_streak, xp')
        .eq('id', user.id)
        .single(),
    ])

    // Build inputs from available data
    const irtTheta = examResult.data?.theta ?? snapshotRow?.irt_theta ?? 0

    // MIRT profile — reconstruct from snapshot or null
    const snapshotMirt = snapshotRow?.mirt_profile?.theta as Record<string, number> | undefined
    let mirtProfile: MIRTAbilityProfile | null = null
    if (snapshotMirt && Object.keys(snapshotMirt).length > 0) {
      const theta = {} as Record<ENAMEDArea, number>
      const ses = {} as Record<ENAMEDArea, number>
      const cis = {} as Record<ENAMEDArea, [number, number]>
      const dimProfiles: any[] = []
      for (const area of AREAS) {
        const t = (snapshotMirt[area] as number) ?? 0
        theta[area] = t; ses[area] = 0.5; cis[area] = [t - 0.98, t + 0.98]
        dimProfiles.push({ area, label: area, theta: t, se: 0.5, ci: [t - 0.98, t + 0.98], itemCount: 0, rank: 0 })
      }
      dimProfiles.sort((a: any, b: any) => b.theta - a.theta).forEach((d: any, i: number) => { d.rank = i + 1 })
      mirtProfile = {
        theta, standardErrors: ses, confidenceIntervals: cis,
        covarianceMatrix: AREAS.map(() => AREAS.map(() => 0)),
        dimensionProfiles: dimProfiles,
        compositeTheta: AREAS.reduce((s, a) => s + theta[a], 0) / AREAS.length,
        estimation: { iterations: 0, converged: true, gradientNorm: 0, totalItems: 0, method: 'MAP' },
      }
    }

    // BKT mastery — reconstruct MasteryHeatmapData from snapshot or null
    const snapshotBkt = snapshotRow?.bkt_mastery as Record<string, number> | undefined
    let bktMastery: MasteryHeatmapData | null = null
    if (snapshotBkt && Object.keys(snapshotBkt).length > 0) {
      const areaMastery = {} as Record<ENAMEDArea, number>
      let total = 0
      for (const area of AREAS) {
        areaMastery[area] = (snapshotBkt[area] as number) ?? 0.1
        total += areaMastery[area]
      }
      bktMastery = {
        areas: AREAS,
        kcsByArea: Object.fromEntries(AREAS.map(a => [a, []])) as any,
        areaMastery,
        overallMastery: total / AREAS.length,
        masteredCount: AREAS.filter(a => areaMastery[a] >= 0.95).length,
        totalKCs: AREAS.length,
      }
    }

    // Engagement metrics
    const weeklyActivities = activityResult.data?.length ?? 0
    const studyStreak = profileResult.data?.study_streak ?? 0

    const engagement: EngagementMetrics = {
      sessionsLast30Days: weeklyActivities * 4,
      avgSessionMinutes: 15,
      currentStreak: studyStreak,
      totalQuestionsAttempted: weeklyActivities,
      totalFlashcardReviews: 0,
      totalFCRCases: 0,
      daysSinceLastActivity: weeklyActivities > 0 ? 0 : 7,
    }

    const inputs: UnifiedModelInputs = {
      irtTheta,
      mirtProfile,
      fcrCalibrationScore: fcrResult.data?.calibration_score ?? 50,
      fcrOverconfidenceIndex: fcrResult.data?.overconfidence_index ?? 0,
      bktMastery,
      hlrAverageRetention: snapshotRow?.hlr_average_retention ?? 0.7,
      engagement,
    }

    const profile: UnifiedLearnerProfile = buildUnifiedProfile(inputs)

    // Save snapshot
    await (supabase as any)
      .from('learner_model_snapshots')
      .insert({
        user_id: user.id,
        irt_theta: irtTheta,
        mirt_profile: mirtProfile ? { theta: mirtProfile.theta } : null,
        bkt_mastery: bktMastery ? bktMastery.areaMastery : null,
        hlr_average_retention: inputs.hlrAverageRetention,
        fcr_calibration_score: inputs.fcrCalibrationScore,
        fcr_overconfidence_index: inputs.fcrOverconfidenceIndex,
        overall_competency: profile.overallCompetency,
        pass_probability: profile.passProbability,
        area_competency: profile.areaCompetency,
        strengths: profile.strengths,
        weaknesses: profile.weaknesses,
        recommendations: profile.recommendations,
        engagement_score: Math.min(1, studyStreak / 30),
        study_streak: studyStreak,
        weekly_hours: engagement.avgSessionMinutes * engagement.sessionsLast30Days / 60,
      })

    return NextResponse.json({
      profile,
      inputs: {
        irtTheta: Math.round(irtTheta * 1000) / 1000,
        fcrCalibration: inputs.fcrCalibrationScore,
        weeklyActivities,
        studyStreak,
      },
      summary: {
        overallCompetency: Math.round(profile.overallCompetency * 100),
        passProbability: Math.round(profile.passProbability * 100),
        strengthCount: profile.strengths.length,
        weaknessCount: profile.weaknesses.length,
        recommendationCount: profile.recommendations.length,
        dataCompleteness: profile.dataCompleteness,
      },
    })
  } catch (error) {
    console.error('Learner Profile Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to build learner profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
