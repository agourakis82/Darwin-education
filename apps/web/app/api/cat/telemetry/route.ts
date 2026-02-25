// ============================================================
// CAT TELEMETRY API ROUTE
// POST /api/cat/telemetry - Receive behavioral telemetry events
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'

interface TelemetryEvent {
  type: string
  timestamp: string
  questionId: string
  questionNumber: number
  metadata?: Record<string, unknown>
}

interface TelemetryRequest {
  sessionId: string
  events: TelemetryEvent[]
}

/**
 * POST /api/cat/telemetry
 *
 * Receive and store behavioral telemetry events for CAT sessions.
 * Events are stored in cat_telemetry table for analysis.
 *
 * Request body:
 *   - sessionId: string
 *   - events: TelemetryEvent[]
 *
 * Returns: { success: true }
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
    let body: TelemetryRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { sessionId, events } = body

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, events' },
        { status: 400 }
      )
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('cat_sessions')
      .select('id, attempt_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      )
    }

    // Prepare telemetry records
    const telemetryRecords = events.map((event) => ({
      session_id: sessionId,
      attempt_id: session.attempt_id,
      user_id: user.id,
      event_type: event.type,
      question_id: event.questionId,
      question_number: event.questionNumber,
      event_timestamp: event.timestamp,
      metadata: (event.metadata || {}) as any,
    }))

    // Insert telemetry events (fire-and-forget, don't block response)
    const { error: insertError } = await supabase
      .from('cat_telemetry')
      .insert(telemetryRecords)

    if (insertError) {
      console.error('Error inserting telemetry:', insertError)
      // Still return success to client - telemetry is non-critical
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CAT Telemetry Error:', error)
    // Return 200 even on error to prevent client retries
    // Telemetry is non-critical and shouldn't disrupt the test
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
