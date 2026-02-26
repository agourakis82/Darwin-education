'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FeatureState } from '@/components/ui/FeatureState'
import { ReviewButtons } from '../components/ReviewButtons'
import { FSRS } from '@darwin-education/shared'
import { celebrateSessionComplete } from '@/lib/confetti'
import { useToast } from '@/lib/hooks/useToast'

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
  const { error: toastError, info: toastInfo } = useToast()
  const [cards, setCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState<StudyStats>({ reviewed: 0, correct: 0, remaining: 0 })
  const [sessionComplete, setSessionComplete] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchDueCards = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setFetchError(null)
    try {
      const response = await fetch('/api/flashcards/due?limit=50', { signal, cache: 'no-store' })
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Falha ao carregar os flashcards da sessão.')
      }
      const data = await response.json()
      setCards(data.cards)
      setCurrentIndex(0)
      setIsFlipped(false)
      setSessionComplete(false)
      setStats({ reviewed: 0, correct: 0, remaining: data.cards.length })
    } catch (error) {
      const requestWasAborted =
        signal?.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      if (requestWasAborted) {
        return
      }
      const message = 'Não foi possível carregar os flashcards. Verifique sua conexão e tente novamente.'
      setFetchError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }, [router, toastError])

  // Fetch due cards
  useEffect(() => {
    const controller = new AbortController()
    void fetchDueCards(controller.signal)
    return () => controller.abort()
  }, [fetchDueCards])

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
      toastError('Não foi possível registrar sua revisão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }, [currentCard, currentIndex, cards.length, stats, submitting, toastError])

  // Celebrate session completion
  useEffect(() => {
    if (sessionComplete && stats.reviewed > 0) {
      const accuracy = Math.round((stats.correct / stats.reviewed) * 100)
      celebrateSessionComplete(accuracy)
    }
  }, [sessionComplete, stats.reviewed, stats.correct])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="loading"
            title="Preparando sessão de revisão"
            description="Carregando os flashcards com prazo de revisão para você começar."
          />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="error"
            title="Falha ao carregar sessão"
            description={fetchError}
            action={{
              label: 'Tentar novamente',
              onClick: () => void fetchDueCards(),
            }}
          />
          <Button variant="bordered" onClick={() => router.push('/flashcards')} fullWidth className="darwin-nav-link mt-3">
            Voltar aos Decks
          </Button>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="success"
            title="Tudo em dia"
            description="Nenhum flashcard para revisar agora. Sua fila está atualizada."
            action={{
              label: 'Voltar aos Decks',
              onClick: () => router.push('/flashcards'),
              variant: 'secondary',
            }}
          />
        </div>
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
            <h2 className="text-2xl font-bold text-label-primary mb-2">Sessão concluída!</h2>
            <p className="text-label-secondary mb-6">Excelente trabalho!</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-2xl font-bold text-label-primary">{stats.reviewed}</div>
                <div className="text-xs text-label-secondary">Revisados</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-400">{stats.correct}</div>
                <div className="text-xs text-label-secondary">Corretos</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                <div className="text-xs text-label-secondary">Precisão</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={async () => {
                  toastInfo('Atualizando sua próxima sessão...')
                  await fetchDueCards()
                }}
                className="darwin-nav-link"
                fullWidth
              >
                Continuar Estudando
              </Button>
              <Button variant="bordered" onClick={() => router.push('/flashcards')} className="darwin-nav-link" fullWidth>
                Voltar aos Decks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-separator bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="plain" className="darwin-nav-link" onClick={() => router.push('/flashcards')}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Sair
            </Button>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-label-secondary">
                {currentIndex + 1} / {cards.length}
              </span>
              <span className="rounded-lg border border-emerald-500/35 bg-emerald-600/18 px-2 py-1 text-emerald-300">
                {stats.correct} corretos
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="darwin-image-tile mb-6 h-40">
          <Image
            src="/images/branding/flashcards-cover-photo-01.png"
            alt="Sessão de revisão de flashcards"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/88 via-surface-0/55 to-surface-0/22" />
          <div className="relative z-[3] flex h-full items-end p-4">
            <p className="text-sm text-label-secondary max-w-md">
              Repetição espaçada orientada por desempenho para consolidar memória de longo prazo.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-surface-2 rounded-full mb-8 overflow-hidden border border-separator/60">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Card Info + Flashcard — animate between cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring.snappy}
          >
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="px-2 py-1 bg-surface-2 rounded text-label-primary">
                {currentCard.deckName}
              </span>
              {currentCard.area && (
                <span className="rounded-lg border border-sky-500/35 bg-sky-500/12 px-2 py-1 text-sky-300">
                  {currentCard.area.replace('_', ' ')}
                </span>
              )}
              {currentCard.state === 'new' && (
                <span className="rounded-lg border border-violet-500/35 bg-violet-500/12 px-2 py-1 text-violet-300">
                  Novo
                </span>
              )}
            </div>

            {/* Flashcard — 3D flip */}
            <div
              className="relative cursor-pointer mb-8 select-none"
              style={{ perspective: 1200 }}
              onClick={() => setIsFlipped(!isFlipped)}
              role="button"
              aria-label={isFlipped ? 'Verso. Clique para voltar.' : 'Frente. Clique para virar.'}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="preserve-3d relative"
              >
                {/* Front face */}
                <div className="backface-hidden min-h-[300px]">
                  <Card className="h-full min-h-[300px]">
                    <CardContent className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center">
                      <p className="text-xs text-label-tertiary mb-4 uppercase tracking-wider">Frente</p>
                      <p className="text-xl md:text-2xl text-label-primary whitespace-pre-wrap">
                        {currentCard.front}
                      </p>
                      <p className="text-sm text-label-tertiary mt-8 flex items-center gap-1.5">
                        <span className="rounded border border-separator/60 bg-surface-2/70 px-1.5 py-0.5 font-mono text-xs">espaço</span>
                        para virar
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Back face */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 min-h-[300px]">
                  <Card className="h-full min-h-[300px] border-emerald-500/20">
                    <CardContent className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center">
                      <p className="text-xs text-emerald-400 mb-4 uppercase tracking-wider">Verso</p>
                      <p className="text-xl md:text-2xl text-label-primary whitespace-pre-wrap">
                        {currentCard.back}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

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
