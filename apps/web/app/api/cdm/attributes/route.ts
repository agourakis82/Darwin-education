// ============================================================
// CDM ATTRIBUTES API ROUTE
// GET /api/cdm/attributes — list cognitive attributes + coverage
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError } from '@/lib/supabase/errors'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/cdm/attributes
 *
 * Returns the K=6 cognitive attributes and how many questions
 * are currently mapped to each attribute in the Q-matrix.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load attributes
    const { data: attrs, error: attrsError } = await (supabase as any)
      .from('cognitive_attributes')
      .select('*')
      .order('ordinal')

    if (attrsError) {
      if (isMissingTableError(attrsError)) {
        return NextResponse.json({
          attributes: [],
          coverageStats: {},
          warning: 'CDM tables not yet migrated (run migration 022).',
        })
      }
      throw attrsError
    }

    // Coverage: count Q-matrix entries per attribute
    const { data: coverage } = await (supabase as any)
      .from('question_q_matrix')
      .select('attribute_id')

    const coverageStats: Record<string, number> = {}
    for (const row of coverage || []) {
      coverageStats[row.attribute_id] = (coverageStats[row.attribute_id] ?? 0) + 1
    }

    return NextResponse.json({ attributes: attrs ?? [], coverageStats })
  } catch (error) {
    console.error('CDM Attributes Error:', error)
    return NextResponse.json(
      { error: 'Falha ao carregar atributos cognitivos', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
