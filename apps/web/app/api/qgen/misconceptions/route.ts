/**
 * QGen Misconceptions API Route
 * ==============================
 *
 * GET /api/qgen/misconceptions - List misconceptions by specialty/topic
 * POST /api/qgen/misconceptions - Add new misconception
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Misconception {
  id: string;
  area: string;
  topic: string;
  misconception: string;
  correctConcept: string;
  commonConfusion: string;
  distractorTemplate?: string;
  frequency: 'HIGH' | 'MEDIUM' | 'LOW';
  severity: 'CRITICAL' | 'MODERATE' | 'MINOR';
  references?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface CreateMisconceptionRequest {
  area: string;
  topic: string;
  misconception: string;
  correctConcept: string;
  commonConfusion: string;
  distractorTemplate?: string;
  frequency?: 'HIGH' | 'MEDIUM' | 'LOW';
  severity?: 'CRITICAL' | 'MODERATE' | 'MINOR';
  references?: string[];
}

/**
 * GET - List misconceptions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const area = searchParams.get('area');
    const topic = searchParams.get('topic');
    const frequency = searchParams.get('frequency');
    const severity = searchParams.get('severity');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('qgen_misconceptions')
      .select('*', { count: 'exact' });

    if (area) {
      query = query.eq('area', area);
    }
    if (topic) {
      query = query.eq('topic', topic);
    }
    if (frequency) {
      query = query.eq('frequency', frequency.toLowerCase());
    }
    if (severity) {
      query = query.eq('severity', severity.toLowerCase());
    }
    if (search) {
      query = query.or(`misconception.ilike.%${search}%,correct_concept.ilike.%${search}%`);
    }

    query = query
      .order('frequency', { ascending: false })
      .order('severity', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching misconceptions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch misconceptions' },
        { status: 500 }
      );
    }

    // Transform to Misconception format
    const misconceptions: Misconception[] = (data || []).map(row => ({
      id: row.id,
      area: row.area,
      topic: row.topic,
      misconception: row.misconception,
      correctConcept: row.correct_concept,
      commonConfusion: row.common_confusion,
      distractorTemplate: row.distractor_template,
      frequency: (row.frequency || 'medium').toUpperCase() as Misconception['frequency'],
      severity: (row.severity || 'moderate').toUpperCase() as Misconception['severity'],
      references: row.references,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Get available areas and topics for filtering
    const { data: areasData } = await supabase
      .from('qgen_misconceptions')
      .select('area')
      .order('area');

    const { data: topicsData } = await supabase
      .from('qgen_misconceptions')
      .select('topic, area')
      .order('topic');

    const areas = [...new Set((areasData || []).map(r => r.area))];
    const topicsByArea: Record<string, string[]> = {};
    for (const row of topicsData || []) {
      if (!topicsByArea[row.area]) {
        topicsByArea[row.area] = [];
      }
      if (!topicsByArea[row.area].includes(row.topic)) {
        topicsByArea[row.area].push(row.topic);
      }
    }

    return NextResponse.json({
      success: true,
      misconceptions,
      filters: {
        areas,
        topicsByArea,
      },
      pagination: {
        total: count || misconceptions.length,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Misconceptions GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new misconception
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateMisconceptionRequest = await request.json();

    // Validate required fields
    if (!body.area || !body.topic || !body.misconception || !body.correctConcept || !body.commonConfusion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: area, topic, misconception, correctConcept, commonConfusion',
        },
        { status: 400 }
      );
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('qgen_misconceptions')
      .select('id')
      .eq('area', body.area)
      .eq('topic', body.topic)
      .eq('misconception', body.misconception)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This misconception already exists' },
        { status: 409 }
      );
    }

    // Insert new misconception
    const { data, error } = await supabase
      .from('qgen_misconceptions')
      .insert({
        area: body.area,
        topic: body.topic,
        misconception: body.misconception,
        correct_concept: body.correctConcept,
        common_confusion: body.commonConfusion,
        distractor_template: body.distractorTemplate,
        frequency: (body.frequency || 'MEDIUM').toLowerCase(),
        severity: (body.severity || 'MODERATE').toLowerCase(),
        references: body.references || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating misconception:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create misconception' },
        { status: 500 }
      );
    }

    const misconception: Misconception = {
      id: data.id,
      area: data.area,
      topic: data.topic,
      misconception: data.misconception,
      correctConcept: data.correct_concept,
      commonConfusion: data.common_confusion,
      distractorTemplate: data.distractor_template,
      frequency: (data.frequency || 'medium').toUpperCase() as Misconception['frequency'],
      severity: (data.severity || 'moderate').toUpperCase() as Misconception['severity'],
      references: data.references,
      createdAt: data.created_at,
    };

    return NextResponse.json({
      success: true,
      misconception,
      message: 'Misconception created successfully',
    });
  } catch (error) {
    console.error('Misconceptions POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove misconception
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing misconception id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('qgen_misconceptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting misconception:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete misconception' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Misconception deleted successfully',
    });
  } catch (error) {
    console.error('Misconceptions DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
