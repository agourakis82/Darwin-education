// ============================================================
// DDL RESPONSES API ROUTE
// POST /api/ddl/responses
// ============================================================
// NOTE: DDL tables are not yet in generated Supabase types.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/ddl/responses
 *
 * Saves a DDL response with behavioral data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionId, responseText, behavioralData } = body

    if (!questionId || !responseText) {
      return NextResponse.json(
        { error: 'questionId and responseText are required' },
        { status: 400 }
      )
    }

    // Use test user ID for development (or get from auth)
    const testUserId = process.env.DDL_TEST_USER_ID || '00000000-0000-0000-0000-000000000001'
    const sessionId = uuidv4()

    const { data, error } = await (supabase as any)
      .from('ddl_responses')
      .insert({
        user_id: testUserId,
        question_id: questionId,
        session_id: sessionId,
        response_text: responseText,
        behavioral_data: behavioralData || {},
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save response', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      responseId: data.id,
      sessionId,
      message: 'Response saved successfully',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
