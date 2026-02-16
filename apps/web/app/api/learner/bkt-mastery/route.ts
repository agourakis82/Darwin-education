// ============================================================
// BKT MASTERY API ROUTE
// GET /api/learner/bkt-mastery — Knowledge component mastery
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  traceMastery,
  computeMasteryState,
  buildMasteryHeatmap,
  type BKTObservation,
  type BKTMasteryState,
  type ENAMEDArea,
} from '@darwin-education/shared'
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/learner/bkt-mastery
 *
 * Computes per-knowledge-component mastery using Bayesian Knowledge Tracing.
 * Returns mastery heatmap (area x KC), trajectories, and classifications.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load response history grouped by knowledge component
    const { data: activityRows, error: actError } = await (supabase as any)
      .from('study_activity_log')
      .select('knowledge_component, correct, area, created_at, activity_type, item_id')
      .eq('user_id', user.id)
      .not('knowledge_component', 'is', null)
      .order('created_at', { ascending: true })

    let rows = activityRows || []
    let schemaWarning: string | undefined

    if (actError) {
      if (isMissingTableError(actError)) {
        console.warn(
          'BKT mastery skipped: study_activity_log table missing in local beta.'
        )
        rows = []
        schemaWarning = 'Dados indisponíveis neste ambiente (tabela de atividade ausente).'
      } else if (isSchemaDriftError(actError)) {
        console.warn('BKT mastery skipped due to schema drift:', actError)
        rows = []
        schemaWarning = 'Dados indisponíveis neste ambiente (schema em migração).'
      } else {
        console.error('Error loading activity data:', actError)
        rows = []
        schemaWarning = 'Não foi possível carregar dados de atividade neste momento.'
      }
    }

    if (rows.length < 5) {
      return NextResponse.json({
        heatmap: null,
        masteryStates: [],
        summary: {
          totalObservations: rows.length,
          minRequired: 5,
          message:
            schemaWarning ||
            'Complete pelo menos 5 atividades com componentes de conhecimento para rastreamento BKT.',
        },
      })
    }

    // Group observations by KC
    const kcObservations = new Map<string, { area: ENAMEDArea; obs: BKTObservation[] }>()

    for (const r of rows) {
      const kc = r.knowledge_component
      if (!kcObservations.has(kc)) {
        kcObservations.set(kc, { area: r.area || 'clinica_medica', obs: [] })
      }
      kcObservations.get(kc)!.obs.push({
        correct: !!r.correct,
        timestamp: new Date(r.created_at),
        source: (r.activity_type as 'exam' | 'flashcard' | 'cat') || 'exam',
        itemId: r.item_id,
      })
    }

    // Compute mastery for each KC
    const masteryStates: BKTMasteryState[] = []
    const kcNames = new Map<string, { name: string; area: ENAMEDArea }>()

    for (const [kcId, { area, obs }] of kcObservations) {
      const state = computeMasteryState(kcId, obs)
      masteryStates.push(state)
      kcNames.set(kcId, { name: kcId.replace(/_/g, ' '), area })
    }

    // Build heatmap
    const heatmap = buildMasteryHeatmap(masteryStates, kcNames)

    // Compute trajectories for top 5 most-practiced KCs
    const topKCs = [...kcObservations.entries()]
      .sort((a, b) => b[1].obs.length - a[1].obs.length)
      .slice(0, 5)

    const trajectories = topKCs.map(([kcId, { obs }]) => ({
      kcId,
      points: traceMastery(obs),
    }))

    return NextResponse.json({
      heatmap,
      masteryStates,
      trajectories,
      summary: {
        totalKCs: masteryStates.length,
        masteredCount: heatmap.masteredCount,
        overallMastery: Math.round(heatmap.overallMastery * 1000) / 1000,
        areaMastery: heatmap.areaMastery,
      },
    })
  } catch (error) {
    console.error('BKT Mastery Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute BKT mastery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
