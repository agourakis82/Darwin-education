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
  const [thetaHistory, setThetaHistory] = useState<number[]>([])

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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando simulado adaptativo...</p>
        </div>
      </div>
    )
  }

  // Error state (when no question is available)
  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/simulado/adaptive')}>Voltar</Button>
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
              variant="outline"
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
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar - Desktop only */}
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

            {/* Main Question Area */}
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
                  />
                </motion.div>
              </AnimatePresence>

              {/* Confirm Answer Button */}
              <div className="mt-6">
                <Button
                  variant="primary"
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
          </div>
        </div>

        {/* Early Submit Modal */}
        <Modal
          isOpen={showSubmitModal}
          onClose={() => !submitting && setShowSubmitModal(false)}
          title="Encerrar Antecipadamente"
        >
          <div className="text-label-primary">
            <p className="mb-4">
              Você respondeu <strong>{questionNumber}</strong> questões até agora.
            </p>

            <p className="text-yellow-400 mb-4">
              Encerrar o simulado antes do final pode gerar resultados menos precisos.
              A estimativa atual de precisão é de <strong>{Math.round(Math.min(100, Math.max(0, 100 - se * 300)))}%</strong>.
            </p>

            <p>Deseja realmente encerrar o simulado?</p>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                fullWidth
              >
                Voltar
              </Button>
              <Button
                variant="primary"
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
