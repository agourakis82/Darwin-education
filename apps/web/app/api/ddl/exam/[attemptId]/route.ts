// ============================================================
// DDL EXAM ANALYSIS API ROUTE
// GET /api/ddl/exam/[attemptId] - Get DDL summary for exam
// POST /api/ddl/exam/[attemptId] - Trigger DDL analysis for exam
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ddlBatchService } from '@/lib/ddl/services/batch-service'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/ddl/exam/[attemptId]
 *
 * Get DDL analysis summary for an exam attempt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const authHeader = request.headers.get('authorization')
    const isServiceRole = authHeader?.includes(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-20) || '')
    const isDev = process.env.NODE_ENV === 'development'

    if (!isServiceRole && !isDev) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { attemptId } = await params

    const summary = await ddlBatchService.getExamDDLSummary(attemptId)

    if (!summary || !summary.summary) {
      return NextResponse.json({
        success: true,
        data: {
          hasAnalysis: false,
          message: 'No DDL analysis available for this exam',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        hasAnalysis: true,
        ...summary,
      },
    })
  } catch (error) {
    console.error('DDL Exam Summary Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get exam DDL summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ddl/exam/[attemptId]
 *
 * Trigger DDL analysis for an exam attempt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const supabase = await createServerClient()

    // Check auth
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

    const { attemptId } = await params
    const body = await request.json()

    // Check if batch job already exists
    const { data: existingSummary } = await (supabase as any)
      .from('exam_ddl_summary')
      .select('batch_job_id')
      .eq('exam_attempt_id', attemptId)
      .single()

    let jobId: string

    if (existingSummary?.batch_job_id) {
      // Use existing batch job
      jobId = existingSummary.batch_job_id

      // Check status
      const jobStatus = await ddlBatchService.getBatchJobStatus(jobId)
      if (jobStatus?.status === 'completed') {
        return NextResponse.json({
          success: true,
          data: {
            jobId,
            status: 'already_completed',
            message: 'DDL analysis already completed for this exam',
          },
        })
      }

      if (jobStatus?.status === 'processing') {
        return NextResponse.json({
          success: true,
          data: {
            jobId,
            status: 'processing',
            processedItems: jobStatus.processed_items,
            totalItems: jobStatus.total_items,
          },
        })
      }
    } else {
      // Create new batch job
      jobId = await ddlBatchService.createExamBatchJob(attemptId, userId)
    }

    // Process now if requested
    if (body.processNow !== false) {
      const result = await ddlBatchService.processBatchJob(jobId)
      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: 'pending',
        message: 'Batch job created. Analysis will be processed.',
      },
    })
  } catch (error) {
    console.error('DDL Exam Analysis Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger exam DDL analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
