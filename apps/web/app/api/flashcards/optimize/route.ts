import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { FSRS } from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'

/**
 * POST /api/flashcards/optimize
 * Optimize FSRS weights based on user's review history.
 *
 * Body: { forceReoptimize?: boolean }
 * Returns: FSRSOptimizerResult
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const forceReoptimize = body.forceReoptimize === true

    // Check cooldown (24 hours) unless forced
    if (!forceReoptimize) {
      const { data: existing } = await (supabase
        .from('user_fsrs_weights' as any) as any)
        .select('updated_at')
        .eq('user_id', user.id)
        .single() as { data: { updated_at: string } | null; error: any }

      if (existing?.updated_at) {
        const lastOptimized = new Date(existing.updated_at)
        const hoursSince = (Date.now() - lastOptimized.getTime()) / (1000 * 60 * 60)
        if (hoursSince < 24) {
          return NextResponse.json(
            { error: `Optimization available in ${Math.ceil(24 - hoursSince)} hours` },
            { status: 429 }
          )
        }
      }
    }

    // Load review logs
    const { data: logs, error: logsError } = await (supabase
      .from('flashcard_review_logs' as any) as any)
      .select('card_id, rating, elapsed_days, state, reviewed_at')
      .eq('user_id', user.id)
      .order('reviewed_at', { ascending: true }) as {
        data: Array<{
          card_id: string
          rating: number
          elapsed_days: number
          state: string
          reviewed_at: string
        }> | null
        error: any
      }

    if (logsError) {
      console.error('Error loading review logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to load review history' },
        { status: 500 }
      )
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: 'No review history found. Complete at least 50 reviews first.' },
        { status: 400 }
      )
    }

    // Convert to training samples
    const samples: FSRS.FSRSTrainingSample[] = logs.map(log => ({
      cardId: log.card_id,
      rating: log.rating as FSRS.FSRSRating,
      elapsedDays: Number(log.elapsed_days) || 0,
      state: log.state as FSRS.FSRSTrainingSample['state'],
      reviewDate: new Date(log.reviewed_at),
    }))

    // Run optimizer
    const result = FSRS.optimizeParameters(samples)

    // Upsert weights
    const { error: upsertError } = await (supabase
      .from('user_fsrs_weights' as any) as any)
      .upsert({
        user_id: user.id,
        weights: result.weights,
        optimizer_result: {
          logLoss: result.logLoss,
          defaultLogLoss: result.defaultLogLoss,
          improvementRatio: result.improvementRatio,
          iterations: result.iterations,
          converged: result.converged,
          trainingSamples: result.trainingSamples,
          uniqueCards: result.uniqueCards,
          durationMs: result.durationMs,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Error saving weights:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save optimized weights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Optimize API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
