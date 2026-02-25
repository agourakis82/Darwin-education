// ============================================================
// FACULTY STUDENTS API ROUTE
// GET /api/faculty/students - List students with risk summaries
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'

/**
 * GET /api/faculty/students
 *
 * Returns a list of students with their current risk status.
 * Only accessible to faculty (institutional tier).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify faculty status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_tier !== 'institutional') {
      return NextResponse.json({ error: 'Forbidden - Faculty access required' }, { status: 403 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const minRisk = parseFloat(searchParams.get('minRisk') || '0')
    const maxRisk = parseFloat(searchParams.get('maxRisk') || '1')
    const trajectory = searchParams.get('trajectory')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Query using the current_student_risk view
    let query = supabase
      .from('current_student_risk' as any)
      .select('*')
      .gte('composite_risk', minRisk)
      .lte('composite_risk', maxRisk)
      .order('composite_risk', { ascending: false })
      .limit(limit)

    if (trajectory) {
      query = query.eq('trajectory', trajectory)
    }

    const { data: students, error } = await query

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      students: (students || []).map((s: any) => ({
        id: s.student_id,
        name: s.full_name || 'Unknown',
        email: s.email,
        risk: s.composite_risk,
        trajectory: s.trajectory,
        dataQuality: s.data_quality,
        lastAssessment: s.last_assessment,
      })),
    })
  } catch (error) {
    console.error('Faculty Students Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
