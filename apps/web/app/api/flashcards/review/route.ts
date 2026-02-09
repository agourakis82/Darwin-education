import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { FSRS } from '@darwin-education/shared'

type FSRSCard = FSRS.FSRSCard
type FSRSRating = FSRS.FSRSRating
const { scheduleCard, createFSRSCard } = FSRS

/**
 * POST /api/flashcards/review
 * Submit a flashcard review with FSRS-6 algorithm
 *
 * Body: { cardId: string, rating: 1|2|3|4 }
 * Returns: { success: true, nextReview: Date, card: FSRSCard }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { cardId, rating } = body as { cardId: string; rating: FSRSRating }

    if (!cardId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json(
        { error: 'Invalid request: cardId and rating (1-4) required' },
        { status: 400 }
      )
    }

    // Define the state type
    interface ReviewState {
      fsrs_difficulty?: number
      fsrs_stability?: number
      fsrs_reps?: number
      fsrs_lapses?: number
      fsrs_state?: string
      last_review_at?: string
      next_review_at?: string
      repetitions?: number
    }

    // Get current card state (using the renamed table from migration 005)
    // First try flashcard_review_states, fall back to flashcard_sm2_states
    let { data: state, error: stateError } = await (supabase
      .from('flashcard_review_states') as any)
      .select('*')
      .eq('card_id', cardId)
      .eq('user_id', user.id)
      .single() as { data: ReviewState | null; error: any }

    // If table doesn't exist or no state found, try legacy table
    if (stateError) {
      const legacyResult = await (supabase
        .from('flashcard_sm2_states') as any)
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .single() as { data: ReviewState | null; error: any }

      if (!legacyResult.error) {
        state = legacyResult.data
      }
    }

    const now = new Date()
    let fsrsCard: FSRSCard

    if (!state) {
      // New card - create initial state
      fsrsCard = createFSRSCard()
    } else {
      // Existing card - reconstruct FSRS state
      fsrsCard = {
        difficulty: state.fsrs_difficulty ?? 5,
        stability: state.fsrs_stability ?? 0,
        reps: state.fsrs_reps ?? state.repetitions ?? 0,
        lapses: state.fsrs_lapses ?? 0,
        state: (state.fsrs_state as FSRSCard['state']) ?? 'new',
        lastReview: state.last_review_at ? new Date(state.last_review_at) : now,
        due: state.next_review_at ? new Date(state.next_review_at) : now,
      }
    }

    // Load user-specific FSRS weights (if optimizer has run)
    let fsrsParams = FSRS.DEFAULT_FSRS_PARAMETERS
    try {
      const { data: userWeights } = await (supabase
        .from('user_fsrs_weights') as any)
        .select('weights')
        .eq('user_id', user.id)
        .single() as { data: { weights: number[] } | null; error: any }

      if (userWeights?.weights?.length === 21) {
        fsrsParams = { ...FSRS.DEFAULT_FSRS_PARAMETERS, w: userWeights.weights }
      }
    } catch {
      // Fall back to defaults if table doesn't exist
    }

    // Schedule next review using FSRS-6
    const elapsed = fsrsCard.state === 'new' ? 0 :
      Math.max(0, Math.round((now.getTime() - fsrsCard.lastReview.getTime()) / (1000 * 60 * 60 * 24)))
    const { card: updatedCard, log } = scheduleCard(fsrsCard, rating, now, fsrsParams)

    // Upsert the review state
    const upsertData = {
      user_id: user.id,
      card_id: cardId,
      // FSRS columns
      fsrs_difficulty: updatedCard.difficulty,
      fsrs_stability: updatedCard.stability,
      fsrs_reps: updatedCard.reps,
      fsrs_lapses: updatedCard.lapses,
      fsrs_state: updatedCard.state,
      algorithm: 'fsrs',
      // Common columns
      next_review_at: updatedCard.due.toISOString(),
      last_review_at: now.toISOString(),
      // SM-2 compatibility columns (deprecated but kept for migration)
      ease_factor: 2.5,
      interval_days: log.scheduled_days,
      repetitions: updatedCard.reps,
    }

    // Try new table first, fall back to legacy
    let upsertError
    const { error: newTableError } = await (supabase
      .from('flashcard_review_states') as any)
      .upsert(upsertData, { onConflict: 'user_id,card_id' })

    if (newTableError) {
      // Try legacy table
      const { error: legacyError } = await (supabase
        .from('flashcard_sm2_states') as any)
        .upsert({
          user_id: user.id,
          card_id: cardId,
          ease_factor: 2.5,
          interval_days: log.scheduled_days,
          repetitions: updatedCard.reps,
          next_review_at: updatedCard.due.toISOString(),
          last_review_at: now.toISOString(),
        }, { onConflict: 'user_id,card_id' })

      upsertError = legacyError
    }

    if (upsertError) {
      console.error('Error saving review state:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save review' },
        { status: 500 }
      )
    }

    // Log review event for optimizer (fire-and-forget)
    try {
      await (supabase.from('flashcard_review_logs') as any).insert({
        user_id: user.id,
        card_id: cardId,
        rating,
        state: fsrsCard.state,
        elapsed_days: elapsed,
        stability_after: updatedCard.stability,
        difficulty_after: updatedCard.difficulty,
        scheduled_days: log.scheduled_days,
      })
    } catch {
      // Non-critical — don't fail the review if logging fails
    }

    // Track study activity for streak calculation
    // Try to use the RPC function, fall back to direct upsert if it doesn't exist
    const today = now.toISOString().split('T')[0]
    try {
      const { error: rpcError } = await (supabase as any).rpc('update_study_activity', {
        p_user_id: user.id,
        p_exams: 0,
        p_flashcards: 1,
        p_questions: 0,
        p_time_seconds: 0,
      })

      if (rpcError) {
        // Fall back to direct upsert if RPC doesn't exist
        await (supabase
          .from('study_activity') as any)
          .upsert({
            user_id: user.id,
            activity_date: today,
            flashcards_reviewed: 1,
          }, {
            onConflict: 'user_id,activity_date',
          })
      }
    } catch {
      // Ignore errors - study activity is non-critical
    }

    return NextResponse.json({
      success: true,
      nextReview: updatedCard.due,
      scheduledDays: log.scheduled_days,
      card: {
        state: updatedCard.state,
        difficulty: updatedCard.difficulty,
        stability: updatedCard.stability,
        reps: updatedCard.reps,
        lapses: updatedCard.lapses,
      },
    })
  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
