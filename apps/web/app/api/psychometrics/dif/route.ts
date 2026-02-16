// ============================================================
// DIF ANALYSIS API ROUTE
// GET /api/psychometrics/dif — Differential Item Functioning
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  analyzeDIF,
  type DIFResponseData,
  type DIFGroupDefinition,
  type DIFAnalysis,
} from '@darwin-education/shared'
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/psychometrics/dif?groupVariable=area&focal=pediatria&reference=clinica_medica
 *
 * Runs Mantel-Haenszel DIF analysis to detect items that function
 * differently across subgroups after controlling for ability.
 *
 * Returns: DIFAnalysis with per-item results, ETS classifications, flagged items
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const groupVariable = searchParams.get('groupVariable') || 'area'
    const focalGroup = searchParams.get('focal') || 'pediatria'
    const referenceGroup = searchParams.get('reference') || 'clinica_medica'

    // Load all response data (cross-user for DIF — using cached results or aggregated data)
    const { data: activityRows, error: actError } = await (supabase as any)
      .from('study_activity_log')
      .select('item_id, correct, area, user_id, created_at')
      .in('activity_type', ['exam_question', 'flashcard_review'])
      .not('item_id', 'is', null)
      .limit(5000)

    let rows = activityRows || []
    let schemaWarning: string | undefined

    if (actError) {
      if (isMissingTableError(actError)) {
        console.warn(
          'DIF analysis skipped: study_activity_log table missing in local beta.'
        )
        rows = []
        schemaWarning = 'Dados indisponíveis neste ambiente (tabela de atividade ausente).'
      } else if (isSchemaDriftError(actError)) {
        console.warn('DIF analysis skipped due to schema drift:', actError)
        rows = []
        schemaWarning = 'Dados indisponíveis neste ambiente (schema em migração).'
      } else {
        console.error('Error loading activity data:', actError)
        rows = []
        schemaWarning = 'Não foi possível carregar dados de respostas neste momento.'
      }
    }

    if (rows.length < 100) {
      return NextResponse.json({
        analysis: null,
        summary: {
          totalResponses: rows.length,
          minRequired: 100,
          message:
            schemaWarning ||
            'Pelo menos 100 respostas sao necessarias para analise DIF confiavel.',
        },
      })
    }

    // Build DIF response data
    // Compute total scores per user
    const userScores = new Map<string, { total: number; correct: number }>()
    for (const r of rows) {
      const uid = r.user_id
      if (!userScores.has(uid)) userScores.set(uid, { total: 0, correct: 0 })
      const s = userScores.get(uid)!
      s.total++
      if (r.correct) s.correct++
    }

    const difResponses: DIFResponseData[] = rows
      .filter((r: any) => r.item_id && r.area)
      .map((r: any) => ({
        itemId: r.item_id,
        correct: !!r.correct,
        group: r[groupVariable === 'area' ? 'area' : groupVariable] || r.area,
        totalScore: userScores.get(r.user_id)?.correct ?? 0,
      }))

    const groupDef: DIFGroupDefinition = {
      variable: groupVariable as any,
      focalGroup,
      referenceGroup,
    }

    const analysis: DIFAnalysis = analyzeDIF(difResponses, groupDef)

    return NextResponse.json({
      analysis,
      summary: {
        totalItems: analysis.summary.totalItems,
        flaggedCount: analysis.flaggedItems.length,
        difRate: Math.round(analysis.summary.difRate * 100),
        overallFairness: analysis.summary.overallFairness,
        classificationCounts: analysis.summary.classificationCounts,
      },
    })
  } catch (error) {
    console.error('DIF Analysis Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compute DIF analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
