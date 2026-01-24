'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import type { FlashcardDeck, Flashcard } from '@/lib/supabase'
import type { ENAMEDArea } from '@darwin-education/shared'

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

interface FlashcardInput {
  front: string
  back: string
}

export default function CreateDeckPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState<ENAMEDArea | ''>('')
  const [cards, setCards] = useState<FlashcardInput[]>([{ front: '', back: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCard = () => {
    setCards([...cards, { front: '', back: '' }])
  }

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index))
    }
  }

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...cards]
    updated[index][field] = value
    setCards(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Título é obrigatório')
      return
    }

    const validCards = cards.filter(c => c.front.trim() && c.back.trim())
    if (validCards.length === 0) {
      setError('Adicione pelo menos um card válido')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) {
        router.push('/login')
        return
      }

      // Create deck
      const { data: deck, error: deckError } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: user.user.id,
          title: title.trim(),
          description: description.trim() || null,
          area: area || null,
        } as any)
        .select()
        .single()

      if (deckError) throw deckError

      const deckData = deck as FlashcardDeck

      // Create cards with SM-2 initial values
      const now = new Date().toISOString()
      const cardsToInsert = validCards.map(card => ({
        deck_id: deckData.id,
        front: card.front.trim(),
        back: card.back.trim(),
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: now,
      }))

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(cardsToInsert as any)

      if (cardsError) throw cardsError

      router.push(`/flashcards/${deckData.id}`)
    } catch (err) {
      console.error('Error creating deck:', err)
      setError('Erro ao criar deck. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Criar Novo Deck</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Deck Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações do Deck</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Farmacologia - Antibióticos"
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo deste deck..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                    text-white placeholder-slate-500 focus:outline-none focus:ring-2
                    focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Área (opcional)
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as ENAMEDArea | '')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
                    text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
                    focus:border-transparent"
                >
                  <option value="">Selecione uma área</option>
                  {(Object.keys(areaLabels) as ENAMEDArea[]).map((a) => (
                    <option key={a} value={a}>
                      {areaLabels[a]}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Flashcards</CardTitle>
                <span className="text-sm text-slate-400">
                  {cards.filter(c => c.front && c.back).length} cards válidos
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-400">
                      Card {index + 1}
                    </span>
                    {cards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCard(index)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Frente (Pergunta)
                      </label>
                      <textarea
                        value={card.front}
                        onChange={(e) => updateCard(index, 'front', e.target.value)}
                        placeholder="Digite a pergunta..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                          text-white placeholder-slate-500 focus:outline-none focus:ring-2
                          focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Verso (Resposta)
                      </label>
                      <textarea
                        value={card.back}
                        onChange={(e) => updateCard(index, 'back', e.target.value)}
                        placeholder="Digite a resposta..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                          text-white placeholder-slate-500 focus:outline-none focus:ring-2
                          focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCard}
                className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg
                  text-slate-400 hover:text-white hover:border-slate-600 transition-colors
                  flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Card
              </button>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Salvando...' : 'Criar Deck'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
