// ============================================================
// DDL BATCH API ROUTE
// POST /api/ddl/batch - Create and optionally process batch job
// GET /api/ddl/batch - Get batch job status
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ddlBatchService } from '@/lib/ddl/services/batch-service'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * POST /api/ddl/batch
 *
 * Create a batch job for DDL analysis
 *
 * Body options:
 * 1. { examAttemptId: string } - Create batch from exam attempt
 * 2. { responseIds: string[] } - Create batch from manual selection
 * 3. { jobId: string, action: 'process' } - Process existing batch job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check for service role key (for cron jobs) or user auth
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

    const body = await request.json()

    // Option 1: Process existing batch job
    if (body.jobId && body.action === 'process') {
      const result = await ddlBatchService.processBatchJob(body.jobId)
      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Option 2: Create batch from exam attempt
    if (body.examAttemptId) {
      const jobId = await ddlBatchService.createExamBatchJob(
        body.examAttemptId,
        userId
      )

      // Optionally process immediately
      if (body.processNow) {
        const result = await ddlBatchService.processBatchJob(jobId)
        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      return NextResponse.json({
        success: true,
        data: { jobId },
        message: 'Batch job created. Use action=process to start processing.',
      })
    }

    // Option 3: Create batch from manual selection
    if (body.responseIds && Array.isArray(body.responseIds)) {
      const jobId = await ddlBatchService.createManualBatchJob(
        body.responseIds,
        userId,
        body.batchName
      )

      // Optionally process immediately
      if (body.processNow) {
        const result = await ddlBatchService.processBatchJob(jobId)
        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      return NextResponse.json({
        success: true,
        data: { jobId },
        message: 'Batch job created. Use action=process to start processing.',
      })
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide examAttemptId, responseIds, or jobId with action.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('DDL Batch API Error:', error)
    return NextResponse.json(
      {
        error: 'Batch operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ddl/batch?jobId=xxx
 *
 * Get batch job status
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const examAttemptId = searchParams.get('examAttemptId')

    if (jobId) {
      const job = await ddlBatchService.getBatchJobStatus(jobId)
      if (!job) {
        return NextResponse.json(
          { error: 'Batch job not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: job })
    }

    if (examAttemptId) {
      const summary = await ddlBatchService.getExamDDLSummary(examAttemptId)
      return NextResponse.json({ success: true, data: summary })
    }

    // Return list of pending jobs
    const pendingJobs = await ddlBatchService.getPendingBatchJobs()
    return NextResponse.json({
      success: true,
      data: { pendingJobs },
    })
  } catch (error) {
    console.error('DDL Batch Status Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get batch status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
