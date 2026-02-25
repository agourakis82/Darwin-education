'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useCATStore } from '@/lib/stores/catStore'
import { useCATTelemetry } from '@/lib/hooks/useCATTelemetry'
import { useShadowPrefetch } from '@/lib/hooks/useShadowPrefetch'
import { AdaptiveErrorBoundary } from '../components/AdaptiveErrorBoundary'
import { CATProgress } from '../components/CATProgress'
import { ThetaIndicator } from '../components/ThetaIndicator'
import { CATAreaCoverage } from '../components/CATAreaCoverage'
import { ExamQuestion } from '../../components/ExamQuestion'
import { getAreaCoverage } from '@darwin-education/shared'
import type { ENAMEDQuestion } from '@darwin-education/shared'

export default function CATExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [theta, setTheta] = useState(0)
  const [se, setSe] = useState(1)
  const [thetaHistory, setThetaHistory] = useState<any[]>([])

  const {
    config,
    sessionId,
    currentQuestion,
    currentAnswer,
    questionNumber,
    attemptId,
    loading,
    submitting,
    error,
    selectAnswer,
    confirmAnswer,
    setSubmitting,
    setError,
    resetCAT,
    setPrefetchedQuestion,
    consumePrefetchedQuestion,
    prefetchedQuestion,
  } = useCATStore()

  // Initialize telemetry
  const telemetry = useCATTelemetry(sessionId)

  // Initialize shadow prefetch
  const { prefetchNextQuestion } = useShadowPrefetch()

  // Start telemetry capture when question changes
  useEffect(() => {
    if (currentQuestion) {
      telemetry.startItemCapture(currentQuestion.id, questionNumber)
    }

    return () => {
      if (currentQuestion) {
        telemetry.stopItemCapture(currentQuestion.id, questionNumber)
      }
    }
  }, [currentQuestion?.id, questionNumber])

  // Redirect if no current question (e.g., page refreshed without store)
  useEffect(() => {
    if (!currentQuestion && !loading && !sessionId) {
      router.push('/simulado/adaptive')
    }
  }, [currentQuestion, loading, sessionId, router])

  // Resume session handler for error boundary
  const handleResumeSession = useCallback(async () => {
    if (!sessionId) {
      router.push('/simulado/adaptive')
      return
    }

    const response = await fetch(`/api/cat/resume?sessionId=${sessionId}`)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to resume session')
    }

    const data = await response.json()

    if (data.isComplete) {
      // Session is complete, go to results
      resetCAT()
      router.push(`/simulado/${examId}/result`)
      return
    }

    // Update store with resumed state
    if (data.question) {
      const resumedQuestion: ENAMEDQuestion = {
        ...data.question,
        correctIndex: -1,
        explanation: '',
      }
      confirmAnswer(resumedQuestion, data.questionNumber)
      setTheta(data.theta)
      setSe(data.se)
      setThetaHistory(data.thetaHistory || [])
    }
  }, [sessionId, examId, router, resetCAT, confirmAnswer])

  // Reset handler for error boundary
  const handleResetSession = useCallback(() => {
    resetCAT()
    router.push('/simulado/adaptive')
  }, [resetCAT, router])

  const handleConfirmAnswer = async () => {
    if (!currentAnswer || !currentQuestion || !sessionId || !attemptId) return

    setSubmitting(true)
    setError(null)

    // Find the index of the selected answer in the options
    const selectedAnswerIndex = currentQuestion.options.findIndex(
      (opt) => opt.text === currentAnswer
    )

    // Record submission in telemetry
    telemetry.recordAnswerSubmitted(currentQuestion.id, selectedAnswerIndex, false) // isCorrect will be updated after response

    try {
      const response = await fetch('/api/cat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          sessionId,
          questionId: currentQuestion.id,
          selectedAnswerIndex,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao enviar resposta')
      }

      const data = await response.json()

      // Update isCorrect in telemetry after we know the result
      telemetry.recordAnswerSubmitted(currentQuestion.id, selectedAnswerIndex, data.correct)

      if (!data.isComplete) {
        // Check if we have a prefetched question
        const prefetched = consumePrefetchedQuestion()

        if (prefetched && prefetched.id === data.question?.id) {
          // Use prefetched question (instant transition)
          confirmAnswer(prefetched, data.questionNumber)
        } else {
          // Use server response
          const nextQuestion: ENAMEDQuestion = {
            ...data.question,
            correctIndex: -1,
            explanation: '',
          }
          confirmAnswer(nextQuestion, data.questionNumber)
        }

        // Pre-fetch next question in background
        prefetchNextQuestion({ sessionId, attemptId, config: config || undefined }).then(
          (prefetchedQuestion) => {
            if (prefetchedQuestion) {
              setPrefetchedQuestion(prefetchedQuestion)
            }
          }
        )
      } else {
        // CAT is complete
        confirmAnswer(null)

        // Submit final results
        const submitResponse = await fetch('/api/cat/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            sessionId,
          }),
        })

        if (!submitResponse.ok) {
          console.error('Error submitting CAT results')
        }

        // Flush telemetry before navigating
        await telemetry.flushEvents()

        resetCAT()
        router.push(`/simulado/${examId}/result`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar resposta')
      setSubmitting(false)
    }
  }

  const handleEarlySubmit = async () => {
    if (!attemptId || !sessionId) return

    setSubmitting(true)
    setError(null)

    try {
      const submitResponse = await fetch('/api/cat/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          sessionId,
        }),
      })

      if (!submitResponse.ok) {
        const data = await submitResponse.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao finalizar simulado')
      }

      // Flush telemetry before navigating
      await telemetry.flushEvents()

      resetCAT()
      router.push(`/simulado/${examId}/result`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar simulado')
    } finally {
      setSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  // Handle option selection with telemetry
  const handleAnswerSelect = useCallback(
    (answer: string) => {
      const optionIndex = currentQuestion?.options.findIndex((opt) => opt.text === answer) ?? -1

      if (currentAnswer) {
        // Recording a change
        const previousIndex = currentQuestion?.options.findIndex((opt) => opt.text === currentAnswer) ?? -1
        telemetry.recordOptionChanged(currentQuestion?.id || '', previousIndex, optionIndex)
      } else {
        // First selection
        telemetry.recordOptionSelected(currentQuestion?.id || '', optionIndex, answer)
      }

      selectAnswer(answer)
    },
    [currentQuestion, currentAnswer, selectAnswer, telemetry]
  )

  // Loading state
  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-label-primary font-medium">Carregando questão</p>
            <p className="text-sm text-label-secondary mt-1">O algoritmo adaptativo está preparando sua próxima questão...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-surface-1 border border-red-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-label-primary">Erro ao carregar questão</p>
            <p className="text-sm text-label-secondary mt-1">{error}</p>
          </div>
          <Button variant="bordered" fullWidth onClick={() => router.push('/simulado/adaptive')}>
            Voltar ao início
          </Button>
        </div>
      </div>
    )
  }

  const areaCoverage = thetaHistory.length > 0 ? getAreaCoverage({
    theta,
    se,
    itemsAdministered: [],
    responses: [],
    itemAreas: [],
    thetaHistory,
    isComplete: false,
  }) : undefined

  return (
    <AdaptiveErrorBoundary
      sessionId={sessionId}
      onResume={handleResumeSession}
      onReset={handleResetSession}
    >
      <div className="min-h-screen bg-surface-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-surface-1 border-b border-separator">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-label-primary hidden sm:block whitespace-nowrap">
                Simulado Adaptativo
              </h1>
              <div className="flex-1 min-w-0">
                {config && (
                  <CATProgress
                    questionNumber={questionNumber}
                    precision={Math.min(100, Math.max(0, 100 - se * 300))}
                    minItems={config.minItems}
                    maxItems={config.maxItems}
                    isComplete={false}
                  />
                )}
              </div>
            </div>

            <Button
              variant="bordered"
              size="sm"
              onClick={() => setShowSubmitModal(true)}
            >
              Encerrar
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-red-400 flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-400 transition-colors"
                aria-label="Fechar aviso"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Question Area — left 2/3 on desktop */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={questionNumber}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={spring.snappy}
                >
                  <ExamQuestion
                    question={currentQuestion}
                    questionNumber={questionNumber}
                    totalQuestions={config?.maxItems ?? 80}
                    selectedAnswer={currentAnswer}
                    isFlagged={false}
                    onAnswerSelect={handleAnswerSelect}
                    onToggleFlag={() => {}}
                    hideFlagButton
                  />
                </motion.div>
              </AnimatePresence>

              {/* Confirm Answer Button */}
              <div className="mt-6">
                <Button
                  variant="filled"
                  size="lg"
                  fullWidth
                  disabled={!currentAnswer}
                  loading={submitting}
                  onClick={handleConfirmAnswer}
                >
                  Confirmar Resposta
                </Button>
              </div>

              {/* Mobile: Theta + Area Coverage */}
              <div className="lg:hidden mt-6 space-y-4">
                <ThetaIndicator
                  theta={theta}
                  se={se === Infinity ? 3 : se}
                  thetaHistory={thetaHistory}
                />
                {areaCoverage && (
                  <CATAreaCoverage
                    areaCoverage={areaCoverage}
                    totalItems={questionNumber}
                  />
                )}
              </div>
            </div>

            {/* Right sidebar — Desktop only */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <ThetaIndicator
                  theta={theta}
                  se={se === Infinity ? 3 : se}
                  thetaHistory={thetaHistory}
                />
                {areaCoverage && (
                  <CATAreaCoverage
                    areaCoverage={areaCoverage}
                    totalItems={questionNumber}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Early Submit Modal */}
        <Modal
          isOpen={showSubmitModal}
          onClose={() => !submitting && setShowSubmitModal(false)}
          title="Encerrar Antecipadamente"
        >
          <div className="text-label-primary space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold tabular-nums">{questionNumber}</p>
                <p className="text-xs text-label-secondary mt-0.5">questões respondidas</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold tabular-nums ${Math.round(Math.min(100, Math.max(0, 100 - se * 300))) >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {Math.round(Math.min(100, Math.max(0, 100 - se * 300)))}%
                </p>
                <p className="text-xs text-label-secondary mt-0.5">precisão atual</p>
              </div>
            </div>

            {/* Warning */}
            {config && questionNumber < config.minItems ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-400">
                  O mínimo configurado é de <strong>{config.minItems}</strong> questões. Encerrar agora pode gerar uma estimativa pouco confiável.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-yellow-400">
                  Continuar respondendo aumenta a precisão da sua estimativa de desempenho.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="bordered"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                fullWidth
              >
                Continuar
              </Button>
              <Button
                variant="filled"
                onClick={handleEarlySubmit}
                loading={submitting}
                fullWidth
              >
                Encerrar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdaptiveErrorBoundary>
  )
}
