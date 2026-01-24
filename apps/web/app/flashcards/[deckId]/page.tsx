'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { FlashcardViewer } from '../components/FlashcardViewer'
import { ReviewButtons } from '../components/ReviewButtons'
import { DeckStats } from '../components/DeckStats'
import type { ReviewQuality } from '@darwin-education/shared'

// SM-2 constants
const MIN_EASE_FACTOR = 1.3
const INITIAL_INTERVAL = 1

/**
 * Process a review using the SM-2 algorithm
 * Returns new ease_factor, interval, and repetitions
 */
function processSM2Review(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: ReviewQuality
): { easeFactor: number; interval: number; repetitions: number } {
  // Quality < 3 means failed recall - reset
  if (quality < 3) {
    return {
      easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - 0.2),
      interval: INITIAL_INTERVAL,
      repetitions: 0,
    }
  }

  // Calculate new ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  // Calculate new interval
  let newInterval: number
  if (repetitions === 0) {
    newInterval = 1
  } else if (repetitions === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEaseFactor)
  }

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: repetitions + 1,
  }
}

interface FlashcardData {
  id: string
  front: string
  back: string
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
}

interface DeckData {
  id: string
  title: string
  description: string | null
  area: string | null
}

export default function DeckStudyPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<DeckData | null>(null)
  const [cards, setCards] = useState<FlashcardData[]>([])
  const [dueCards, setDueCards] = useState<FlashcardData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  useEffect(() => {
    loadDeck()
  }, [deckId])

  async function loadDeck() {
    const supabase = createClient()

    // Load deck info
    const { data: deckData } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('id', deckId)
      .single() as { data: DeckData | null; error: any }

    if (!deckData) {
      router.push('/flashcards')
      return
    }

    setDeck(deckData)

    // Load all cards
    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('next_review', { ascending: true }) as { data: FlashcardData[] | null; error: any }

    if (cardsData) {
      setCards(cardsData)

      // Filter due cards
      const now = new Date().toISOString()
      const due = cardsData.filter((c: FlashcardData) => c.next_review <= now)
      setDueCards(due)

      if (due.length === 0) {
        setSessionComplete(true)
      }
    }

    setLoading(false)
  }

  const currentCard = dueCards[currentIndex]

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const handleReview = useCallback(async (quality: ReviewQuality) => {
    if (!currentCard) return

    const supabase = createClient()

    // Process review using SM-2 algorithm
    const newState = processSM2Review(
      currentCard.ease_factor,
      currentCard.interval,
      currentCard.repetitions,
      quality
    )

    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + newState.interval)

    // Update card in database
    await (supabase
      .from('flashcards') as any)
      .update({
        ease_factor: newState.easeFactor,
        interval: newState.interval,
        repetitions: newState.repetitions,
        next_review: nextReview.toISOString(),
      })
      .eq('id', currentCard.id)

    // Move to next card
    setReviewedCount((prev) => prev + 1)
    setIsFlipped(false)

    if (currentIndex + 1 >= dueCards.length) {
      setSessionComplete(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentCard, currentIndex, dueCards.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionComplete) return

      if (e.code === 'Space') {
        e.preventDefault()
        handleFlip()
      } else if (isFlipped) {
        if (e.key === '1') handleReview(1)
        else if (e.key === '2') handleReview(2)
        else if (e.key === '3') handleReview(3)
        else if (e.key === '4') handleReview(4)
        else if (e.key === '5') handleReview(5)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFlipped, sessionComplete, handleFlip, handleReview])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/flashcards')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold">{deck?.title}</h1>
                <p className="text-sm text-slate-400">
                  {sessionComplete
                    ? `${reviewedCount} cards revisados`
                    : `${currentIndex + 1} de ${dueCards.length} para revisar`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/flashcards/${deckId}/edit`)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Study Area */}
          <div className="lg:col-span-2">
            {sessionComplete ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Sessão Completa!</h2>
                  <p className="text-slate-400 mb-6">
                    Você revisou {reviewedCount} cards. Continue assim!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="secondary" onClick={() => router.push('/flashcards')}>
                      Voltar aos Decks
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Estudar Novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : currentCard ? (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentIndex / dueCards.length) * 100}%` }}
                  />
                </div>

                {/* Flashcard */}
                <FlashcardViewer
                  front={currentCard.front}
                  back={currentCard.back}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                />

                {/* Review Buttons */}
                {isFlipped && (
                  <ReviewButtons onReview={handleReview} />
                )}

                {/* Flip instruction */}
                {!isFlipped && (
                  <p className="text-center text-slate-400 text-sm">
                    Clique no card ou pressione <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Espaço</kbd> para ver a resposta
                  </p>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">Nenhum card para revisar agora</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <DeckStats cards={cards} />

            {/* Keyboard Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Atalhos</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Virar card</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Espaço</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avaliar (1-5)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">1-5</kbd>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
