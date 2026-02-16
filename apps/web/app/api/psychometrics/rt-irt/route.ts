// ============================================================
// RT-IRT API ROUTE
// GET /api/psychometrics/rt-irt — Speed-accuracy profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  estimateSpeedAccuracy,
  toRTIRTResponse,
  toRTIRTItem,
  classifyResponseBehavior,
  type SpeedAccuracyProfile,
  type RTIRTItem,
} from '@darwin-education/shared'
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/psychometrics/rt-irt
 *
 * Estimates joint speed-accuracy profile using Response-Time IRT.
 * Uses van der Linden (2006) hierarchical framework with 2D EAP.
 *
 * Returns: SpeedAccuracyProfile with theta, tau, behavioral classifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load recent activity with response times
    const { data: activityRows, error: actError } = await (supabase as any)
      .from('study_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .not('response_time_ms', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200)

    let rows = activityRows || []
    let schemaWarning: string | undefined

    if (actError) {
      if (isMissingTableError(actError)) {
        console.warn(
          'RT-IRT skipped: study_activity_log table missing in local beta.'
        )
        rows = []
        schemaWarning = 'Dados indisponíveis neste ambiente (tabela de atividade ausente).'
      } else if (isSchemaDriftError(actError)) {
        console.warn('RT-IRT skipped due to schema drift:', actError)
        rows = []
        schemaWarning = 'Dados indisponíveis neste ambiente (schema em migração).'
      } else {
        console.error('Error loading activity log:', actError)
        rows = []
        schemaWarning = 'Não foi possível carregar dados de respostas neste momento.'
      }
    }

    if (rows.length < 15) {
      return NextResponse.json({
        profile: null,
        summary: {
          totalResponses: rows.length,
          minRequired: 15,
          message:
            schemaWarning ||
            'Complete pelo menos 15 questões com dados de tempo para análise RT-IRT.',
        },
      })
    }

    // Build RT-IRT responses and items
    const responses = rows.map((r: any) =>
      toRTIRTResponse(r.item_id || r.id, !!r.correct, r.response_time_ms, r.area)
    )

    const itemMap = new Map<string, RTIRTItem>()
    for (const r of rows) {
      const itemId = r.item_id || r.id
      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, toRTIRTItem({
          difficulty: r.difficulty ?? 0,
          discrimination: 1.2,
          guessing: 0.25,
        }))
      }
    }

    // 2D EAP estimation
    const profile: SpeedAccuracyProfile = estimateSpeedAccuracy(responses, itemMap)

    // Behavioral classification summary
    const behaviorCounts: Record<string, number> = {}
    for (const b of profile.responseBehaviors) {
      behaviorCounts[b.classification] = (behaviorCounts[b.classification] || 0) + 1
    }

    return NextResponse.json({
      profile,
      summary: {
        totalResponses: rows.length,
        theta: Math.round(profile.theta * 1000) / 1000,
        tau: Math.round(profile.tau * 1000) / 1000,
        rapidGuessRate: Math.round(profile.summary.rapidGuessRate * 100),
        behaviorCounts,
      },
    })
  } catch (error) {
    console.error('RT-IRT Error:', error)
    return NextResponse.json(
      {
        error: 'Falha ao calcular o perfil de velocidade e acurácia',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
