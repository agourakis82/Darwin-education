'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { AREA_LABELS } from '@/lib/area-colors'
import { useToast } from '@/lib/hooks/useToast'
import type { ENAMEDArea } from '@darwin-education/shared'


interface FlashcardEdit {
  id?: string
  front: string
  back: string
  isNew?: boolean
  isDeleted?: boolean
}

interface DeckData {
  id: string
  name: string
  description: string | null
  area: ENAMEDArea | null
}

export default function EditDeckPage() {
  const params = useParams()
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<DeckData | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState<ENAMEDArea | ''>('')
  const [cards, setCards] = useState<FlashcardEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadDeck()
  }, [deckId])

  async function loadDeck() {
    const supabase = createClient()

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
    setTitle(deckData.name)
    setDescription(deckData.description || '')
    setArea(deckData.area || '')

    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('id, front, back')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true }) as { data: { id: string; front: string; back: string }[] | null; error: any }

    if (cardsData) {
      setCards(cardsData.map((c) => ({ ...c, isNew: false, isDeleted: false })))
    }

    setLoading(false)
  }

  const addCard = () => {
    setCards([...cards, { front: '', back: '', isNew: true }])
  }

  const removeCard = (index: number) => {
    const card = cards[index]
    if (card.isNew) {
      // Just remove new cards from the list
      setCards(cards.filter((_, i) => i !== index))
    } else {
      // Mark existing cards as deleted
      const updated = [...cards]
      updated[index] = { ...updated[index], isDeleted: true }
      setCards(updated)
    }
  }

  const restoreCard = (index: number) => {
    const updated = [...cards]
    updated[index] = { ...updated[index], isDeleted: false }
    setCards(updated)
  }

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...cards]
    updated[index] = { ...updated[index], [field]: value }
    setCards(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Título é obrigatório')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      // Update deck
      const { error: deckError } = await (supabase
        .from('flashcard_decks') as any)
        .update({
          name: title.trim(),
          description: description.trim() || null,
          area: area || null,
        })
        .eq('id', deckId)

      if (deckError) throw deckError

      // Handle card changes
      const now = new Date().toISOString()

      // Delete marked cards
      const toDelete = cards.filter(c => c.isDeleted && c.id)
      if (toDelete.length > 0) {
        await supabase
          .from('flashcards')
          .delete()
          .in('id', toDelete.map(c => c.id) as any)
      }

      // Update existing cards
      const toUpdate = cards.filter(c => !c.isNew && !c.isDeleted && c.id)
      for (const card of toUpdate) {
        await (supabase
          .from('flashcards') as any)
          .update({ front: card.front.trim(), back: card.back.trim() })
          .eq('id', card.id)
      }

      // Insert new cards
      const toInsert = cards
        .filter(c => c.isNew && !c.isDeleted && c.front.trim() && c.back.trim())
        .map(c => ({
          deck_id: deckId,
          front: c.front.trim(),
          back: c.back.trim(),
          ease_factor: 2.5,
          interval: 0,
          repetitions: 0,
          next_review: now,
        }))

      if (toInsert.length > 0) {
        await supabase.from('flashcards').insert(toInsert as any)
      }

      toastSuccess('Alterações salvas com sucesso!')
      router.push(`/flashcards/${deckId}`)
    } catch (err) {
      console.error('Error updating deck:', err)
      toastError('Erro ao salvar alterações. Tente novamente.')
      setError('Erro ao salvar alterações. Tente novamente.')
      setSaving(false)
    }
  }

  const handleDeleteDeck = async () => {
    const supabase = createClient()

    try {
      // Delete all cards first
      const { error: cardsError } = await supabase.from('flashcards').delete().eq('deck_id', deckId)
      if (cardsError) throw cardsError

      // Delete deck
      const { error: deckError } = await supabase.from('flashcard_decks').delete().eq('id', deckId)
      if (deckError) throw deckError

      toastSuccess('Deck excluído com sucesso')
      router.push('/flashcards')
    } catch (err) {
      console.error('Error deleting deck:', err)
      toastError('Erro ao excluir o deck. Tente novamente.')
      setError('Erro ao excluir o deck. Tente novamente.')
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeCards = cards.filter(c => !c.isDeleted)
  const deletedCards = cards.filter(c => c.isDeleted)

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Editar Deck</h1>
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
                <label className="block text-sm font-medium text-label-primary mb-1.5">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o conteúdo deste deck..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg
                    text-white placeholder-label-tertiary focus:outline-none focus:ring-2
                    focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-label-primary mb-1.5">
                  Área (opcional)
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as ENAMEDArea | '')}
                  className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg
                    text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
                    focus:border-transparent"
                >
                  <option value="">Selecione uma área</option>
                  {(Object.keys(AREA_LABELS) as ENAMEDArea[]).map((a) => (
                    <option key={a} value={a}>
                      {AREA_LABELS[a]}
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
                <span className="text-sm text-label-secondary">
                  {activeCards.length} cards
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeCards.map((card, index) => {
                const realIndex = cards.indexOf(card)
                return (
                  <div
                    key={card.id || `new-${index}`}
                    className={`p-4 bg-surface-2/50 rounded-lg border ${
                      card.isNew ? 'border-emerald-700' : 'border-separator'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-label-secondary">
                        {card.isNew ? 'Novo Card' : `Card ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCard(realIndex)}
                        className="p-1 text-label-tertiary hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-label-secondary mb-1">
                          Frente (Pergunta)
                        </label>
                        <textarea
                          value={card.front}
                          onChange={(e) => updateCard(realIndex, 'front', e.target.value)}
                          placeholder="Digite a pergunta..."
                          rows={3}
                          className="w-full px-3 py-2 bg-surface-1 border border-separator rounded-lg
                            text-white placeholder-label-tertiary focus:outline-none focus:ring-2
                            focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-label-secondary mb-1">
                          Verso (Resposta)
                        </label>
                        <textarea
                          value={card.back}
                          onChange={(e) => updateCard(realIndex, 'back', e.target.value)}
                          placeholder="Digite a resposta..."
                          rows={3}
                          className="w-full px-3 py-2 bg-surface-1 border border-separator rounded-lg
                            text-white placeholder-label-tertiary focus:outline-none focus:ring-2
                            focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Deleted Cards */}
              {deletedCards.length > 0 && (
                <div className="pt-4 border-t border-separator">
                  <p className="text-sm text-label-secondary mb-2">
                    Cards marcados para exclusão ({deletedCards.length})
                  </p>
                  {deletedCards.map((card) => {
                    const realIndex = cards.indexOf(card)
                    return (
                      <div
                        key={card.id}
                        className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center justify-between mb-2"
                      >
                        <span className="text-sm text-red-300 truncate flex-1">
                          {card.front}
                        </span>
                        <button
                          type="button"
                          onClick={() => restoreCard(realIndex)}
                          className="text-xs text-red-400 hover:text-white transition-colors ml-2"
                        >
                          Restaurar
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={addCard}
                className="w-full py-3 border-2 border-dashed border-separator rounded-lg
                  text-label-secondary hover:text-white hover:border-surface-4 transition-colors
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
          <div className="flex gap-4 mb-8">
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
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-800 bg-red-900/10">
            <CardHeader>
              <CardTitle className="text-red-400">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Excluir este deck</p>
                  <p className="text-xs text-label-secondary">
                    Esta ação não pode ser desfeita. Todos os cards serão excluídos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  Excluir Deck
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-overlay p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-red-400">Confirmar Exclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-label-primary mb-6">
                  Tem certeza que deseja excluir o deck &quot;{deck?.name}&quot;?
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeleteDeck}
                    className="flex-1 bg-red-600 hover:bg-red-500"
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
