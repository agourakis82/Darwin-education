// ============================================================
// EREM SNAPSHOTS API ROUTE
// GET /api/erem/snapshots - Get risk snapshots for a student
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'

/**
 * GET /api/erem/snapshots?studentId=xxx&days=90
 *
 * Returns historical risk snapshots for trajectory analysis.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId') || user.id
    const days = parseInt(searchParams.get('days') || '90', 10)

    // Authorization check
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const isFaculty = profile?.subscription_tier === 'institutional'
    if (studentId !== user.id && !isFaculty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch snapshots
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const { data: snapshots, error } = await supabase
      .from('student_risk_snapshots')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching snapshots:', error)
      return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
    }

    const response = {
      success: true,
      snapshots: (snapshots || []).map((s) => ({
        id: s.id,
        timestamp: s.created_at,
        compositeRisk: s.composite_risk,
        clinicalReasoningRisk: s.clinical_reasoning_risk,
        engagementRisk: s.engagement_risk,
        wellbeingRisk: s.wellbeing_risk,
        academicRisk: s.academic_risk,
        confidence: s.confidence,
        trajectory: s.trajectory,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('EREM Snapshots Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
