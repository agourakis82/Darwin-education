// ============================================================
// DDL ANALYSIS API ROUTE
// POST /api/ddl/analyze
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ddlService } from '@/lib/ddl/services/ddl-service'
import type { BehavioralData } from '@/lib/ddl/types'

interface AnalyzeRequestBody {
  responseId?: string
  // Or submit new response
  questionId?: string
  responseText?: string
  behavioralData?: BehavioralData
}

/**
 * POST /api/ddl/analyze
 *
 * Analyzes a DDL response for learning gap classification.
 *
 * Body options:
 * 1. { responseId: string } - Analyze existing response
 * 2. { questionId, responseText, behavioralData } - Submit and analyze new response
 *
 * Returns classification results and feedback ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check for service role key (for testing) or user auth
    const authHeader = request.headers.get('authorization')
    const isServiceRole = authHeader?.includes(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-20) || '')
    const isDev = process.env.NODE_ENV === 'development'

    let userId: string

    if (isServiceRole || isDev) {
      // Use test user for service role requests or development mode
      userId = process.env.DDL_TEST_USER_ID || ''
    } else {
      // Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const body = await request.json() as AnalyzeRequestBody

    let responseId: string

    // Option 1: Analyze existing response
    if (body.responseId) {
      responseId = body.responseId
    }
    // Option 2: Submit new response and analyze
    else if (body.questionId && body.responseText && body.behavioralData) {
      // Generate session ID
      const sessionId = crypto.randomUUID()

      // Submit response
      responseId = await ddlService.submitResponse(
        userId,
        body.questionId,
        sessionId,
        body.responseText,
        body.behavioralData
      )
    }
    else {
      return NextResponse.json(
        {
          error: 'Invalid request. Provide either responseId or (questionId, responseText, behavioralData)'
        },
        { status: 400 }
      )
    }

    // Run DDL analysis pipeline
    const result = await ddlService.analyzeResponse(responseId)

    return NextResponse.json({
      success: true,
      data: {
        responseId,
        classification: {
          type: result.classification.primary_type,
          confidence: result.classification.primary_confidence,
          probability: result.classification.primary_probability,
          secondary: result.classification.secondary_type
            ? {
              type: result.classification.secondary_type,
              probability: result.classification.secondary_probability,
            }
            : null,
        },
        feedbackId: result.feedbackId,
        summary: {
          conceptCoverage: result.semantic.concept_analysis.coverage_ratio,
          integrationScore: result.semantic.integration_analysis.integration_score,
          anxietyScore: result.behavioral.anxiety_indicators.behavioral_anxiety_score,
          semanticSimilarity: result.semantic.overall_semantic_similarity,
        },
        evidence: result.classification.supporting_evidence,
      },
    })
  } catch (error) {
    console.error('DDL Analysis Error:', error)
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
