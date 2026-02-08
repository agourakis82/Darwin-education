'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Brain } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  useFCRStore,
  selectCanAdvanceFCR,
  selectIsLastLevel,
  selectIsFirstLevel,
} from '@/lib/stores/fcrStore'
import { FCRLevelIndicator } from '../components/FCRLevelIndicator'
import { FCRLevelContent } from '../components/FCRLevelContent'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { FCRCase, FCRLevel, ConfidenceRating, IRTParameters } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function FCRCasePage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.caseId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    currentCase,
    attemptId,
    currentLevel,
    selectedDados,
    selectedPadrao,
    selectedHipotese,
    selectedConduta,
    confidenceDados,
    confidencePadrao,
    confidenceHipotese,
    confidenceConduta,
    isSubmitted,
    startCase,
    toggleDados,
    selectPadrao,
    selectHipotese,
    selectConduta,
    setConfidence,
    advanceLevel,
    goBackLevel,
    submitCase,
    resetCase,
  } = useFCRStore()

  const state = useFCRStore()
  const canAdvance = selectCanAdvanceFCR(state)
  const isLastLevel = selectIsLastLevel(state)
  const isFirstLevel = selectIsFirstLevel(state)

  useEffect(() => {
    async function loadCase() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/fcr/' + caseId)
        return
      }

      // Start via API (creates attempt + returns stripped case)
      const response = await fetch('/api/fcr/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erro ao carregar caso')
        setLoading(false)
        return
      }

      const data = await response.json()
      startCase(data.fcrCase as FCRCase, data.attemptId)
      setLoading(false)
    }

    if (currentCase && currentCase.id !== caseId) {
      resetCase()
    }

    if (!currentCase || currentCase.id !== caseId) {
      loadCase()
    } else {
      setLoading(false)
    }
  }, [caseId, router, startCase, resetCase, currentCase])

  const handleSubmit = async () => {
    if (!currentCase || !attemptId) return
    setSubmitting(true)

    try {
      const storeState = useFCRStore.getState()

      const response = await fetch('/api/fcr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: storeState.attemptId,
          selectedDados: storeState.selectedDados,
          selectedPadrao: storeState.selectedPadrao,
          selectedHipotese: storeState.selectedHipotese,
          selectedConduta: storeState.selectedConduta,
          confidenceDados: storeState.confidenceDados,
          confidencePadrao: storeState.confidencePadrao,
          confidenceHipotese: storeState.confidenceHipotese,
          confidenceConduta: storeState.confidenceConduta,
          stepTimes: storeState.stepTimes,
          totalTimeSeconds: storeState.totalTimeSeconds,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erro ao enviar caso')
        return
      }

      const data = await response.json()
      submitCase(data.score)
      router.push(`/fcr/${caseId}/result`)
    } catch (err) {
      console.error('Error submitting FCR case:', err)
      setError('Erro ao enviar caso')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando caso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/fcr')}>Voltar</Button>
        </div>
      </div>
    )
  }

  if (!currentCase) return null

  // Get current level options
  const levelOptionsMap: Record<FCRLevel, any[]> = {
    dados: currentCase.dadosOptions || [],
    padrao: currentCase.padraoOptions || [],
    hipotese: currentCase.hipoteseOptions || [],
    conduta: currentCase.condutaOptions || [],
  }

  const currentOptions = levelOptionsMap[currentLevel] || []

  const selectedValueMap: Record<FCRLevel, string | null> = {
    dados: null,
    padrao: selectedPadrao,
    hipotese: selectedHipotese,
    conduta: selectedConduta,
  }

  const confidenceMap: Record<FCRLevel, ConfidenceRating | null> = {
    dados: confidenceDados,
    padrao: confidencePadrao,
    hipotese: confidenceHipotese,
    conduta: confidenceConduta,
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface-1 border-b border-separator">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-violet-400" />
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {currentCase.titlePt}
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetCase()
                router.push('/fcr')
              }}
            >
              Sair
            </Button>
          </div>
          <FCRLevelIndicator
            currentLevel={currentLevel}
            isSubmitted={isSubmitted}
            confidences={confidenceMap}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Clinical Presentation (sticky) */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Card>
              <CardContent className="py-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Apresentacao Clinica
                </h3>
                <div className="text-sm text-label-primary whitespace-pre-line leading-relaxed">
                  {currentCase.clinicalPresentationPt}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Level Content */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLevel}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <FCRLevelContent
                  level={currentLevel}
                  options={currentOptions}
                  selectedValue={selectedValueMap[currentLevel]}
                  selectedValues={currentLevel === 'dados' ? selectedDados : []}
                  confidence={confidenceMap[currentLevel]}
                  onSelect={(id) => {
                    if (currentLevel === 'padrao') selectPadrao(id)
                    else if (currentLevel === 'hipotese') selectHipotese(id)
                    else if (currentLevel === 'conduta') selectConduta(id)
                  }}
                  onToggle={toggleDados}
                  onConfidenceChange={(rating) => setConfidence(currentLevel, rating)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {!isFirstLevel && (
                <Button variant="outline" onClick={goBackLevel} fullWidth>
                  Voltar
                </Button>
              )}

              {isLastLevel ? (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!canAdvance || submitting}
                  loading={submitting}
                  fullWidth
                >
                  Finalizar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={advanceLevel}
                  disabled={!canAdvance}
                  fullWidth
                >
                  Proximo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-label-primary">
                <p>
                  Leia atentamente a apresentacao clinica. Siga o raciocinio fractal:
                  identifique os dados, reconheca o padrao, formule a hipotese e defina a conduta.
                  Avalie sua confianca em cada nivel — isso revela seus pontos cegos metacognitivos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
