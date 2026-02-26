// ============================================================
// CDM Q-MATRIX ADMIN ROUTE
// POST /api/cdm/q-matrix — batch upsert Q-matrix entries
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import { validateQMatrix, buildQMatrixFromRows } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * POST /api/cdm/q-matrix
 *
 * Batch upsert Q-matrix entries. Validates identifiability conditions
 * before applying. Requires institutional subscription tier.
 *
 * Body: {
 *   updates: Array<{ questionId: string; attributeId: string; required: boolean }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Institutional tier check
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileData?.subscription_tier !== 'institutional') {
      return NextResponse.json(
        { error: 'Forbidden: Q-matrix editing requires institutional tier.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updates: Array<{ questionId: string; attributeId: string; required: boolean }> =
      body?.updates ?? []

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Body must contain a non-empty updates array.' }, { status: 400 })
    }

    // Load current Q-matrix + apply proposed updates (in-memory validation)
    const { data: existingRows } = await (supabase as any)
      .from('question_q_matrix')
      .select('question_id, attribute_id')

    const allRows = [
      ...(existingRows ?? []),
      ...updates.map(u => ({ question_id: u.questionId, attribute_id: u.attributeId })),
    ]
    const proposedQMatrix = buildQMatrixFromRows(allRows)
    const diagnostics = validateQMatrix(proposedQMatrix)

    // Warn if incomplete but don't block (incomplete is expected during gradual expert review)
    const upsertRows = updates.map(u => ({
      question_id: u.questionId,
      attribute_id: u.attributeId,
      required: u.required,
      source: 'expert',
      updated_at: new Date().toISOString(),
    }))

    await (supabase as any)
      .from('question_q_matrix')
      .upsert(upsertRows, { onConflict: 'question_id,attribute_id' })
      .throwOnError()

    return NextResponse.json({
      applied: updates.length,
      diagnostics: {
        isComplete: diagnostics.isComplete,
        isDiscernible: diagnostics.isDiscernible,
        attributeCoverage: diagnostics.attributeCoverage,
        warnings: diagnostics.completenessWarnings,
      },
    })
  } catch (error) {
    console.error('CDM Q-Matrix Update Error:', error)
    return NextResponse.json(
      { error: 'Falha ao atualizar Q-matrix', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cdm/q-matrix
 *
 * Returns current Q-matrix diagnostics (coverage, discernibility).
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: rows } = await (supabase as any)
      .from('question_q_matrix')
      .select('question_id, attribute_id')

    const qMatrix = buildQMatrixFromRows(rows ?? [])
    const diagnostics = validateQMatrix(qMatrix)
    const totalMappedItems = Object.keys(qMatrix).length

    return NextResponse.json({
      diagnostics,
      totalMappedItems,
      totalEntries: (rows ?? []).length,
    })
  } catch (error) {
    console.error('CDM Q-Matrix GET Error:', error)
    return NextResponse.json(
      { error: 'Falha ao carregar Q-matrix', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
