'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { DifficultySelector } from './components/DifficultySelector'
import { GeneratedQuestionPreview } from './components/GeneratedQuestionPreview'
import {
  useQuestionGenStore,
  selectCanGenerate,
  selectHasResult,
  selectTotalCost,
} from '@/lib/stores/questionGenStore'
import type { GeneratedQuestionData } from '@/lib/stores/questionGenStore'
import type { ENAMEDArea } from '@darwin-education/shared'

const areas: { key: ENAMEDArea; label: string; color: string; activeColor: string }[] = [
  {
    key: 'clinica_medica',
    label: 'Clínica Médica',
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  },
  {
    key: 'cirurgia',
    label: 'Cirurgia',
    color: 'text-red-400',
    activeColor: 'bg-red-500/20 text-red-400 border-red-500/50',
  },
  {
    key: 'ginecologia_obstetricia',
    label: 'GO',
    color: 'text-pink-400',
    activeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
  },
  {
    key: 'pediatria',
    label: 'Pediatria',
    color: 'text-green-400',
    activeColor: 'bg-green-500/20 text-green-400 border-green-500/50',
  },
  {
    key: 'saude_coletiva',
    label: 'Saúde Coletiva',
    color: 'text-purple-400',
    activeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  },
]

export default function GerarQuestaoPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  const store = useQuestionGenStore()
  const canGenerate = useQuestionGenStore(selectCanGenerate)
  const hasResult = useQuestionGenStore(selectHasResult)
  const totalCost = useQuestionGenStore(selectTotalCost)

  const handleGenerate = useCallback(async () => {
    if (!store.selectedArea) return

    store.setGenerating(true)
    store.setResult(null)
    store.setSaved(false)

    try {
      const response = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: store.selectedArea,
          topic: store.topic || undefined,
          difficulty: store.difficulty,
          focus: store.focus || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 401) {
          router.push('/login?redirectTo=/gerar-questao')
          return
        }

        if (response.status === 429) {
          store.setError(
            `Créditos de IA esgotados. Restam: ${errorData.remaining ?? 0}. Reinicia em: ${
              errorData.resetAt
                ? new Date(errorData.resetAt).toLocaleString('pt-BR')
                : 'amanhã'
            }`
          )
          return
        }

        store.setError(errorData.error || 'Erro ao gerar questão. Tente novamente.')
        return
      }

      const data = await response.json()

      const question: GeneratedQuestionData = data.parsed || tryParseQuestion(data.text)

      if (!question || !question.stem) {
        store.setError('A IA retornou um formato inválido. Tente novamente.')
        return
      }

      const result = {
        question,
        tokensUsed: data.tokensUsed ?? null,
        costBRL: data.costBRL ?? null,
        cached: data.cached ?? false,
        remaining: data.remaining ?? null,
        generatedAt: new Date().toISOString(),
      }

      store.setResult(result)
      store.addToHistory(result)
      store.setGenerating(false)
    } catch (err) {
      store.setError('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }, [store, router])

  const handleSave = useCallback(async () => {
    if (!store.result) return

    store.setSaving(true)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        router.push('/login?redirectTo=/gerar-questao')
        return
      }

      const q = store.result.question

      const { error } = await (supabase.from('questions') as any).insert({
        stem: q.stem,
        options: q.options,
        correct_answer: q.correct_index,
        explanation: q.explanation,
        area: q.area || store.selectedArea,
        topic: q.topic || store.topic || null,
        difficulty: q.irt?.difficulty ?? 0,
        discrimination: q.irt?.discrimination ?? 1.0,
        guessing: q.irt?.guessing ?? 0.25,
        question_bank: 'ai_generated',
        ai_provider: 'grok',
        ai_generation_cost: store.result.costBRL,
        status: 'pending_review',
        created_by: userData.user.id,
      })

      if (error) {
        store.setError(`Erro ao salvar: ${error.message}`)
        store.setSaving(false)
        return
      }

      store.setSaving(false)
      store.setSaved(true)
    } catch (err) {
      store.setError('Erro ao salvar a questão. Tente novamente.')
      store.setSaving(false)
    }
  }, [store, router])

  const handleRegenerate = useCallback(() => {
    store.setResult(null)
    store.setSaved(false)
    handleGenerate()
  }, [store, handleGenerate])

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gerar Questão com IA</h1>
              <p className="text-sm text-label-secondary mt-1">
                Crie questões no estilo ENAMED usando inteligência artificial
              </p>
            </div>
            {store.history.length > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-label-secondary">
                  {store.history.length} questão(ões) gerada(s)
                </p>
                {totalCost > 0 && (
                  <p className="text-xs text-label-tertiary">
                    Custo total: R$ {totalCost.toFixed(4)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Area Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Área</CardTitle>
                <CardDescription>Selecione a especialidade médica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {areas.map((area) => {
                    const isSelected = store.selectedArea === area.key

                    return (
                      <button
                        key={area.key}
                        onClick={() => store.setArea(isSelected ? null : area.key)}
                        className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                          isSelected
                            ? area.activeColor
                            : 'bg-surface-2/50 border-separator text-label-secondary hover:border-surface-4'
                        }`}
                      >
                        {area.label}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty */}
            <Card>
              <CardHeader>
                <CardTitle>Dificuldade</CardTitle>
                <CardDescription>Nível de dificuldade estimado</CardDescription>
              </CardHeader>
              <CardContent>
                <DifficultySelector
                  selected={store.difficulty}
                  onChange={store.setDifficulty}
                />
              </CardContent>
            </Card>

            {/* Topic & Focus */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes (Opcional)</CardTitle>
                <CardDescription>Refine o tema da questão</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Tópico"
                  placeholder="Ex: Insuficiência cardíaca, Diabetes tipo 2..."
                  value={store.topic}
                  onChange={(e) => store.setTopic(e.target.value)}
                />
                <Input
                  label="Foco especial"
                  placeholder="Ex: Diagnóstico diferencial, Tratamento..."
                  value={store.focus}
                  onChange={(e) => store.setFocus(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              fullWidth
              size="lg"
              loading={store.generating}
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {store.generating ? 'Gerando questão...' : 'Gerar Questão'}
            </Button>

            {store.result?.remaining != null && (
              <p className="text-xs text-center text-label-tertiary">
                {store.result.remaining} crédito(s) restante(s) hoje
              </p>
            )}
          </div>

          {/* Right Column - Result */}
          <div className="lg:col-span-2">
            {/* Error Display */}
            {store.error && (
              <Card className="border-red-800/50 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-red-300">{store.error}</p>
                      <button
                        onClick={() => store.setError(null)}
                        className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Question Preview */}
            {hasResult && store.result && (
              <GeneratedQuestionPreview
                question={store.result.question}
                tokensUsed={store.result.tokensUsed}
                costBRL={store.result.costBRL}
                cached={store.result.cached}
                onSave={handleSave}
                onRegenerate={handleRegenerate}
                saving={store.saving}
                saved={store.saved}
              />
            )}

            {/* Loading State */}
            {store.generating && (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 mx-auto mb-4" />
                  <p className="text-label-secondary">Gerando questão com IA...</p>
                  <p className="text-xs text-label-tertiary mt-2">
                    Isso pode levar alguns segundos
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!hasResult && !store.generating && !store.error && (
              <Card>
                <CardContent className="py-16 text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-surface-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-label-primary mb-2">
                    Pronto para gerar
                  </h3>
                  <p className="text-sm text-label-tertiary max-w-md mx-auto">
                    Selecione uma área médica e clique em &quot;Gerar Questão&quot; para
                    criar uma questão no estilo ENAMED usando inteligência artificial.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* History */}
            {store.history.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-label-secondary mb-3">
                  Histórico desta sessão ({store.history.length})
                </h3>
                <div className="space-y-3">
                  {store.history.slice(1).map((item, idx) => (
                    <Card key={idx} padding="sm" hover onClick={() => store.setResult(item)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-label-primary truncate">
                            {item.question.stem}
                          </p>
                          <p className="text-xs text-label-tertiary mt-1">
                            {item.question.area} - {new Date(item.generatedAt).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        {item.cached && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-cyan-500/20 text-cyan-400">
                            Cache
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function tryParseQuestion(text: string): GeneratedQuestionData | null {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    return parsed as GeneratedQuestionData
  } catch {
    return null
  }
}
