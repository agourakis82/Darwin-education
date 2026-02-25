import { NextResponse } from 'next/server'
import type { PostgrestError } from '@supabase/supabase-js'

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
  deck_id: string
}

type ReviewStateRow = {
  card_id: string
  next_review_at: string | null
  last_review_at: string | null
}

type LegacyStateRow = {
  card_id: string
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

function pickDeckQueryError(
  errorA: PostgrestError | null,
  errorB: PostgrestError | null,
  errorC: PostgrestError | null
) {
  return errorA || errorB || errorC || null
}

export async function GET() {
  const supabase = await createServerClient()

  const user = await getSessionUserSummary(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decksAttemptA = await (supabase.from('flashcard_decks') as any)
    .select('id,user_id,name,description,area,is_system,is_public,created_at')
    .or(`user_id.eq.${user.id},is_system.eq.true,is_public.eq.true`)
    .order('created_at', { ascending: false })

  if (!decksAttemptA.error && decksAttemptA.data) {
    return await respondWithDecks({
      supabase,
      userId: user.id,
      deckRows: (decksAttemptA.data || []) as DeckRow[],
    })
  }

  const decksAttemptB = await (supabase.from('flashcard_decks') as any)
    .select('id,user_id,name,description,area,is_public,created_at')
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .order('created_at', { ascending: false })

  if (!decksAttemptB.error && decksAttemptB.data) {
    return await respondWithDecks({
      supabase,
      userId: user.id,
      deckRows: (decksAttemptB.data || []) as DeckRow[],
    })
  }

  const decksAttemptC = await supabase
    .from('flashcard_decks')
    .select('id,user_id,name,description,area,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!decksAttemptC.error && decksAttemptC.data) {
    return await respondWithDecks({
      supabase,
      userId: user.id,
      deckRows: (decksAttemptC.data || []) as unknown as DeckRow[],
    })
  }

  const deckError = pickDeckQueryError(decksAttemptA.error, decksAttemptB.error, decksAttemptC.error)
  if (deckError && isSchemaDriftError(deckError)) {
    return NextResponse.json({
      decks: [],
      warning: 'Flashcards indisponíveis neste ambiente (schema em migração).',
    })
  }

  return NextResponse.json(
    {
      decks: [],
      error: 'Failed to load decks',
      details: deckError?.message || null,
    },
    { status: 200 }
  )
}

async function respondWithDecks({
  supabase,
  userId,
  deckRows,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>
  userId: string
  deckRows: DeckRow[]
}) {
  const decks = deckRows.map(normalizeDeck)
  if (decks.length === 0) {
    return NextResponse.json({ decks: [] })
  }

  const deckIds = decks.map((deck) => deck.id)

  const { data: cardsRaw, error: cardsError } = await supabase
    .from('flashcards')
    .select('id,deck_id')
    .in('deck_id', deckIds)
    .limit(10_000)

  if (cardsError && isSchemaDriftError(cardsError)) {
    return NextResponse.json({
      decks: decks.map((deck) => ({ ...deck, cardCount: 0, dueCount: 0 })),
      warning: 'Cards indisponíveis neste ambiente (schema em migração).',
    })
  }

  const cards = ((cardsRaw || []) as CardRow[]).filter(Boolean)
  const cardDeckMap = new Map<string, string>()
  const cardCountByDeck = new Map<string, number>()

  for (const card of cards) {
    cardDeckMap.set(card.id, card.deck_id)
    cardCountByDeck.set(card.deck_id, (cardCountByDeck.get(card.deck_id) || 0) + 1)
  }

  const now = new Date()
  const dueCountByDeck = new Map<string, number>()
  for (const deckId of deckIds) {
    dueCountByDeck.set(deckId, cardCountByDeck.get(deckId) || 0)
  }

  const states = await loadReviewStates({ supabase, userId })

  if (states.source === 'none') {
    // No state tables available; fall back to card scheduling columns if present.
    const fallback = await loadCardDueScheduleFallback({ supabase, deckIds })
    if (fallback.ok) {
      for (const [deckId, dueCount] of fallback.dueCountByDeck.entries()) {
        dueCountByDeck.set(deckId, dueCount)
      }
    } else {
      // Best-effort: show all cards as due when we can't compute schedule.
      // This avoids false "0 due" when scheduling is unavailable.
    }
  } else {
    for (const row of states.rows) {
      const deckId = cardDeckMap.get(row.card_id)
      if (!deckId) continue
      const lastReview = row.last_review_at ? new Date(row.last_review_at) : null
      const nextReview = row.next_review_at ? new Date(row.next_review_at) : null

      // Cards without a last review (or without a next review) stay "due".
      if (!lastReview || !nextReview) continue
      if (nextReview > now) {
        dueCountByDeck.set(deckId, Math.max(0, (dueCountByDeck.get(deckId) || 0) - 1))
      }
    }
  }

  const decksWithCounts = decks.map((deck) => ({
    ...deck,
    cardCount: cardCountByDeck.get(deck.id) || 0,
    dueCount: dueCountByDeck.get(deck.id) || 0,
  }))

  return NextResponse.json({ decks: decksWithCounts, warning: states.warning })
}

async function loadReviewStates({
  supabase,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>
  userId: string
}): Promise<
  | { source: 'review'; rows: ReviewStateRow[]; warning?: string }
  | { source: 'legacy'; rows: LegacyStateRow[]; warning?: string }
  | { source: 'none'; rows: []; warning?: string }
> {
  const reviewAttempt = await (supabase.from('flashcard_review_states') as any)
    .select('card_id,next_review_at,last_review_at')
    .eq('user_id', userId)
    .limit(20_000)

  if (!reviewAttempt.error) {
    return { source: 'review', rows: (reviewAttempt.data || []) as ReviewStateRow[] }
  }

  const legacyAttempt = await (supabase.from('flashcard_sm2_states' as any) as any)
    .select('card_id,next_review_at,last_review_at')
    .eq('user_id', userId)
    .limit(20_000)

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

async function loadCardDueScheduleFallback({
  supabase,
  deckIds,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>
  deckIds: string[]
}): Promise<{ ok: true; dueCountByDeck: Map<string, number> } | { ok: false }> {
  const now = new Date().toISOString()

  const attemptA = await (supabase.from('flashcards') as any)
    .select('deck_id,next_review')
    .in('deck_id', deckIds)
    .limit(10_000)

  if (!attemptA.error) {
    const dueCountByDeck = new Map<string, number>()
    for (const deckId of deckIds) dueCountByDeck.set(deckId, 0)
    for (const row of attemptA.data || []) {
      const deckId = row.deck_id as string
      const nextReview = row.next_review as string | undefined
      if (!deckId || !nextReview) continue
      if (nextReview <= now) {
        dueCountByDeck.set(deckId, (dueCountByDeck.get(deckId) || 0) + 1)
      }
    }
    return { ok: true, dueCountByDeck }
  }

  const attemptB = await (supabase.from('flashcards') as any)
    .select('deck_id,next_review_at')
    .in('deck_id', deckIds)
    .limit(10_000)

  if (!attemptB.error) {
    const dueCountByDeck = new Map<string, number>()
    for (const deckId of deckIds) dueCountByDeck.set(deckId, 0)
    for (const row of attemptB.data || []) {
      const deckId = row.deck_id as string
      const nextReview = row.next_review_at as string | undefined
      if (!deckId || !nextReview) continue
      if (nextReview <= now) {
        dueCountByDeck.set(deckId, (dueCountByDeck.get(deckId) || 0) + 1)
      }
    }
    return { ok: true, dueCountByDeck }
  }

  if (isSchemaDriftError(attemptA.error) || isSchemaDriftError(attemptB.error)) {
    return { ok: false }
  }

  return { ok: false }
}
