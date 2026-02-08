'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCATStore } from '@/lib/stores/catStore'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea } from '@darwin-education/shared'
import { DEFAULT_CAT_CONFIG } from '@darwin-education/shared'

const ALL_AREAS: ENAMEDArea[] = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
]

const AREA_ICONS: Record<ENAMEDArea, React.ReactNode> = {
  clinica_medica: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  cirurgia: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  ginecologia_obstetricia: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  pediatria: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  saude_coletiva: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
}

export default function AdaptiveSetupPage() {
  const router = useRouter()
  const { startCAT } = useCATStore()

  const [selectedAreas, setSelectedAreas] = useState<ENAMEDArea[]>([...ALL_AREAS])
  const [minItems, setMinItems] = useState(DEFAULT_CAT_CONFIG.minItems)
  const [maxItems, setMaxItems] = useState(DEFAULT_CAT_CONFIG.maxItems)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleArea = (area: ENAMEDArea) => {
    setSelectedAreas((prev) => {
      if (prev.includes(area)) {
        // Prevent deselecting all areas
        if (prev.length === 1) return prev
        return prev.filter((a) => a !== area)
      }
      return [...prev, area]
    })
  }

  const handleStart = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: selectedAreas,
          minItems,
          maxItems,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao iniciar o simulado adaptativo')
      }

      const data = await response.json()

      startCAT({
        examId: data.examId,
        attemptId: data.attemptId,
        config: data.config,
        session: data.session,
        firstQuestion: data.question,
      })

      router.push(`/simulado/adaptive/${data.examId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar o simulado adaptativo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/simulado')}
              className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Simulado Adaptativo</h1>
              <p className="text-sm text-label-secondary mt-1">
                Teste inteligente que se adapta ao seu nível
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Area Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Areas do Conhecimento</CardTitle>
              <CardDescription>
                Selecione as areas que deseja incluir. Pelo menos 1 area deve estar selecionada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ALL_AREAS.map((area) => {
                  const isSelected = selectedAreas.includes(area)
                  const colors = AREA_COLORS[area]

                  return (
                    <button
                      key={area}
                      onClick={() => toggleArea(area)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.text} ${colors.border} border-current`
                          : 'bg-surface-2/50 border-separator hover:border-surface-4 text-label-secondary'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`mb-2 ${isSelected ? '' : 'text-label-tertiary'}`}>
                          {AREA_ICONS[area]}
                        </div>
                        <span className="text-sm font-medium">{AREA_LABELS[area]}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuracao</CardTitle>
              <CardDescription>
                Defina o numero minimo e maximo de questoes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Minimo de itens"
                    type="number"
                    min={10}
                    max={maxItems}
                    value={minItems}
                    onChange={(e) => setMinItems(Math.max(10, Number(e.target.value)))}
                  />
                </div>
                <div>
                  <Input
                    label="Maximo de itens"
                    type="number"
                    min={minItems}
                    max={180}
                    value={maxItems}
                    onChange={(e) => setMaxItems(Math.max(minItems, Number(e.target.value)))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle>Como funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-label-secondary leading-relaxed">
                  O simulado adaptativo seleciona questoes baseado no seu desempenho em tempo real.
                  Questoes mais dificeis sao apresentadas quando voce acerta, e mais faceis quando erra.
                  O teste termina quando a precisao e suficiente ou o numero maximo de itens e atingido.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Start button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleStart}
          >
            Iniciar Simulado Adaptativo
          </Button>
        </div>
      </main>
    </div>
  )
}
