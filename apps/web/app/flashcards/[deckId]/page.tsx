'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronLeft } from 'lucide-react'
import { DeckStats } from '../components/DeckStats'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea } from '@darwin-education/shared'

interface DeckData {
  id: string
  name: string
  description: string | null
  area: ENAMEDArea | null
  createdAt: string
}

interface FlashcardData {
  id: string
  front: string
  back: string
  repetitions: number
  intervalDays: number
  easeFactor: number
  nextReviewAt: string
  lastReviewAt: string | null
  isDue: boolean
  isNew: boolean
}

interface DeckApiResponse {
  deck: {
    id: string
    name: string
    description: string | null
    area: ENAMEDArea | null
    createdAt: string
  }
  cards: FlashcardData[]
  summary: {
    cardCount: number
    dueCount: number
  }
  warning?: string
  error?: string
}

interface CardPreviewState {
  [key: string]: boolean
}

export default function DeckViewPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<DeckData | null>(null)
  const [cards, setCards] = useState<FlashcardData[]>([])
  const [loading, setLoading] = useState(true)
  const [flippedCards, setFlippedCards] = useState<CardPreviewState>({})
  const [dueCount, setDueCount] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    loadDeck()
  }, [deckId])

  async function loadDeck() {
    setLoading(true)
    setLoadError(null)

    try {
      const response = await fetch(`/api/flashcards/decks/${deckId}`, { cache: 'no-store' })
      if (response.status === 401) {
        router.push(`/login?redirectTo=/flashcards/${deckId}`)
        return
      }

      if (response.status === 404) {
        router.push('/flashcards')
        return
      }

      const payload = (await response.json()) as DeckApiResponse

      if (!response.ok || payload.error || !payload.deck) {
        setLoadError('Não foi possível carregar este deck.')
        setLoading(false)
        return
      }

      setDeck(payload.deck)
      setCards(payload.cards || [])
      setDueCount(payload.summary?.dueCount || 0)
      setLoading(false)
    } catch {
      setLoadError('Não foi possível carregar este deck. Verifique sua conexão e tente novamente.')
      setLoading(false)
    }
  }

  const toggleCardFlip = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface-0 text-label-primary">
        <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-label-secondary">{loadError}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!deck) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{deck.name}</h1>
                <p className="text-sm text-label-secondary mt-1">
                  {cards.length} cards
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/flashcards/${deckId}/edit`}>
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Button>
              </Link>
              {dueCount > 0 && (
                <Link href="/flashcards/study">
                  <Button size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Estudar ({dueCount})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deck Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Deck</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deck.description && (
                  <div>
                    <h3 className="text-sm font-medium text-label-primary mb-1">Descrição</h3>
                    <p className="text-label-secondary">{deck.description}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  {deck.area && (
                    <div>
                      <h3 className="text-sm font-medium text-label-primary mb-1">Área</h3>
                      <span className={`inline-block px-3 py-1 text-sm rounded border ${AREA_COLORS[deck.area]?.badge}`}>
                        {AREA_LABELS[deck.area]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-label-primary mb-1">Criado em</h3>
                    <p className="text-label-secondary">
                      {new Date(deck.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Flashcards ({cards.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {cards.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-label-secondary">Nenhum card neste deck ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cards.map((card) => {
                      const isFlipped = flippedCards[card.id] || false
                      const isDue = card.isDue

                      return (
                        <div
                          key={card.id}
                          onClick={() => toggleCardFlip(card.id)}
                          className="p-4 bg-surface-2/50 border border-separator rounded-lg cursor-pointer
                            hover:border-surface-4 transition-all hover:bg-surface-2/70"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-sm text-label-secondary mb-2 flex gap-2">
                                {card.isNew && (
                                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                    Novo
                                  </span>
                                )}
                                {!card.isNew && card.intervalDays < 21 && (
                                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                    Aprendendo
                                  </span>
                                )}
                                {!card.isNew && card.intervalDays >= 21 && (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                                    Maduro
                                  </span>
                                )}
                                {isDue && (
                                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                    Para revisar
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm leading-relaxed transition-opacity ${isFlipped ? 'opacity-60' : ''}`}>
                                {isFlipped ? card.back : card.front}
                              </p>
                            </div>
                            <svg
                              className={`w-4 h-4 text-label-tertiary flex-shrink-0 transition-transform ${
                                isFlipped ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </div>

                          {/* Card Stats */}
                          <div className="mt-3 pt-3 border-t border-separator text-xs text-label-tertiary flex gap-4">
                            <span>
                              Repetições: <span className="text-label-primary">{card.repetitions}</span>
                            </span>
                            <span>
                              Intervalo: <span className="text-label-primary">{card.intervalDays}d</span>
                            </span>
                            <span>
                              Fator: <span className="text-label-primary">{card.easeFactor.toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <DeckStats cards={cards} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/flashcards/${deckId}/edit`} className="block">
                  <Button variant="secondary" size="sm" className="w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Cards
                  </Button>
                </Link>
                {dueCount > 0 && (
                  <Link href="/flashcards/study" className="block">
                    <Button size="sm" className="w-full">
                      Estudar Agora
                    </Button>
                  </Link>
                )}
                {dueCount === 0 && cards.length > 0 && (
                  <div className="p-3 bg-surface-2/50 rounded-lg text-center text-sm text-label-secondary">
                    Todos os cards foram revisados
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dicas de Estudo</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-label-secondary space-y-2">
                <div className="flex gap-2">
                  <div className="w-1 h-1 bg-label-quaternary rounded-full mt-1 flex-shrink-0" />
                  <p>Azul = novos cards, nunca revisados</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1 h-1 bg-label-quaternary rounded-full mt-1 flex-shrink-0" />
                  <p>Amarelo = em aprendizado (intervalo {'<'} 21 dias)</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1 h-1 bg-label-quaternary rounded-full mt-1 flex-shrink-0" />
                  <p>Verde = maduros (intervalo {'≥'} 21 dias)</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1 h-1 bg-label-quaternary rounded-full mt-1 flex-shrink-0" />
                  <p>Vermelho = para revisar hoje</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
