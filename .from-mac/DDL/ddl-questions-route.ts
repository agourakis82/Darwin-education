// ============================================================
// DDL QUESTIONS API ROUTE
// apps/web/src/app/api/ddl/questions/route.ts
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: questions, error } = await supabase
      .from('ddl_questions')
      .select('id, question_code, question_text, discipline, topic, difficulty_level, cognitive_level')
      .eq('is_active', true)
      .order('question_code');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
