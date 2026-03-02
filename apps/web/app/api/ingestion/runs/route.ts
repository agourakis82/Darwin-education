import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitRaw = Number.parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 10;

    const { data, error } = await createServiceClient()
      .from('ingestion_runs')
      .select(
        'id,status,links_found,links_allowed,links_review,links_blocked,questions_extracted,error_message,started_at,completed_at'
      )
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const runs = data || [];
    const summary = runs.reduce(
      (acc, run) => {
        acc.total_runs += 1;
        acc.total_links_found += run.links_found || 0;
        acc.total_allow += run.links_allowed || 0;
        acc.total_review += run.links_review || 0;
        acc.total_blocked += run.links_blocked || 0;
        acc.total_questions_extracted += run.questions_extracted || 0;
        return acc;
      },
      {
        total_runs: 0,
        total_links_found: 0,
        total_allow: 0,
        total_review: 0,
        total_blocked: 0,
        total_questions_extracted: 0,
      }
    );

    return NextResponse.json({
      success: true,
      runs,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load ingestion runs',
      },
      { status: 500 }
    );
  }
}
