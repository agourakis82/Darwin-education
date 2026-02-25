// ============================================================
// CAT SUBMIT API ROUTE
// POST /api/cat/submit - Finalize a CAT session and record results
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { CATSession, ENAMEDArea } from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Database CAT session row shape.
 */
interface DatabaseCATSession {
  id: string
  attempt_id: string
  user_id: string
  theta: number
  se: number
  items_administered: string[]
  responses: boolean[]
  item_areas: string[]
  theta_history: { itemNum: number; theta: number; se: number }[]
  is_complete: boolean
  stopping_reason: string | null
}

/**
 * Converts database CAT session to CATSession type.
 */
function dbSessionToCATSession(dbSession: DatabaseCATSession): CATSession {
  return {
    theta: dbSession.theta,
    se: dbSession.se,
    itemsAdministered: dbSession.items_administered,
    responses: dbSession.responses,
    itemAreas: dbSession.item_areas as ENAMEDArea[],
    thetaHistory: dbSession.theta_history,
    isComplete: dbSession.is_complete,
    stoppingReason: dbSession.stopping_reason as CATSession['stoppingReason'],
  }
}

/**
 * POST /api/cat/submit
 *
 * Finalize a completed CAT session and persist all results.
 *
 * Request body:
 *   - attemptId: string
 *   - sessionId: string (opaque session identifier)
 *   - timeSpent?: number (total time in seconds)
 *
 * Returns: { success, scaledScore, passed, correctCount, totalItems }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Auth check
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { attemptId, sessionId, timeSpent } = body as {
      attemptId: string
      sessionId: string
      timeSpent?: number
    }

    if (!attemptId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: attemptId, sessionId' },
        { status: 400 }
      )
    }

    // Load CAT session from database (server-side storage)
    const { data: dbSession, error: sessionError } = await supabase
      .from('cat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !dbSession) {
      console.error('Error loading CAT session:', sessionError)
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // Convert database session to CATSession
    const session = dbSessionToCATSession(dbSession as unknown as DatabaseCATSession)

    // Calculate final score
    const scaledScore = Math.round(500 + session.theta * 100)
    const passed = scaledScore >= 600

    // Count correct answers
    const correctCount = session.responses.filter(r => r).length
    const totalItems = session.itemsAdministered.length

    // Build area breakdown from session data
    const areaBreakdown: Record<string, { correct: number; total: number; theta?: number }> = {}
    for (let i = 0; i < session.itemAreas.length; i++) {
      const area = session.itemAreas[i] as ENAMEDArea
      if (!areaBreakdown[area]) {
        areaBreakdown[area] = { correct: 0, total: 0 }
      }
      areaBreakdown[area].total++
      if (session.responses[i]) {
        areaBreakdown[area].correct++
      }
    }

    // Update exam_attempts with final results
    const { error: updateError } = await (supabase as any)
      .from('exam_attempts')
      .update({
        completed_at: new Date().toISOString(),
        theta: session.theta,
        standard_error: session.se,
        scaled_score: scaledScore,
        passed,
        correct_count: correctCount,
        area_breakdown: areaBreakdown,
        total_time_seconds: timeSpent || 0,
        is_adaptive: true,
        theta_trajectory: session.thetaHistory,
        items_administered: session.itemsAdministered,
        stopping_reason: session.stoppingReason || null,
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Error updating exam attempt:', updateError)
      return NextResponse.json(
        { error: 'Failed to save exam results' },
        { status: 500 }
      )
    }

    // Track study activity (fire-and-forget)
    try {
      await (supabase as any).rpc('track_study_activity', {
        p_user_id: user.id,
        p_activity_type: 'adaptive_exam',
        p_duration_minutes: Math.round((timeSpent || 0) / 60),
        p_questions_answered: totalItems,
        p_correct_answers: correctCount,
      })
    } catch (activityError) {
      // Non-critical - log and continue
      console.warn('Failed to track study activity:', activityError)
    }

    return NextResponse.json({
      success: true,
      scaledScore,
      passed,
      correctCount,
      totalItems,
    })
  } catch (error) {
    console.error('CAT Submit Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit CAT results',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
