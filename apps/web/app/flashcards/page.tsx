'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import type { ENAMEDArea } from '@darwin-education/shared'

interface FlashcardDeck {
  id: string
  title: string
  description: string | null
  area: ENAMEDArea | null
  card_count: number
  due_count: number
  last_studied: string | null
  created_at: string
  is_system: boolean
}


export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ENAMEDArea | 'all'>('all')

  useEffect(() => {
    loadDecks()
  }, [])

  async function loadDecks() {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      setLoading(false)
      return
    }

    // Load decks with card counts
    const { data: decksData } = await supabase
      .from('flashcard_decks')
      .select(`
        id,
        title,
        description,
        area,
        created_at,
        flashcards(id, next_review)
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    if (decksData) {
      const now = new Date().toISOString()
      const formattedDecks: FlashcardDeck[] = decksData.map((deck: any) => ({
        id: deck.id,
        title: deck.title,
        description: deck.description,
        area: deck.area,
        card_count: deck.flashcards?.length || 0,
        due_count: deck.flashcards?.filter((c: any) => c.next_review <= now).length || 0,
        last_studied: null, // Could track this separately
        created_at: deck.created_at,
      }))
      setDecks(formattedDecks)
    }

    setLoading(false)
  }

  const filteredDecks = filter === 'all'
    ? decks
    : decks.filter(d => d.area === filter)

  const totalDue = decks.reduce((sum, d) => sum + d.due_count, 0)
  const totalCards = decks.reduce((sum, d) => sum + d.card_count, 0)

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Flashcards</h1>
              <p className="text-sm text-label-secondary mt-1">
                Sistema de repetição espaçada SM-2
              </p>
            </div>
            <Link href="/flashcards/create">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Deck
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <AnimatedList className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <AnimatedItem>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <Card className="mb-8 bg-gradient-to-r from-emerald-900/30 to-surface-1 border-emerald-800">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Você tem {totalDue} cards para revisar
                  </h3>
                  <p className="text-sm text-label-secondary mt-1">
                    Mantenha sua sequência de estudos!
                  </p>
                </div>
                <Link href="/flashcards/study">
                  <Button size="lg">
                    Estudar Agora
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === area
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-2 text-label-primary hover:bg-surface-3'
              }`}
            >
              {AREA_LABELS[area]}
            </button>
          ))}
        </div>

        {/* Decks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface-2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredDecks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-16 h-16 text-label-quaternary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">
                {filter === 'all' ? 'Nenhum deck criado' : 'Nenhum deck nesta área'}
              </h3>
              <p className="text-label-secondary mb-4">
                Crie seu primeiro deck de flashcards para começar a estudar
              </p>
              <Link href="/flashcards/create">
                <Button>Criar Deck</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDecks.map((deck) => (
              <AnimatedItem key={deck.id}>
              <Link href={`/flashcards/${deck.id}`}>
                <Card className="h-full hover:border-surface-4 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{deck.title}</CardTitle>
                      {deck.due_count > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                          {deck.due_count} para revisar
                        </span>
                      )}
                    </div>
                    {deck.area && (
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${AREA_COLORS[deck.area]?.badge}`}>
                        {AREA_LABELS[deck.area]}
                      </span>
                    )}
                  </CardHeader>
                  <CardContent>
                    {deck.description && (
                      <p className="text-sm text-label-secondary mb-4 line-clamp-2">
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
      </main>
    </div>
  )
}
