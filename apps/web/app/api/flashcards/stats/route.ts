import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface FlashcardStats {
  total: number
  new: number
  learning: number
  review: number
  relearning: number
  dueToday: number
  dueThisWeek: number
  streakDays: number
  reviewsToday: number
  averageRetention: number
}

/**
 * GET /api/flashcards/stats
 * Get flashcard statistics for the current user
 *
 * Returns: FlashcardStats
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Get user's flashcards with review states
    // Try new table first
    let { data: cards, error: cardsError } = await supabase
      .from('flashcards')
      .select(`
        id,
        flashcard_decks!inner(user_id),
        flashcard_review_states!left(
          next_review_at,
          fsrs_state,
          last_review_at,
          fsrs_reps
        )
      `)
      .eq('flashcard_decks.user_id', user.id)

    // Fallback to legacy table
    if (cardsError) {
      const legacyResult = await supabase
        .from('flashcards')
        .select(`
          id,
          flashcard_decks!inner(user_id),
          flashcard_sm2_states!left(
            next_review_at,
            last_review_at,
            repetitions
          )
        `)
        .eq('flashcard_decks.user_id', user.id)

      if (legacyResult.error) {
        console.error('Error fetching stats:', legacyResult.error)
        return NextResponse.json(
          { error: 'Failed to fetch stats' },
          { status: 500 }
        )
      }

      cards = legacyResult.data
    }

    if (!cards) cards = []

    // Calculate stats
    let newCount = 0
    let learningCount = 0
    let reviewCount = 0
    let relearningCount = 0
    let dueToday = 0
    let dueThisWeek = 0
    let reviewsToday = 0
    let totalRetention = 0
    let retentionCount = 0

    for (const card of cards) {
      const state = (card as any).flashcard_review_states?.[0] ||
                    (card as any).flashcard_sm2_states?.[0]

      if (!state || !state.last_review_at) {
        // New card (never reviewed)
        newCount++
        dueToday++
        dueThisWeek++
        continue
      }

      const fsrsState = state.fsrs_state || 'review'
      const nextReview = new Date(state.next_review_at)
      const lastReview = new Date(state.last_review_at)

      // Count by state
      switch (fsrsState) {
        case 'new':
          newCount++
          break
        case 'learning':
          learningCount++
          break
        case 'relearning':
          relearningCount++
          break
        default:
          reviewCount++
      }

      // Due calculations
      if (nextReview <= now) {
        dueToday++
        dueThisWeek++
      } else if (nextReview <= weekEnd) {
        dueThisWeek++
      }

      // Reviews today
      if (lastReview >= todayStart) {
        reviewsToday++
      }

      // Rough retention estimate (based on review count)
      const reps = state.fsrs_reps || state.repetitions || 0
      if (reps > 0) {
        // Cards with more reviews have higher retention estimate
        const estimatedRetention = Math.min(0.95, 0.6 + (reps * 0.05))
        totalRetention += estimatedRetention
        retentionCount++
      }
    }

    // Calculate streak (simplified - count consecutive days with reviews)
    const { data: recentReviews } = await (supabase
      .from('flashcard_review_states') as any)
      .select('last_review_at')
      .eq('user_id', user.id)
      .not('last_review_at', 'is', null)
      .order('last_review_at', { ascending: false })
      .limit(30) as { data: { last_review_at: string }[] | null }

    let streakDays = 0
    if (recentReviews && recentReviews.length > 0) {
      const dates = new Set<string>()
      for (const review of recentReviews) {
        if (review.last_review_at) {
          const date = new Date(review.last_review_at).toDateString()
          dates.add(date)
        }
      }

      // Count consecutive days from today
      const checkDate = new Date(todayStart)
      while (dates.has(checkDate.toDateString())) {
        streakDays++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    const stats: FlashcardStats = {
      total: cards.length,
      new: newCount,
      learning: learningCount,
      review: reviewCount,
      relearning: relearningCount,
      dueToday,
      dueThisWeek,
      streakDays,
      reviewsToday,
      averageRetention: retentionCount > 0
        ? Math.round((totalRetention / retentionCount) * 100)
        : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
