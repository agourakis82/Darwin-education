// ============================================================
// FCR START API ROUTE
// POST /api/fcr/start - Initialize an FCR case attempt
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { FCRCase, IRTParameters } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformCase(row: any): Omit<FCRCase, 'correctDados' | 'correctPadrao' | 'correctHipotese' | 'correctConduta'> & { correctDados?: never; correctPadrao?: never; correctHipotese?: never; correctConduta?: never } {
  return {
    id: row.id,
    titlePt: row.title_pt,
    clinicalPresentationPt: row.clinical_presentation_pt,
    area: row.area,
    difficulty: row.difficulty,
    dadosOptions: (row.dados_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false, // Strip correct flag for security
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    padraoOptions: (row.padrao_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false,
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    hipoteseOptions: (row.hipotese_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false,
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    condutaOptions: (row.conduta_options || []).map((o: any) => ({
      id: o.id,
      textPt: o.textPt,
      isCorrect: false,
      explanationPt: undefined,
      clinicalPearlPt: undefined,
    })),
    structuredExplanation: undefined, // Don't reveal explanations before submission
    irt: {
      difficulty: row.irt_difficulty ?? 0,
      discrimination: row.irt_discrimination ?? 1.2,
      guessing: row.irt_guessing ?? 0.25,
    } as IRTParameters,
    isPublic: row.is_public,
    isAIGenerated: row.is_ai_generated,
    timesAttempted: row.times_attempted,
    timesCompleted: row.times_completed,
    avgScore: row.avg_score,
  }
}

/**
 * POST /api/fcr/start
 *
 * Start a new FCR case attempt.
 *
 * Request body:
 *   - caseId: string (UUID of the FCR case)
 *
 * Returns: { attemptId, fcrCase } (case without correct answers)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { caseId } = body as { caseId: string }

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    // Load case (without correct answers for response, but we need them for the record)
    const { data: caseRow, error: caseError } = await (supabase as any)
      .from('fcr_cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (caseError || !caseRow) {
      console.error('Error loading FCR case:', caseError)
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Create attempt record
    const { data: attempt, error: attemptError } = await (supabase as any)
      .from('fcr_attempts')
      .insert({
        case_id: caseId,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (attemptError) {
      console.error('Error creating FCR attempt:', attemptError)
      return NextResponse.json(
        { error: 'Failed to create attempt' },
        { status: 500 }
      )
    }

    // Increment times_attempted
    await (supabase as any)
      .from('fcr_cases')
      .update({ times_attempted: (caseRow.times_attempted || 0) + 1 })
      .eq('id', caseId)

    // Transform and strip correct answers
    const safeCase = transformCase(caseRow)

    return NextResponse.json({
      attemptId: attempt.id,
      fcrCase: safeCase,
    })
  } catch (error) {
    console.error('FCR Start Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start FCR case',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
