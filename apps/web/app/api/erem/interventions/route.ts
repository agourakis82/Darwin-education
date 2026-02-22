// ============================================================
// EREM INTERVENTIONS API ROUTE
// GET /api/erem/interventions - Get intervention recommendations for a student
// POST /api/erem/interventions - Generate new intervention recommendations
// PATCH /api/erem/interventions - Update intervention status
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import {
  generateInterventionRecommendations,
  updateInterventionStatus,
  InterventionStatus,
  InterventionRecommendation,
} from '@/lib/erem/interventionEngine'
import { getStudentRiskProfile } from '@/lib/erem/trajectoryAnalyzer'

interface GetInterventionsRequest {
  studentId?: string
  status?: InterventionStatus
  limit?: number
}

interface UpdateInterventionRequest {
  interventionId: string
  status: InterventionStatus
  outcome?: 'success' | 'partial' | 'no_effect' | 'negative'
}

/**
 * GET /api/erem/interventions
 *
 * Get intervention recommendations for a student.
 * Query params: studentId, status, limit
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
    const status = searchParams.get('status') as InterventionStatus | null
    const limit = parseInt(searchParams.get('limit') || '20', 10)

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

    // Build query
    let query = supabase
      .from('intervention_recommendations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: interventions, error } = await query

    if (error) {
      console.error('Error fetching interventions:', error)
      return NextResponse.json({ error: 'Failed to fetch interventions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      interventions: interventions?.map((i) => ({
        id: i.id,
        studentId: i.student_id,
        type: i.intervention_type,
        priority: i.priority,
        status: i.status,
        title: i.title,
        description: i.description,
        rationale: i.rationale,
        expectedImpact: i.expected_impact,
        confidence: i.confidence,
        suggestedAt: i.created_at,
        startedAt: i.started_at,
        completedAt: i.completed_at,
        outcome: i.outcome,
      })),
    })
  } catch (error) {
    console.error('EREM Interventions GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/erem/interventions
 *
 * Generate new intervention recommendations for a student.
 * Request body: { studentId?: string, forceRefresh?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { studentId?: string; forceRefresh?: boolean } = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is okay
    }

    const studentId = body.studentId || user.id

    // Authorization check - only faculty can generate recommendations
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const isFaculty = profile?.subscription_tier === 'institutional'
    if (!isFaculty) {
      return NextResponse.json(
        { error: 'Only faculty can generate intervention recommendations' },
        { status: 403 }
      )
    }

    // Get risk profile
    const riskProfile = await getStudentRiskProfile(supabase, studentId)

    if (!riskProfile) {
      return NextResponse.json(
        { error: 'Unable to compute risk profile for student' },
        { status: 422 }
      )
    }

    // Generate recommendations
    const recommendations = await generateInterventionRecommendations(supabase, riskProfile)

    // Format response
    const response = {
      studentId,
      riskSummary: {
        compositeRisk: riskProfile.compositeRisk.value,
        trajectory: riskProfile.trajectory,
        dataQuality: riskProfile.dataQuality,
      },
      recommendations: recommendations.map((rec) => ({
        intervention: {
          id: rec.intervention.id,
          type: rec.intervention.type,
          priority: rec.intervention.priority,
          title: rec.intervention.title,
          description: rec.intervention.description,
          rationale: rec.intervention.rationale,
          expectedImpact: rec.expectedSuccessRate,
          confidence: rec.confidence,
        },
        reasoning: rec.reasoning,
        similarCasesCount: rec.basedOnMatches.length,
      })),
    }

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error('EREM Interventions POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/erem/interventions
 *
 * Update the status of an intervention.
 * Request body: { interventionId: string, status: string, outcome?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: UpdateInterventionRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { interventionId, status, outcome } = body

    if (!interventionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: interventionId, status' },
        { status: 400 }
      )
    }

    // Verify user has access to this intervention
    const { data: intervention, error: fetchError } = await supabase
      .from('intervention_recommendations')
      .select('student_id')
      .eq('id', interventionId)
      .single()

    if (fetchError || !intervention) {
      return NextResponse.json({ error: 'Intervention not found' }, { status: 404 })
    }

    // Authorization check
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const isFaculty = profile?.subscription_tier === 'institutional'
    if (intervention.student_id !== user.id && !isFaculty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update status
    const success = await updateInterventionStatus(supabase, interventionId, status, outcome)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update intervention status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      interventionId,
      status,
      outcome: outcome || null,
    })
  } catch (error) {
    console.error('EREM Interventions PATCH Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
