// ============================================================
// DDL BATCH SERVICE
// Batch processing for DDL analysis after exam completion
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ddlService } from './ddl-service'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface BatchJob {
  id: string
  batch_name: string
  source_type: string
  source_id: string | null
  status: BatchStatus
  total_items: number
  processed_items: number
  failed_items: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

export interface BatchItem {
  item_id: string
  response_id: string
  question_id: string
  response_text: string
  behavioral_data: any
  question_text: string
  reference_answer: string
  key_concepts: any[]
  required_integrations: any[]
  discipline: string
  topic: string
  difficulty_level: number
  cognitive_level: string
}

export interface BatchProcessingResult {
  jobId: string
  totalItems: number
  processedItems: number
  failedItems: number
  status: BatchStatus
}

// ============================================================
// DDL BATCH SERVICE CLASS
// ============================================================

export class DDLBatchService {
  private supabase: SupabaseClient<any, any, any>

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // ============================================================
  // CREATE BATCH JOB FROM EXAM
  // ============================================================

  /**
   * Create a batch job for all DDL responses in an exam attempt
   */
  async createExamBatchJob(
    examAttemptId: string,
    userId: string
  ): Promise<string> {
    // Get all DDL responses for this exam attempt
    const { data: examDdlResponses, error: fetchError } = await this.supabase
      .from('exam_ddl_responses')
      .select('ddl_response_id')
      .eq('exam_attempt_id', examAttemptId)

    if (fetchError) throw fetchError

    if (!examDdlResponses || examDdlResponses.length === 0) {
      throw new Error('No DDL responses found for this exam attempt')
    }

    // Create batch job
    const { data: job, error: jobError } = await this.supabase
      .from('ddl_batch_jobs')
      .insert({
        batch_name: `Exam Analysis - ${examAttemptId.slice(0, 8)}`,
        created_by: userId,
        source_type: 'exam',
        source_id: examAttemptId,
        status: 'pending',
        total_items: examDdlResponses.length,
      })
      .select('id')
      .single()

    if (jobError) throw jobError

    // Create batch items
    const batchItems = examDdlResponses.map((edr: any) => ({
      batch_job_id: job.id,
      response_id: edr.ddl_response_id,
      status: 'pending',
    }))

    const { error: itemsError } = await this.supabase
      .from('ddl_batch_items')
      .insert(batchItems)

    if (itemsError) throw itemsError

    // Initialize exam DDL summary
    await this.supabase
      .from('exam_ddl_summary')
      .insert({
        exam_attempt_id: examAttemptId,
        user_id: userId,
        batch_job_id: job.id,
        total_ddl_questions: examDdlResponses.length,
      })

    return job.id
  }

  // ============================================================
  // PROCESS BATCH JOB
  // ============================================================

  /**
   * Process a batch job - analyzes all pending items
   * For large batches, this should be called by a cron job or queue worker
   */
  async processBatchJob(jobId: string): Promise<BatchProcessingResult> {
    // Update job status to processing
    await this.supabase
      .from('ddl_batch_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    let processedCount = 0
    let failedCount = 0
    let hasMoreItems = true

    while (hasMoreItems) {
      // Get pending items (in batches of 10 for memory management)
      const { data: items, error: fetchError } = await this.supabase
        .rpc('get_pending_batch_items', {
          p_batch_job_id: jobId,
          p_limit: 10,
        })

      if (fetchError) {
        console.error('Error fetching batch items:', fetchError)
        break
      }

      if (!items || items.length === 0) {
        hasMoreItems = false
        break
      }

      // Process each item
      for (const item of items as BatchItem[]) {
        try {
          // Run DDL analysis
          const result = await ddlService.analyzeResponse(item.response_id)

          // Update batch item with results
          await this.supabase
            .from('ddl_batch_items')
            .update({
              status: 'completed',
              classification_id: result.classification.primary_type ? undefined : undefined, // Get from DB
              feedback_id: result.feedbackId,
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.item_id)

          processedCount++
        } catch (error) {
          console.error(`Error processing item ${item.item_id}:`, error)

          // Update batch item with error
          await this.supabase
            .from('ddl_batch_items')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.item_id)

          failedCount++
        }

        // Update job progress
        await this.supabase
          .from('ddl_batch_jobs')
          .update({
            processed_items: processedCount,
            failed_items: failedCount,
          })
          .eq('id', jobId)
      }
    }

    // Get final job status
    const { data: job } = await this.supabase
      .from('ddl_batch_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    const finalStatus: BatchStatus =
      failedCount === job?.total_items
        ? 'failed'
        : 'completed'

    // Update job as completed
    await this.supabase
      .from('ddl_batch_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Update exam DDL summary if this was an exam batch
    if (job?.source_type === 'exam' && job.source_id) {
      await this.supabase.rpc('update_exam_ddl_summary', {
        p_exam_attempt_id: job.source_id,
      })
    }

    return {
      jobId,
      totalItems: job?.total_items || 0,
      processedItems: processedCount,
      failedItems: failedCount,
      status: finalStatus,
    }
  }

  // ============================================================
  // GET BATCH JOB STATUS
  // ============================================================

  async getBatchJobStatus(jobId: string): Promise<BatchJob | null> {
    const { data, error } = await this.supabase
      .from('ddl_batch_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) return null
    return data
  }

  // ============================================================
  // GET EXAM DDL SUMMARY
  // ============================================================

  async getExamDDLSummary(examAttemptId: string): Promise<any> {
    const { data: summary, error: summaryError } = await this.supabase
      .from('exam_ddl_summary')
      .select('*')
      .eq('exam_attempt_id', examAttemptId)
      .single()

    if (summaryError) return null

    // Get individual response details
    const { data: responses, error: responsesError } = await this.supabase
      .from('exam_ddl_responses')
      .select(`
        question_order,
        ddl_question_id,
        ddl_response_id,
        ddl_questions!inner(question_code, question_text, topic),
        ddl_responses!inner(response_text),
        ddl_classification(
          primary_lacuna_type,
          primary_confidence,
          primary_probability
        ),
        ddl_feedback(id, feedback_type)
      `)
      .eq('exam_attempt_id', examAttemptId)
      .order('question_order')

    return {
      summary,
      responses: responsesError ? [] : responses,
    }
  }

  // ============================================================
  // CREATE MANUAL BATCH JOB
  // ============================================================

  /**
   * Create a batch job for manually selected responses
   */
  async createManualBatchJob(
    responseIds: string[],
    userId: string,
    batchName?: string
  ): Promise<string> {
    // Create batch job
    const { data: job, error: jobError } = await this.supabase
      .from('ddl_batch_jobs')
      .insert({
        batch_name: batchName || `Manual Batch - ${new Date().toISOString()}`,
        created_by: userId,
        source_type: 'manual',
        status: 'pending',
        total_items: responseIds.length,
      })
      .select('id')
      .single()

    if (jobError) throw jobError

    // Create batch items
    const batchItems = responseIds.map((responseId) => ({
      batch_job_id: job.id,
      response_id: responseId,
      status: 'pending',
    }))

    const { error: itemsError } = await this.supabase
      .from('ddl_batch_items')
      .insert(batchItems)

    if (itemsError) throw itemsError

    return job.id
  }

  // ============================================================
  // GET PENDING BATCH JOBS
  // ============================================================

  async getPendingBatchJobs(): Promise<BatchJob[]> {
    const { data, error } = await this.supabase
      .from('ddl_batch_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) return []
    return data || []
  }
}

// Export singleton instance
export const ddlBatchService = new DDLBatchService()
