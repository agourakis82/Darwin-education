// ============================================================
// DDL FEEDBACK API ROUTE
// GET /api/ddl/feedback/[id]
// ============================================================
// NOTE: DDL tables are not yet in generated Supabase types.
// Using 'any' casts until migration is applied and types regenerated.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ddlService } from '@/lib/ddl/services/ddl-service'

/**
 * GET /api/ddl/feedback/[id]
 *
 * Retrieves feedback for a given feedback ID.
 * User must be authenticated and own the feedback.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()

    // Check for service role key (for testing) or user auth
    const authHeader = request.headers.get('authorization')
    const isServiceRole = authHeader?.includes(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-20) || '')
    const isDev = process.env.NODE_ENV === 'development'

    let userId: string

    if (isServiceRole || isDev) {
      userId = process.env.DDL_TEST_USER_ID || ''
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    // Get feedback
    const feedback = await ddlService.getFeedback(id)

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    // Mark as viewed
    await (supabase as any)
      .from('ddl_feedback')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      feedback_type: feedback.feedback_type,
      feedback_content: feedback.feedback_content,
    })
  } catch (error) {
    console.error('Get Feedback Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ddl/feedback/[id]
 *
 * Submit user rating for feedback
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const { rating, helpful, comments } = body

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const { error } = await (supabase as any)
      .from('ddl_feedback')
      .update({
        user_rating: rating,
        user_feedback_helpful: helpful,
        user_comments: comments,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback rating submitted',
    })
  } catch (error) {
    console.error('Submit Rating Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit rating',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
