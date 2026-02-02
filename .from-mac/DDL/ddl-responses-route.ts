// ============================================================
// DDL RESPONSES API ROUTE
// apps/web/src/app/api/ddl/responses/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, responseText, behavioralData } = body;

    // Validate required fields
    if (!questionId || !responseText) {
      return NextResponse.json(
        { error: 'questionId and responseText are required' },
        { status: 400 }
      );
    }

    // For testing, use a test user ID if not authenticated
    // In production, get this from the session
    const testUserId = process.env.DDL_TEST_USER_ID || '00000000-0000-0000-0000-000000000001';
    const sessionId = uuidv4();

    // Create response record
    const { data, error } = await supabase
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
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save response', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      responseId: data.id,
      sessionId,
      message: 'Response saved successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
