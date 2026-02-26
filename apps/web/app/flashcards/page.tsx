'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { FeatureState } from '@/components/ui/FeatureState'
import { BibliographyBlock } from '@/components/content/BibliographyBlock'
import { STUDY_METHODS_BIBLIOGRAPHY } from '@/lib/references/bibliography'
import type { ENAMEDArea } from '@darwin-education/shared'

interface FlashcardDeck {
  id: string
  name: string
  description: string | null
  area: ENAMEDArea | null
  card_count: number
  due_count: number
  last_studied: string | null
  created_at: string
  is_system: boolean
}

interface FlashcardDeckResponse {
  decks: Array<{
    id: string
    name: string
    description: string | null
    area: ENAMEDArea | null
    createdAt: string
    isSystem: boolean
    cardCount: number
    dueCount: number
  }>
  warning?: string
}


export default function FlashcardsPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ENAMEDArea | 'all'>('all')

  useEffect(() => {
    loadDecks()
  }, [])

  async function loadDecks() {
    setLoadError(null)
    setLoading(true)
    setRequiresAuth(false)

    try {
      const response = await fetch('/api/flashcards/decks', { cache: 'no-store' })
      if (response.status === 401) {
        setRequiresAuth(true)
        setDecks([])
        setLoading(false)
        return
      }

      const payload = (await response.json()) as FlashcardDeckResponse

      if (!response.ok) {
        setLoadError('Falha ao carregar os decks. Atualize a página e tente novamente.')
        setDecks([])
        setLoading(false)
        return
      }

      const formattedDecks: FlashcardDeck[] = (payload.decks || []).map((deck) => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        area: deck.area,
        card_count: deck.cardCount,
        due_count: deck.dueCount,
        last_studied: null,
        created_at: deck.createdAt,
        is_system: deck.isSystem,
      }))

      setDecks(formattedDecks)
      setLoading(false)
    } catch {
      setLoadError('Falha ao carregar os decks. Verifique sua conexão e tente novamente.')
      setDecks([])
      setLoading(false)
    }
  }

  const systemDecks = decks.filter(d => d.is_system)
  const userDecks = decks.filter(d => !d.is_system)

  const filteredSystemDecks = filter === 'all'
    ? systemDecks
    : systemDecks.filter(d => d.area === filter)

  const filteredUserDecks = filter === 'all'
    ? userDecks
    : userDecks.filter(d => d.area === filter)

  const totalDue = decks.reduce((sum, d) => sum + d.due_count, 0)
  const totalCards = decks.reduce((sum, d) => sum + d.card_count, 0)

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-label-primary mb-2">Flashcards</h1>
            <p className="text-label-secondary">Sistema de repetição espaçada SM-2</p>
          </div>
          <Link href="/flashcards/create">
            <Button>
              <Plus className="w-4 h-4" />
              Criar deck
            </Button>
          </Link>
        </div>

        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/flashcards-cover-photo-01.png"
            alt="Banner da área de flashcards"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/35" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Memorização ativa com repetição espaçada.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Transforme revisão diária em resultado de longo prazo.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <FeatureState
              kind="loading"
              title="Carregando decks"
              description="Buscando suas coleções e os decks oficiais para montar o plano de revisão."
            />
            <SkeletonGrid items={6} columns={3} />
          </div>
        ) : loadError ? (
          <FeatureState
            kind="error"
            title="Não foi possível carregar os flashcards"
            description={loadError}
            action={{ label: 'Tentar novamente', onClick: () => void loadDecks(), variant: 'secondary' }}
            className="mb-6"
          />
        ) : requiresAuth ? (
          <FeatureState
            kind="empty"
            title="Entre para acessar seus decks"
            description="Faça login para sincronizar seus flashcards, acompanhar revisões pendentes e manter o progresso salvo."
            action={{ label: 'Ir para login', onClick: () => router.push('/login'), variant: 'primary' }}
            className="mb-6"
          />
        ) : (
          <>
            {/* Stats Overview */}
            <AnimatedList className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-emerald-500/20 p-3">
                        <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold"><AnimatedCounter value={decks.length} /></p>
                        <p className="text-sm text-label-secondary">Decks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>

              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-blue-500/20 p-3">
                        <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold"><AnimatedCounter value={totalCards} /></p>
                        <p className="text-sm text-label-secondary">Total de Cards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>

              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-yellow-500/20 p-3">
                        <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold"><AnimatedCounter value={totalDue} /></p>
                        <p className="text-sm text-label-secondary">Para Revisar</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>
            </AnimatedList>

            {/* Quick Study */}
            {totalDue > 0 && (
              <Card className="mb-8 border-emerald-800 bg-gradient-to-r from-emerald-900/30 to-surface-1">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-label-primary">
                        Você tem {totalDue} cards para revisar
                      </h3>
                      <p className="mt-1 text-sm text-label-secondary">
                        Mantenha sua sequência de estudos!
                      </p>
                    </div>
                    <Link href="/flashcards/study">
                      <Button size="large">
                        Estudar Agora
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`darwin-focus-ring whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                Todos
              </button>
              {(Object.keys(AREA_LABELS) as ENAMEDArea[]).map((area) => (
                <button
                  key={area}
                  onClick={() => setFilter(area)}
                  className={`darwin-focus-ring whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === area
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                  }`}
                >
                  {AREA_LABELS[area]}
                </button>
              ))}
            </div>

            {/* Decks */}
            <>
              {/* System Decks */}
              {filteredSystemDecks.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-label-primary">Decks da Plataforma</h2>
                    <span className="text-xs text-label-tertiary">{filteredSystemDecks.reduce((s, d) => s + d.card_count, 0)} cards</span>
                  </div>
                  <AnimatedList className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSystemDecks.map((deck) => (
                      <AnimatedItem key={deck.id}>
                        <Link href={`/flashcards/${deck.id}`}>
                          <Card className="h-full cursor-pointer border-emerald-900/50 transition-colors hover:border-emerald-800">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{deck.name}</CardTitle>
                                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                                    Oficial
                                  </span>
                                </div>
                                {deck.due_count > 0 && (
                                  <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                                    {deck.due_count} para revisar
                                  </span>
                                )}
                              </div>
                              {deck.area && (
                                <span className={`inline-block rounded border px-2 py-1 text-xs ${AREA_COLORS[deck.area]?.badge}`}>
                                  {AREA_LABELS[deck.area]}
                                </span>
                              )}
                            </CardHeader>
                            <CardContent>
                              {deck.description && (
                                <p className="mb-4 line-clamp-2 text-sm text-label-secondary">
                                  {deck.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-label-secondary">
                                  {deck.card_count} cards
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </AnimatedItem>
                    ))}
                  </AnimatedList>
                </div>
              )}

              {/* User Decks */}
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-label-primary">Meus Decks</h2>
              </div>
              {filteredUserDecks.length === 0 ? (
                <FeatureState
                  kind="empty"
                  title={filter === 'all' ? 'Nenhum deck criado' : 'Nenhum deck nesta área'}
                  description="Crie seu primeiro deck de flashcards para começar a revisar de forma adaptativa."
                  action={{ label: 'Criar deck', onClick: () => router.push('/flashcards/create'), variant: 'primary' }}
                />
              ) : (
                <AnimatedList className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUserDecks.map((deck) => (
                    <AnimatedItem key={deck.id}>
                      <Link href={`/flashcards/${deck.id}`}>
                        <Card className="h-full cursor-pointer transition-colors hover:border-surface-4">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">{deck.name}</CardTitle>
                              {deck.due_count > 0 && (
                                <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                                  {deck.due_count} para revisar
                                </span>
                              )}
                            </div>
                            {deck.area && (
                              <span className={`inline-block rounded border px-2 py-1 text-xs ${AREA_COLORS[deck.area]?.badge}`}>
                                {AREA_LABELS[deck.area]}
                              </span>
                            )}
                          </CardHeader>
                          <CardContent>
                            {deck.description && (
                              <p className="mb-4 line-clamp-2 text-sm text-label-secondary">
                                {deck.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-label-secondary">
                                {deck.card_count} cards
                              </span>
                              <div className="flex items-center gap-1 text-label-tertiary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>
                                  {new Date(deck.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </AnimatedItem>
                  ))}
                </AnimatedList>
              )}
            </>
          </>
        )}

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <BibliographyBlock title="Referências (repetição espaçada)" entries={STUDY_METHODS_BIBLIOGRAPHY.spaced_repetition} />
          <BibliographyBlock title="Referências (active recall)" entries={STUDY_METHODS_BIBLIOGRAPHY.active_recall} />
        </div>
      </div>
    </div>
  )
}
