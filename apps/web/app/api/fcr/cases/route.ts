// ============================================================
// FCR CASES API ROUTE
// GET /api/fcr/cases - List available FCR cases
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { ENAMEDArea, DifficultyLevel } from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/fcr/cases
 *
 * List available FCR cases (without correct answers).
 *
 * Query params:
 *   - area?: ENAMEDArea (filter by area)
 *   - difficulty?: DifficultyLevel (filter by difficulty)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area') as ENAMEDArea | null
    const difficulty = searchParams.get('difficulty') as DifficultyLevel | null

    // Build query — select only safe fields (no correct answers)
    let query = (supabase as any)
      .from('fcr_cases')
      .select(`
        id,
        title_pt,
        clinical_presentation_pt,
        area,
        difficulty,
        dados_options,
        padrao_options,
        hipotese_options,
        conduta_options,
        irt_difficulty,
        irt_discrimination,
        irt_guessing,
        is_ai_generated,
        times_attempted,
        times_completed,
        avg_score,
        created_at
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (area) {
      query = query.eq('area', area)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    const { data: cases, error } = await query

    if (error) {
      console.error('Error loading FCR cases:', error)
      return NextResponse.json(
        { error: 'Failed to load cases' },
        { status: 500 }
      )
    }

    // Also fetch user's recent attempts for these cases
    const caseIds = (cases || []).map((c: any) => c.id)
    let userAttempts: any[] = []

    if (caseIds.length > 0) {
      const { data: attempts } = await (supabase as any)
        .from('fcr_attempts')
        .select('id, case_id, scaled_score, calibration_score, completed_at')
        .eq('user_id', user.id)
        .in('case_id', caseIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })

      userAttempts = attempts || []
    }

    return NextResponse.json({
      cases: cases || [],
      userAttempts,
    })
  } catch (error) {
    console.error('FCR Cases Error:', error)
    return NextResponse.json(
      { error: 'Failed to load FCR cases' },
      { status: 500 }
    )
  }
}
