// ============================================================
// STATISTICAL CURATION API ROUTE
// Cron job to flag questions with anomalous IRT parameters
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Thresholds for flagging questions.
 */
const CURATION_THRESHOLDS = {
  // Outfit > 1.5 indicates erratic/unpredictable responses
  // (high-ability students getting it wrong unexpectedly)
  OUTFIT_MAX: 1.5,
  
  // Infit < 0.5 indicates over-deterministic items
  // (too easy, not discriminating)
  INFIT_MIN: 0.5,
  
  // Minimum responses before statistical analysis is meaningful
  MIN_RESPONSES: 30,
  
  // Extremely low correct rate for high-ability students (bottom 5%)
  HIGH_ABILITY_CORRECT_MIN: 0.3,
}

interface CurationStats {
  totalAnalyzed: number
  flaggedForOutfit: number
  flaggedForInfit: number
  flaggedForLowDiscrimination: number
  errors: string[]
}

/**
 * POST /api/admin/curation
 *
 * Cron job endpoint to analyze question performance and flag items
 * for manual review based on IRT statistical anomalies.
 *
 * Security: Should be called with CRON_SECRET header or admin auth.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify cron secret or admin auth
    const cronSecret = request.headers.get('x-cron-secret')
    const authHeader = request.headers.get('authorization')
    
    const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET
    const isValidAuth = authHeader === `Bearer ${process.env.ADMIN_API_KEY}`
    
    if (!isValidCron && !isValidAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats: CurationStats = {
      totalAnalyzed: 0,
      flaggedForOutfit: 0,
      flaggedForInfit: 0,
      flaggedForLowDiscrimination: 0,
      errors: [],
    }

    // Step 1: Get questions with sufficient response data
    // Join with irt_response_log to get response counts
    const { data: questionStats, error: statsError } = await (supabase as any)
      .rpc('get_question_curation_stats', {
        min_responses: CURATION_THRESHOLDS.MIN_RESPONSES,
      })

    if (statsError) {
      // If RPC doesn't exist, fall back to direct query
      console.warn('RPC not available, using fallback query')
      
      const { data: questions, error: queryError } = await (supabase as any)
        .from('questions')
        .select(`
          id,
          irt_outfit,
          irt_infit,
          irt_discrimination,
          validation_status,
          flagged_for_review
        `)
        .not('irt_outfit', 'is', null)
        .not('irt_infit', 'is', null)
        .eq('validation_status', 'approved')

      if (queryError) {
        console.error('Error fetching questions:', queryError)
        return NextResponse.json(
          { error: 'Failed to fetch question stats', details: queryError },
          { status: 500 }
        )
      }

      stats.totalAnalyzed = questions?.length || 0

      // Analyze each question
      const flaggedIds: string[] = []
      
      for (const q of questions || []) {
        const issues: string[] = []
        
        // Check outfit (erratic responses)
        if (q.irt_outfit > CURATION_THRESHOLDS.OUTFIT_MAX) {
          issues.push(`High outfit: ${q.irt_outfit.toFixed(3)} > ${CURATION_THRESHOLDS.OUTFIT_MAX}`)
          stats.flaggedForOutfit++
        }
        
        // Check infit (over-deterministic)
        if (q.irt_infit < CURATION_THRESHOLDS.INFIT_MIN) {
          issues.push(`Low infit: ${q.irt_infit.toFixed(3)} < ${CURATION_THRESHOLDS.INFIT_MIN}`)
          stats.flaggedForInfit++
        }
        
        // Check discrimination (if available)
        if (q.irt_discrimination !== null && q.irt_discrimination < 0.5) {
          issues.push(`Low discrimination: ${q.irt_discrimination.toFixed(3)} < 0.5`)
          stats.flaggedForLowDiscrimination++
        }
        
        // Flag if any issues found
        if (issues.length > 0 && !q.flagged_for_review) {
          flaggedIds.push(q.id)
        }
      }

      // Batch update flagged questions
      if (flaggedIds.length > 0) {
        const { error: updateError } = await (supabase as any)
          .from('questions')
          .update({
            flagged_for_review: true,
            flagged_at: new Date().toISOString(),
            flag_reason: 'Statistical anomaly detected by curation job',
          })
          .in('id', flaggedIds)

        if (updateError) {
          stats.errors.push(`Failed to update flags: ${updateError.message}`)
        }
      }
    } else {
      // Use RPC results
      stats.totalAnalyzed = questionStats?.length || 0
      
      const flaggedItems = (questionStats || []).filter((q: any) => 
        q.irt_outfit > CURATION_THRESHOLDS.OUTFIT_MAX ||
        q.irt_infit < CURATION_THRESHOLDS.INFIT_MIN
      )

      if (flaggedItems.length > 0) {
        const flaggedIds = flaggedItems.map((q: any) => q.id)
        
        const { error: updateError } = await (supabase as any)
          .from('questions')
          .update({
            flagged_for_review: true,
            flagged_at: new Date().toISOString(),
            flag_reason: 'Statistical anomaly detected by curation job',
          })
          .in('id', flaggedIds)

        if (updateError) {
          stats.errors.push(`Failed to update flags: ${updateError.message}`)
        }
        
        stats.flaggedForOutfit = flaggedItems.filter(
          (q: any) => q.irt_outfit > CURATION_THRESHOLDS.OUTFIT_MAX
        ).length
        stats.flaggedForInfit = flaggedItems.filter(
          (q: any) => q.irt_infit < CURATION_THRESHOLDS.INFIT_MIN
        ).length
      }
    }

    // Log curation run
    await (supabase as any).from('curation_logs').insert({
      run_at: new Date().toISOString(),
      stats,
      thresholds: CURATION_THRESHOLDS,
    }).catch((err: Error) => {
      // Non-critical - just log
      console.warn('Failed to log curation run:', err.message)
    })

    return NextResponse.json({
      success: true,
      stats,
      thresholds: CURATION_THRESHOLDS,
      runAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Curation job error:', error)
    return NextResponse.json(
      {
        error: 'Curation job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/curation
 *
 * Get the latest curation run stats.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get latest curation log
    const { data: latestLog, error } = await (supabase as any)
      .from('curation_logs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching curation log:', error)
    }

    // Get current flagged count
    const { count: flaggedCount, error: countError } = await (supabase as any)
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('flagged_for_review', true)

    return NextResponse.json({
      latestRun: latestLog || null,
      currentFlaggedCount: flaggedCount || 0,
      thresholds: CURATION_THRESHOLDS,
    })
  } catch (error) {
    console.error('Error fetching curation stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curation stats' },
      { status: 500 }
    )
  }
}
