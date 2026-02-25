'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Brain } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
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
import { FeatureState } from '@/components/ui/FeatureState'
import type { FCRCase, FCRLevel, ConfidenceRating } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FCRStartResponse {
  attemptId: string
  fcrCase: FCRCase
  attemptState?: {
    currentLevel?: FCRLevel
    selectedDados?: string[]
    selectedPadrao?: string | null
    selectedHipotese?: string | null
    selectedConduta?: string | null
    confidenceDados?: ConfidenceRating | null
    confidencePadrao?: ConfidenceRating | null
    confidenceHipotese?: ConfidenceRating | null
    confidenceConduta?: ConfidenceRating | null
    stepTimes?: Record<string, number>
    totalTimeSeconds?: number
    startedAt?: string | null
  } | null
}

interface PersistableFCRState {
  currentLevel: FCRLevel
  stepTimes: Record<string, number>
  stepStartedAt: number | null
  totalTimeSeconds: number
}

function toPersistableTiming(state: PersistableFCRState) {
  const mergedStepTimes = { ...state.stepTimes }
  if (state.stepStartedAt) {
    const elapsed = Math.max(
      0,
      Math.round((Date.now() - state.stepStartedAt) / 1000)
    )
    mergedStepTimes[state.currentLevel] =
      (mergedStepTimes[state.currentLevel] || 0) + elapsed
  }

  const totalTimeSeconds = Object.values(mergedStepTimes).reduce((sum, value) => {
    return sum + (Number.isFinite(value) ? Math.max(0, value) : 0)
  }, 0)

  return {
    stepTimes: mergedStepTimes,
    totalTimeSeconds: totalTimeSeconds || state.totalTimeSeconds || 0,
  }
}

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
    stepTimes,
    stepStartedAt,
    totalTimeSeconds,
    startedAt,
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
      const user = await getSessionUserSummary(supabase)
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

      const data = (await response.json()) as FCRStartResponse
      startCase(data.fcrCase, data.attemptId, data.attemptState || undefined)
      setLoading(false)
    }

    if (currentCase && currentCase.id !== caseId) {
      resetCase()
    }

    if (!currentCase || currentCase.id !== caseId || !attemptId) {
      loadCase()
    } else {
      if (!stepStartedAt && !isSubmitted) {
        startCase(currentCase, attemptId, {
          currentLevel,
          selectedDados,
          selectedPadrao,
          selectedHipotese,
          selectedConduta,
          confidenceDados,
          confidencePadrao,
          confidenceHipotese,
          confidenceConduta,
          stepTimes,
          totalTimeSeconds,
          startedAt: startedAt || null,
        })
      }
      setLoading(false)
    }
  }, [
    caseId,
    router,
    startCase,
    resetCase,
    currentCase,
    attemptId,
    stepStartedAt,
    currentLevel,
    selectedDados,
    selectedPadrao,
    selectedHipotese,
    selectedConduta,
    confidenceDados,
    confidencePadrao,
    confidenceHipotese,
    confidenceConduta,
    stepTimes,
    totalTimeSeconds,
    startedAt,
    isSubmitted,
  ])

  useEffect(() => {
    if (!currentCase || !attemptId || isSubmitted) return

    const supabase = createClient()

    async function saveDraftProgress() {
      const storeState = useFCRStore.getState()
      if (!storeState.attemptId || storeState.isSubmitted) return

      try {
        const timing = toPersistableTiming({
          currentLevel: storeState.currentLevel,
          stepTimes: storeState.stepTimes,
          stepStartedAt: storeState.stepStartedAt,
          totalTimeSeconds: storeState.totalTimeSeconds,
        })

        await (supabase.from('fcr_attempts') as any)
          .update({
            selected_dados: storeState.selectedDados,
            selected_padrao: storeState.selectedPadrao,
            selected_hipotese: storeState.selectedHipotese,
            selected_conduta: storeState.selectedConduta,
            confidence_dados: storeState.confidenceDados,
            confidence_padrao: storeState.confidencePadrao,
            confidence_hipotese: storeState.confidenceHipotese,
            confidence_conduta: storeState.confidenceConduta,
            step_times: timing.stepTimes,
            total_time_seconds: timing.totalTimeSeconds,
          })
          .eq('id', storeState.attemptId)
      } catch {
        // Auto-save is best-effort
      }
    }

    const intervalId = window.setInterval(() => {
      void saveDraftProgress()
    }, 15_000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void saveDraftProgress()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentCase, attemptId, isSubmitted])

  const handleSubmit = async () => {
    if (!currentCase || !attemptId) return
    setSubmitting(true)

    try {
      const storeState = useFCRStore.getState()
      const timing = toPersistableTiming({
        currentLevel: storeState.currentLevel,
        stepTimes: storeState.stepTimes,
        stepStartedAt: storeState.stepStartedAt,
        totalTimeSeconds: storeState.totalTimeSeconds,
      })

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
          stepTimes: timing.stepTimes,
          totalTimeSeconds: timing.totalTimeSeconds,
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
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="loading"
            title="Carregando caso clínico"
            description="Estamos preparando o fluxo fractal e recuperando seu progresso."
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="error"
            title="Falha ao carregar caso"
            description={error}
            action={{
              label: 'Voltar para FCR',
              onClick: () => router.push('/fcr'),
              variant: 'secondary',
            }}
          />
        </div>
      </div>
    )
  }

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="empty"
            title="Caso indisponível"
            description="Não foi possível preparar este caso de raciocínio clínico."
            action={{
              label: 'Voltar para FCR',
              onClick: () => router.push('/fcr'),
              variant: 'secondary',
            }}
          />
          <Button variant="bordered" onClick={() => router.refresh()} fullWidth className="darwin-nav-link mt-3">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

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
    <div className="min-h-screen bg-surface-0 text-label-primary">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-separator bg-surface-1/82 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-violet-400" />
              <div>
                <h1 className="text-lg font-semibold text-label-primary">
                  {currentCase.titlePt}
                </h1>
              </div>
            </div>
            <Button
              variant="bordered"
              size="sm"
              className="darwin-nav-link"
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
        <div className="darwin-image-tile mb-6 h-40">
          <Image
            src="/images/branding/fcr-hero-apple-v1.png"
            alt="Raciocínio clínico fractal"
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/55 to-surface-0/2" />
          <div className="relative z-[3] flex h-full items-end p-4">
            <p className="max-w-lg text-sm text-label-secondary">
              Estruture o raciocínio por níveis: dados, padrão, hipótese e conduta com autoconsciência metacognitiva.
            </p>
          </div>
        </div>

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
                transition={spring.snappy}
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
                <Button variant="bordered" className="darwin-nav-link" onClick={goBackLevel} fullWidth>
                  Voltar
                </Button>
              )}

              {isLastLevel ? (
                <Button
                  variant="filled"
                  className="darwin-nav-link"
                  onClick={handleSubmit}
                  disabled={!canAdvance || submitting}
                  loading={submitting}
                  fullWidth
                >
                  Finalizar
                </Button>
              ) : (
                <Button
                  variant="filled"
                  className="darwin-nav-link"
                  onClick={advanceLevel}
                  disabled={!canAdvance}
                  fullWidth
                >
                  Próximo
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
                  Leia atentamente a apresentação clínica. Siga o raciocínio fractal:
                  identifique os dados, reconheça o padrão, formule a hipótese e defina a conduta.
                  Avalie sua confiança em cada nível — isso revela seus pontos cegos metacognitivos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
