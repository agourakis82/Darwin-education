// ============================================================
// CDM NEXT-ITEM API ROUTE
// GET /api/cdm/next-item — CDM-CAT entropy-based item selection
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError } from '@/lib/supabase/errors'
import {
  selectNextItemCDMCAT,
  buildQMatrixFromRows,
} from '@darwin-education/shared'
import type { DINAParameters } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/cdm/next-item
 *
 * Returns the next question to administer in a CDM-CAT session.
 * Selects the item that maximally reduces posterior entropy.
 *
 * Query params:
 *   excludeIds   — comma-separated question UUIDs already administered
 *   maxCandidates — max candidate items to consider (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const excludeIdsParam = searchParams.get('excludeIds') ?? ''
    const maxCandidates = parseInt(searchParams.get('maxCandidates') ?? '50', 10)
    const excludedIds = new Set(excludeIdsParam.split(',').filter(Boolean))

    // 1. Load student's latest CDM snapshot (current posterior)
    const { data: snapshots, error: snapError } = await (supabase as any)
      .from('cdm_snapshots')
      .select('posterior_probabilities, cdm_parameters_id')
      .eq('user_id', user.id)
      .order('snapshot_at', { ascending: false })
      .limit(1)

    if (snapError && isMissingTableError(snapError)) {
      return NextResponse.json({
        nextItem: null,
        warning: 'Tabelas CDM ainda não migradas (execute migração 022).',
      })
    }

    // Default to uniform posterior if no snapshot exists yet
    const currentPosterior: number[] = snapshots?.[0]?.posterior_probabilities ?? new Array(64).fill(1 / 64)

    // 2. Load candidate items with Q-matrix entries (not yet administered)
    const qQuery = (supabase as any)
      .from('question_q_matrix')
      .select('question_id, attribute_id')
      .limit(maxCandidates * 3) // over-fetch for filtering

    const { data: qRows, error: qError } = await qQuery
    if (qError && !isMissingTableError(qError)) throw qError

    const qMatrix = buildQMatrixFromRows(qRows || [])

    // Filter out excluded items
    const candidateIds = Object.keys(qMatrix).filter(id => !excludedIds.has(id))
    if (candidateIds.length === 0) {
      return NextResponse.json({
        nextItem: null,
        message: 'Sem questões disponíveis para seleção CDM-CAT.',
      })
    }

    // Limit candidates for performance
    const limitedCandidates = candidateIds.slice(0, maxCandidates)

    // 3. Load CDM parameters
    const paramId = snapshots?.[0]?.cdm_parameters_id
    let params: DINAParameters

    if (paramId) {
      const { data: paramRow } = await (supabase as any)
        .from('cdm_parameters')
        .select('item_parameters, class_priors')
        .eq('id', paramId)
        .single()

      params = paramRow
        ? { items: paramRow.item_parameters, classPriors: paramRow.class_priors }
        : buildStubDINAParams(limitedCandidates, qMatrix)
    } else {
      params = buildStubDINAParams(limitedCandidates, qMatrix)
    }

    // 4. Run CDM-CAT selection
    const nextItem = selectNextItemCDMCAT(
      currentPosterior,
      limitedCandidates,
      qMatrix,
      params,
      excludedIds
    )

    return NextResponse.json({
      nextItem,
      currentEntropy: -currentPosterior.reduce((H, p) =>
        p > 1e-12 ? H + p * Math.log2(p) : H, 0),
      candidatesConsidered: limitedCandidates.length,
    })
  } catch (error) {
    console.error('CDM Next-Item Error:', error)
    return NextResponse.json(
      { error: 'Falha na seleção CDM-CAT', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

function buildStubDINAParams(itemIds: string[], qMatrix: Record<string, number[]>): DINAParameters {
  return {
    items: itemIds.map(itemId => ({
      itemId,
      slip: 0.15,
      guessing: 0.20,
      requiredAttributes: (qMatrix[itemId] ?? [0,0,0,0,0,0])
        .map((v, k) => (v === 1 ? k : -1))
        .filter(k => k >= 0),
    })),
    classPriors: new Array(64).fill(1 / 64),
  }
}
