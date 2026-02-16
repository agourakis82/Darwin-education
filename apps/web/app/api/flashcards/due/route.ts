import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isSchemaDriftError } from '@/lib/supabase/errors'
import { getSessionUserSummary } from '@/lib/auth/session'

interface DueCard {
  id: string
  front: string
  back: string
  deckId: string
  deckName: string
  area: string | null
  topic: string | null
  questionId: string | null
  state: string
  dueDate: string
  daysPastDue: number
}

/**
 * GET /api/flashcards/due
 * Get all flashcards due for review
 *
 * Query params:
 *   - limit: number (default 50)
 *   - deckId: string (optional, filter by deck)
 *   - area: string (optional, filter by area)
 *
 * Returns: { cards: DueCard[], total: number }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const user = await getSessionUserSummary(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const deckId = searchParams.get('deckId')
    const area = searchParams.get('area')

    const now = new Date().toISOString()

    // Build query for flashcards with review states
    // Try the new table first
    let query = supabase
      .from('flashcards')
      .select(`
        id,
        front,
        back,
        deck_id,
        area,
        topic,
        question_id,
        flashcard_decks!inner(id, name),
        flashcard_review_states!left(
          next_review_at,
          fsrs_state,
          last_review_at
        )
      `)

    if (deckId) {
      query = query.eq('deck_id', deckId)
    }

    if (area) {
      query = query.eq('area', area)
    }

    // Get cards that belong to user's decks
    query = query.eq('flashcard_decks.user_id', user.id)

    const { data: cards, error: cardsError } = await query.limit(limit * 2) // Get extra to filter

    if (cardsError) {
      // Try with legacy table
      const legacyQuery = supabase
        .from('flashcards')
        .select(`
          id,
          front,
          back,
          deck_id,
          area,
          topic,
          question_id,
          flashcard_decks!inner(id, name, user_id),
          flashcard_sm2_states!left(
            next_review_at,
            last_review_at,
            repetitions
          )
        `)
        .eq('flashcard_decks.user_id', user.id)
        .limit(limit * 2)

      const { data: legacyCards, error: legacyError } = await legacyQuery

      if (legacyError) {
        if (isSchemaDriftError(cardsError) || isSchemaDriftError(legacyError)) {
          return NextResponse.json({
            cards: [],
            total: 0,
            warning: 'Estados de revisão indisponíveis (schema em migração).',
          })
        }

        console.error('Error fetching due cards:', legacyError)
        return NextResponse.json({ cards: [], total: 0, warning: 'Falha ao carregar flashcards.' })
      }

      // Process legacy cards
      const dueCards = processDueCards(legacyCards || [], now, limit, true)
      return NextResponse.json({
        cards: dueCards,
        total: dueCards.length,
      })
    }

    // Process cards with new schema
    const dueCards = processDueCards(cards || [], now, limit, false)

    return NextResponse.json({
      cards: dueCards,
      total: dueCards.length,
    })
  } catch (error) {
    console.error('Due cards API error:', error)
    return NextResponse.json({ cards: [], total: 0, warning: 'Falha ao carregar flashcards.' })
  }
}

function processDueCards(
  cards: any[],
  now: string,
  limit: number,
  isLegacy: boolean
): DueCard[] {
  const nowDate = new Date(now)

  return cards
    .map((card) => {
      const reviewState = isLegacy
        ? card.flashcard_sm2_states?.[0]
        : card.flashcard_review_states?.[0]

      const nextReview = reviewState?.next_review_at
      const isNew = !reviewState || !reviewState.last_review_at

      // Card is due if: new, or next_review_at <= now
      const isDue = isNew || (nextReview && new Date(nextReview) <= nowDate)

      if (!isDue) return null

      const dueDate = isNew ? now : nextReview
      const daysPastDue = isNew
        ? 0
        : Math.max(
            0,
            Math.floor(
              (nowDate.getTime() - new Date(dueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )

      return {
        id: card.id,
        front: card.front,
        back: card.back,
        deckId: card.deck_id,
        deckName: card.flashcard_decks?.name || 'Unknown',
        area: card.area,
        topic: card.topic,
        questionId: card.question_id,
        state: isNew ? 'new' : (reviewState?.fsrs_state || 'review'),
        dueDate,
        daysPastDue,
      } as DueCard
    })
    .filter((card): card is DueCard => card !== null)
    .sort((a, b) => {
      // Sort by: new cards first, then by days past due (descending)
      if (a.state === 'new' && b.state !== 'new') return -1
      if (a.state !== 'new' && b.state === 'new') return 1
      return b.daysPastDue - a.daysPastDue
    })
    .slice(0, limit)
}
