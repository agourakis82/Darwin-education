/**
 * QGen Review API Route
 * ======================
 *
 * GET /api/qgen/review - Get questions pending review
 * POST /api/qgen/review - Submit human review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReviewQueueItem {
  id: string;
  question: {
    stem: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
  };
  area: string;
  topic?: string;
  validationScore: number;
  validationFlags: string[];
  generatedAt: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SubmitReviewRequest {
  questionId: string;
  reviewerId: string;
  decision: 'APPROVE' | 'REJECT' | 'REVISE';
  feedback?: string;
  revisions?: {
    stem?: string;
    options?: string[];
    correctAnswerIndex?: number;
    explanation?: string;
  };
  qualityRatings?: {
    medicalAccuracy: number; // 1-5
    clinicalRelevance: number;
    clarity: number;
    distractorQuality: number;
  };
}

/**
 * GET - Get questions pending human review
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const area = searchParams.get('area');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('qgen_generated_questions')
      .select(`
        id,
        stem,
        alternatives,
        correct_answer_index,
        explanation,
        area,
        topic,
        validation_score,
        validation_flags,
        created_at,
        validation_status
      `)
      .eq('validation_status', status === 'pending' ? 'pending_review' : status)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (area) {
      query = query.eq('area', area);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching review queue:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch review queue' },
        { status: 500 }
      );
    }

    // Transform to ReviewQueueItem format
    const items: ReviewQueueItem[] = (data || []).map(row => ({
      id: row.id,
      question: {
        stem: row.stem,
        options: row.alternatives?.map((a: { text: string }) => a.text) || [],
        correctAnswerIndex: row.correct_answer_index,
        explanation: row.explanation,
      },
      area: row.area,
      topic: row.topic,
      validationScore: row.validation_score || 0,
      validationFlags: row.validation_flags || [],
      generatedAt: row.created_at,
      priority: determinePriority(row.validation_score),
    }));

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        total: count || items.length,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Review queue error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Submit a human review
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmitReviewRequest = await request.json();

    // Validate required fields
    if (!body.questionId || !body.reviewerId || !body.decision) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: questionId, reviewerId, decision' },
        { status: 400 }
      );
    }

    if (!['APPROVE', 'REJECT', 'REVISE'].includes(body.decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid decision. Must be APPROVE, REJECT, or REVISE' },
        { status: 400 }
      );
    }

    // Insert review record
    const { error: reviewError } = await supabase
      .from('qgen_human_reviews')
      .insert({
        question_id: body.questionId,
        reviewer_id: body.reviewerId,
        decision: body.decision.toLowerCase(),
        feedback: body.feedback,
        quality_ratings: body.qualityRatings,
        created_at: new Date().toISOString(),
      });

    if (reviewError) {
      console.error('Error inserting review:', reviewError);
      return NextResponse.json(
        { success: false, error: 'Failed to save review' },
        { status: 500 }
      );
    }

    // Update question status
    const newStatus = body.decision === 'APPROVE' ? 'approved' :
                      body.decision === 'REJECT' ? 'rejected' :
                      'needs_revision';

    const updateData: Record<string, unknown> = {
      validation_status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewer_id: body.reviewerId,
    };

    // If revisions were provided, update the question
    if (body.decision === 'REVISE' && body.revisions) {
      if (body.revisions.stem) {
        updateData.stem = body.revisions.stem;
      }
      if (body.revisions.options) {
        updateData.alternatives = body.revisions.options.map((text, idx) => ({
          text,
          is_correct: idx === (body.revisions?.correctAnswerIndex ?? 0),
        }));
      }
      if (body.revisions.correctAnswerIndex !== undefined) {
        updateData.correct_answer_index = body.revisions.correctAnswerIndex;
      }
      if (body.revisions.explanation) {
        updateData.explanation = body.revisions.explanation;
      }
    }

    const { error: updateError } = await supabase
      .from('qgen_generated_questions')
      .update(updateData)
      .eq('id', body.questionId);

    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update question status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Question ${body.decision.toLowerCase()}d successfully`,
      newStatus,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function determinePriority(validationScore: number | null): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (!validationScore) return 'MEDIUM';
  if (validationScore >= 0.8) return 'LOW'; // High quality, low priority
  if (validationScore >= 0.6) return 'MEDIUM';
  return 'HIGH'; // Low quality, needs urgent review
}
