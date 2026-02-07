'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ReviewButtons } from '../components/ReviewButtons'
import { FSRS } from '@darwin-education/shared'

type FSRSRating = FSRS.FSRSRating

interface DueCard {
  id: string
  front: string
  back: string
  deckId: string
  deckName: string
  area: string | null
  topic: string | null
  state: string
  dueDate: string
  daysPastDue: number
}

interface StudyStats {
  reviewed: number
  correct: number
  remaining: number
}

export default function FlashcardStudyPage() {
  const router = useRouter()
  const [cards, setCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState<StudyStats>({ reviewed: 0, correct: 0, remaining: 0 })
  const [sessionComplete, setSessionComplete] = useState(false)

  // Fetch due cards
  useEffect(() => {
    async function fetchDueCards() {
      try {
        const response = await fetch('/api/flashcards/due?limit=50')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch cards')
        }
        const data = await response.json()
        setCards(data.cards)
        setStats({ reviewed: 0, correct: 0, remaining: data.cards.length })
      } catch (error) {
        console.error('Error fetching cards:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDueCards()
  }, [router])

  const currentCard = cards[currentIndex]

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (submitting) return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped(!isFlipped)
      } else if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        handleReview(parseInt(e.key) as FSRSRating)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFlipped, submitting])

  const handleReview = useCallback(async (rating: FSRSRating) => {
    if (!currentCard || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, rating }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      // Update stats
      const newReviewed = stats.reviewed + 1
      const newCorrect = rating >= 3 ? stats.correct + 1 : stats.correct
      const newRemaining = stats.remaining - 1

      setStats({ reviewed: newReviewed, correct: newCorrect, remaining: newRemaining })

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsFlipped(false)
      } else {
        setSessionComplete(true)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }, [currentCard, currentIndex, cards.length, stats, submitting])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando flashcards...</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <svg className="w-16 h-16 text-emerald-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Tudo em dia!</h2>
            <p className="text-label-secondary mb-6">
              Nenhum flashcard para revisar agora. Volte mais tarde!
            </p>
            <Button onClick={() => router.push('/flashcards')}>
              Voltar aos Decks
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (sessionComplete) {
    const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0

    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sessao Concluida!</h2>
            <p className="text-label-secondary mb-6">Excelente trabalho!</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{stats.reviewed}</div>
                <div className="text-xs text-label-secondary">Revisados</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">{stats.correct}</div>
                <div className="text-xs text-label-secondary">Corretos</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                <div className="text-xs text-label-secondary">Precisao</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} fullWidth>
                Continuar Estudando
              </Button>
              <Button variant="outline" onClick={() => router.push('/flashcards')} fullWidth>
                Voltar aos Decks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/flashcards')}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Sair
            </Button>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-label-secondary">
                {currentIndex + 1} / {cards.length}
              </span>
              <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded">
                {stats.correct} corretos
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="h-2 bg-surface-2 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Card Info */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="px-2 py-1 bg-surface-2 rounded text-label-primary">
            {currentCard.deckName}
          </span>
          {currentCard.area && (
            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
              {currentCard.area.replace('_', ' ')}
            </span>
          )}
          {currentCard.state === 'new' && (
            <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
              Novo
            </span>
          )}
        </div>

        {/* Flashcard */}
        <div
          className="relative perspective-1000 cursor-pointer mb-8"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <Card className={`
            min-h-[300px] transition-all duration-500 transform-style-3d
            ${isFlipped ? 'rotate-y-180' : ''}
          `}>
            <CardContent className="flex items-center justify-center p-8 min-h-[300px]">
              <div className={`text-center ${isFlipped ? 'hidden' : ''}`}>
                <p className="text-xs text-label-tertiary mb-4">FRENTE</p>
                <p className="text-xl md:text-2xl text-white whitespace-pre-wrap">
                  {currentCard.front}
                </p>
                <p className="text-sm text-label-tertiary mt-8">
                  Clique ou pressione espaco para virar
                </p>
              </div>
              <div className={`text-center ${isFlipped ? '' : 'hidden'}`}>
                <p className="text-xs text-label-tertiary mb-4">VERSO</p>
                <p className="text-xl md:text-2xl text-white whitespace-pre-wrap">
                  {currentCard.back}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Buttons (shown only when flipped) */}
        {isFlipped && (
          <div className="animate-fade-in">
            <ReviewButtons onReview={handleReview} />
          </div>
        )}

        {/* Show front instruction when not flipped */}
        {!isFlipped && (
          <div className="text-center text-label-tertiary">
            <p>Tente lembrar a resposta antes de virar o card</p>
          </div>
        )}
      </main>
    </div>
  )
}
