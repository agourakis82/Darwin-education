// ============================================================
// DDL FEEDBACK API ROUTE
// apps/web/src/app/api/ddl/feedback/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;

    const { data: feedback, error } = await supabase
      .from('ddl_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback', details: error.message },
        { status: 500 }
      );
    }

    // Mark as viewed
    await supabase
      .from('ddl_feedback')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', feedbackId);

    return NextResponse.json(feedback);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;
    const body = await request.json();
    const { rating, helpful, comments } = body;

    const updateData: any = {};
    if (rating !== undefined) updateData.user_rating = rating;
    if (helpful !== undefined) updateData.user_feedback_helpful = helpful;
    if (comments !== undefined) updateData.user_comments = comments;

    const { error } = await supabase
      .from('ddl_feedback')
      .update(updateData)
      .eq('id', feedbackId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Feedback rating saved' });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
