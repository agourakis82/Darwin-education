// ============================================================
// DDL QUESTIONS API ROUTE
// GET /api/ddl/questions
// ============================================================
// NOTE: DDL tables are not yet in generated Supabase types.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization helper to avoid build-time errors
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

/**
 * GET /api/ddl/questions
 *
 * Returns all active DDL pilot questions
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const { data: questions, error } = await (supabase as any)
      .from('ddl_questions')
      .select('id, question_code, question_text, discipline, topic, subtopic, difficulty_level, cognitive_level')
      .eq('is_active', true)
      .order('question_code')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions: questions || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
