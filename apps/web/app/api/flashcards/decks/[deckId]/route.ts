import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'
import { isSchemaDriftError } from '@/lib/supabase/errors'
import { getSessionUserSummary } from '@/lib/auth/session'

type DeckRow = {
  id: string
  user_id: string | null
  name: string
  description: string | null
  area: string | null
  is_public?: boolean | null
  is_system?: boolean | null
  created_at: string
}

type CardRow = {
  id: string
  front: string
  back: string
  created_at: string | null
}

type ReviewStateRow = {
  card_id: string
  ease_factor: number | null
  interval_days: number | null
  repetitions: number | null
  next_review_at: string | null
  last_review_at: string | null
}

type LegacyStateRow = {
  card_id: string
  ease_factor: number | null
  interval_days: number | null
  repetitions: number | null
  next_review_at: string | null
  last_review_at: string | null
}

function normalizeDeck(deck: DeckRow) {
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    area: deck.area,
    createdAt: deck.created_at,
    isSystem: Boolean(deck.is_system) || (deck.user_id == null && Boolean(deck.is_public)),
    isPublic: Boolean(deck.is_public),
  }
}

function normalizeCard({
  card,
  state,
  now,
}: {
  card: CardRow
  state?: ReviewStateRow | LegacyStateRow | null
  now: Date
}) {
  const lastReviewAt = state?.last_review_at ?? null
  const nextReviewAt = state?.next_review_at ?? null
  const isNew = !lastReviewAt
  const effectiveNextReviewAt = nextReviewAt || now.toISOString()
  const isDue = isNew || new Date(effectiveNextReviewAt) <= now

  return {
    id: card.id,
    front: card.front,
    back: card.back,
    createdAt: card.created_at,
    repetitions: state?.repetitions ?? 0,
    intervalDays: state?.interval_days ?? 0,
    easeFactor: state?.ease_factor ?? 2.5,
    nextReviewAt: effectiveNextReviewAt,
    lastReviewAt,
    isDue,
    isNew,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params
  const supabase = await createServerClient()

  const user = await getSessionUserSummary(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deckResult = await (supabase.from('flashcard_decks') as any)
    .select('id,user_id,name,description,area,is_system,is_public,created_at')
    .eq('id', deckId)
    .maybeSingle()

  if (deckResult.error && isSchemaDriftError(deckResult.error)) {
    return NextResponse.json(
      { error: 'Deck unavailable (schema drift)' },
      { status: 404 }
    )
  }

  const deckRow = (deckResult.data as DeckRow | null) || null
  if (!deckRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const deck = normalizeDeck(deckRow)

  const canAccess =
    deckRow.user_id === user.id || Boolean(deckRow.is_public) || Boolean(deckRow.is_system)
  if (!canAccess) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const cardsResult = await supabase
    .from('flashcards')
    .select('id,front,back,created_at')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true })
    .limit(10_000)

  if (cardsResult.error && isSchemaDriftError(cardsResult.error)) {
    return NextResponse.json({
      deck,
      cards: [],
      summary: {
        cardCount: 0,
        dueCount: 0,
      },
      warning: 'Cards indisponíveis neste ambiente (schema em migração).',
    })
  }

  const cards = ((cardsResult.data || []) as CardRow[]).filter(Boolean)
  const cardIds = cards.map((card) => card.id)

  const stateResult = await loadDeckStates({ supabase, userId: user.id, cardIds })
  const stateByCardId = new Map<string, ReviewStateRow | LegacyStateRow>()
  for (const row of stateResult.rows) {
    stateByCardId.set(row.card_id, row)
  }

  const now = new Date()
  const normalizedCards = cards.map((card) =>
    normalizeCard({ card, state: stateByCardId.get(card.id) || null, now })
  )

  const dueCount = normalizedCards.reduce((sum, card) => sum + (card.isDue ? 1 : 0), 0)

  return NextResponse.json({
    deck,
    cards: normalizedCards,
    summary: {
      cardCount: normalizedCards.length,
      dueCount,
    },
    warning: stateResult.warning,
  })
}

async function loadDeckStates({
  supabase,
  userId,
  cardIds,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>
  userId: string
  cardIds: string[]
}): Promise<
  | { source: 'review'; rows: ReviewStateRow[]; warning?: string }
  | { source: 'legacy'; rows: LegacyStateRow[]; warning?: string }
  | { source: 'none'; rows: []; warning?: string }
> {
  if (cardIds.length === 0) {
    return { source: 'none', rows: [] }
  }

  const reviewAttempt = await (supabase.from('flashcard_review_states') as any)
    .select('card_id,ease_factor,interval_days,repetitions,next_review_at,last_review_at')
    .eq('user_id', userId)
    .in('card_id', cardIds)

  if (!reviewAttempt.error) {
    return { source: 'review', rows: (reviewAttempt.data || []) as ReviewStateRow[] }
  }

  const legacyAttempt = await (supabase.from('flashcard_sm2_states' as any) as any)
    .select('card_id,ease_factor,interval_days,repetitions,next_review_at,last_review_at')
    .eq('user_id', userId)
    .in('card_id', cardIds)

  if (!legacyAttempt.error) {
    return { source: 'legacy', rows: (legacyAttempt.data || []) as LegacyStateRow[] }
  }

  if (isSchemaDriftError(reviewAttempt.error) || isSchemaDriftError(legacyAttempt.error)) {
    return {
      source: 'none',
      rows: [],
      warning: 'Estados de revisão indisponíveis (schema em migração).',
    }
  }

  return {
    source: 'none',
    rows: [],
    warning: 'Estados de revisão indisponíveis.',
  }
}
