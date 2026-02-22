// ============================================================
// EREM PREDICTION API ROUTE
// GET /api/erem/predict - Get student risk profile with SHAP explainability
// POST /api/erem/predict - Force refresh risk profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import { getStudentRiskProfile } from '@/lib/erem/trajectoryAnalyzer'
import { enhanceProfileWithSHAP } from '@/lib/erem/shapExplainer'

interface PredictRequest {
  studentId?: string
  forceRefresh?: boolean
}

/**
 * GET /api/erem/predict?studentId=xxx
 *
 * Returns the current risk profile for a student with SHAP explainability.
 * Faculty users can query any student; students can only query themselves.
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

    // Authorization: students can only see their own profile
    // Faculty/admins can see any student
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const isFaculty = profile?.subscription_tier === 'institutional'
    if (studentId !== user.id && !isFaculty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get risk profile
    const riskProfile = await getStudentRiskProfile(supabase, studentId)

    if (!riskProfile) {
      return NextResponse.json(
        { error: 'Unable to compute risk profile - insufficient data' },
        { status: 422 }
      )
    }

    // Enhance with SHAP values
    const enhancedProfile = await enhanceProfileWithSHAP(supabase, studentId, riskProfile)

    // Serialize for response (convert Map to object)
    const response = {
      studentId: enhancedProfile.studentId,
      timestamp: enhancedProfile.timestamp.toISOString(),
      compositeRisk: {
        value: enhancedProfile.compositeRisk.value,
        confidence: enhancedProfile.compositeRisk.confidence,
        lowerBound: enhancedProfile.compositeRisk.lowerBound,
        upperBound: enhancedProfile.compositeRisk.upperBound,
      },
      dimensionRisks: {
        clinicalReasoning: {
          value: enhancedProfile.clinicalReasoningRisk.value,
          confidence: enhancedProfile.clinicalReasoningRisk.confidence,
        },
        engagement: {
          value: enhancedProfile.engagementRisk.value,
          confidence: enhancedProfile.engagementRisk.confidence,
        },
        wellbeing: {
          value: enhancedProfile.wellbeingRisk.value,
          confidence: enhancedProfile.wellbeingRisk.confidence,
        },
        academic: {
          value: enhancedProfile.academicRisk.value,
          confidence: enhancedProfile.academicRisk.confidence,
        },
      },
      trajectory: enhancedProfile.trajectory,
      trajectoryConfidence: enhancedProfile.trajectoryConfidence,
      daysOfData: enhancedProfile.daysOfData,
      dataQuality: enhancedProfile.dataQuality,
      shapValues: Object.fromEntries(enhancedProfile.shapValues),
    }

    return NextResponse.json({ success: true, profile: response })
  } catch (error) {
    console.error('EREM Predict Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/erem/predict
 *
 * Force a fresh computation of the risk profile.
 * Request body: { studentId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await getSessionUserSummary(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: PredictRequest = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is okay
    }

    const studentId = body.studentId || user.id

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

    // Force fresh computation by deleting recent snapshots
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
    await supabase
      .from('student_risk_snapshots')
      .delete()
      .eq('student_id', studentId)
      .gte('created_at', sixHoursAgo.toISOString())

    // Get fresh risk profile
    const riskProfile = await getStudentRiskProfile(supabase, studentId)

    if (!riskProfile) {
      return NextResponse.json(
        { error: 'Unable to compute risk profile - insufficient data' },
        { status: 422 }
      )
    }

    // Enhance with SHAP values
    const enhancedProfile = await enhanceProfileWithSHAP(supabase, studentId, riskProfile)

    const response = {
      studentId: enhancedProfile.studentId,
      timestamp: enhancedProfile.timestamp.toISOString(),
      compositeRisk: {
        value: enhancedProfile.compositeRisk.value,
        confidence: enhancedProfile.compositeRisk.confidence,
        lowerBound: enhancedProfile.compositeRisk.lowerBound,
        upperBound: enhancedProfile.compositeRisk.upperBound,
      },
      dimensionRisks: {
        clinicalReasoning: {
          value: enhancedProfile.clinicalReasoningRisk.value,
          confidence: enhancedProfile.clinicalReasoningRisk.confidence,
        },
        engagement: {
          value: enhancedProfile.engagementRisk.value,
          confidence: enhancedProfile.engagementRisk.confidence,
        },
        wellbeing: {
          value: enhancedProfile.wellbeingRisk.value,
          confidence: enhancedProfile.wellbeingRisk.confidence,
        },
        academic: {
          value: enhancedProfile.academicRisk.value,
          confidence: enhancedProfile.academicRisk.confidence,
        },
      },
      trajectory: enhancedProfile.trajectory,
      trajectoryConfidence: enhancedProfile.trajectoryConfidence,
      daysOfData: enhancedProfile.daysOfData,
      dataQuality: enhancedProfile.dataQuality,
      shapValues: Object.fromEntries(enhancedProfile.shapValues),
    }

    return NextResponse.json({ success: true, profile: response, refreshed: true })
  } catch (error) {
    console.error('EREM Predict POST Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
