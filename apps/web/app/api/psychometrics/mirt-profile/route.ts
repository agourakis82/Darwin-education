// ============================================================
// MIRT PROFILE API ROUTE
// GET /api/psychometrics/mirt-profile — 5D ability estimation
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  estimateMIRT_MAP,
  toMIRTItem,
  type MIRTAbilityProfile,
} from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/psychometrics/mirt-profile
 *
 * Estimates a 5-dimensional ability profile (one dimension per ENAMED area)
 * using Multidimensional IRT with MAP estimation via Newton-Raphson.
 *
 * Returns: MIRTAbilityProfile with theta[], SEs, CIs, dimension rankings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load last 100 exam responses with IRT params
    const { data: responseRows, error: respError } = await (supabase as any)
      .from('exam_attempts')
      .select(`
        id,
        responses,
        score,
        theta,
        completed_at
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5)

    if (respError) {
      console.error('Error loading exam attempts:', respError)
      return NextResponse.json(
        { error: 'Failed to load exam data' },
        { status: 500 }
      )
    }

    // Flatten individual question responses from exam attempts
    const mirtResponses: { correct: boolean; item: any }[] = []

    for (const attempt of responseRows || []) {
      const responses = attempt.responses || []
      for (const resp of responses) {
        if (resp.questionId && resp.area && resp.difficulty !== undefined) {
          const item = toMIRTItem(
            resp.questionId,
            resp.area,
            resp.difficulty ?? 0,
            resp.discrimination ?? 1.2,
            resp.guessing ?? 0.25
          )
          mirtResponses.push({ correct: !!resp.correct, item })
        }
      }
    }

    if (mirtResponses.length < 10) {
      return NextResponse.json({
        profile: null,
        summary: {
          totalResponses: mirtResponses.length,
          minRequired: 10,
          message: 'Complete pelo menos 10 questoes para perfil MIRT.',
        },
      })
    }

    // Run 5D MAP estimation
    const profile: MIRTAbilityProfile = estimateMIRT_MAP(mirtResponses)

    return NextResponse.json({
      profile,
      summary: {
        totalResponses: mirtResponses.length,
        compositeTheta: Math.round(profile.compositeTheta * 1000) / 1000,
        converged: profile.estimation.converged,
        iterations: profile.estimation.iterations,
        strongestArea: profile.dimensionProfiles[0]?.area,
        weakestArea: profile.dimensionProfiles[profile.dimensionProfiles.length - 1]?.area,
      },
    })
  } catch (error) {
    console.error('MIRT Profile Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute MIRT profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
