'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { useExamStore } from '@/lib/stores/examStore'
import { ExamTimer } from '../components/ExamTimer'
import { QuestionNavigation } from '../components/QuestionNavigation'
import { ExamQuestion } from '../components/ExamQuestion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card, CardContent } from '@/components/ui/Card'
import { FeatureState } from '@/components/ui/FeatureState'
import type { ENAMEDQuestion, IRTParameters, QuestionOntology, DifficultyLevel } from '@darwin-education/shared'

interface ExamData {
  id: string
  title: string
  description: string | null
  question_count: number
  time_limit_minutes: number
  question_ids: string[]
  type: string
  created_by: string | null
  is_public: boolean
  created_at: string
}

interface ExamAttemptData {
  id: string
  exam_id: string
  user_id: string
  answers: Record<string, any>
  marked_for_review: string[]
  completed_at: string | null
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const prevIndexRef = useRef(0)

  const {
    currentExam,
    currentQuestionIndex,
    answers,
    remainingTime,
    startExam,
    restoreExam,
    selectAnswer,
    toggleFlagQuestion,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    updateRemainingTime,
    resetExam,
  } = useExamStore()

  // Auto-save answers to DB every 30 seconds
  useEffect(() => {
    if (!currentExam) return
    const interval = setInterval(async () => {
      const state = useExamStore.getState()
      if (!state.attemptId || state.isSubmitted) return
      try {
        const supabase = createClient()
        const serializedAnswers: Record<string, number> = {}
        Object.entries(state.answers).forEach(([qId, ans]) => {
          if (ans.selectedAnswer !== null) {
            const question = state.currentExam?.questions.find(q => q.id === qId)
            const optIdx = question?.options.findIndex(o => o.text === ans.selectedAnswer) ?? -1
            serializedAnswers[qId] = optIdx
          }
        })
        const flagged = Object.entries(state.answers)
          .filter(([, a]) => a.flagged)
          .map(([qId]) => qId)
        await (supabase.from('exam_attempts') as any)
          .update({
            answers: serializedAnswers,
            marked_for_review: flagged,
          })
          .eq('id', state.attemptId)
      } catch {
        // Auto-save is best-effort
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [currentExam])

  useEffect(() => {
    async function loadExam() {
      const supabase = createClient()

      // Check for existing in-progress attempt
      const user = await getSessionUserSummary(supabase)
      if (!user) {
        router.push('/login?redirectTo=/simulado/' + examId)
        return
      }

      // Fetch exam details
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single() as { data: ExamData | null; error: any }

      if (examError || !exam) {
        setError('Simulado não encontrado')
        setLoading(false)
        return
      }

      // Validate exam has questions
      if (!exam.question_ids || exam.question_ids.length === 0) {
        setError('Este simulado não possui questões cadastradas')
        setLoading(false)
        return
      }

      // Fetch questions for this exam
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', exam.question_ids) as { data: any[] | null; error: any }

      if (questionsError || !questions || questions.length === 0) {
        setError('Erro ao carregar questões do simulado')
        setLoading(false)
        return
      }

      // Transform database questions to ENAMEDQuestion format
      const transformedQuestions: ENAMEDQuestion[] = questions.map((q: any) => ({
        id: q.id,
        bankId: q.bank_id,
        year: q.year,
        stem: q.stem,
        options: q.options,
        correctIndex: q.correct_index,
        explanation: q.explanation,
        irt: {
          difficulty: q.irt_difficulty,
          discrimination: q.irt_discrimination,
          guessing: q.irt_guessing,
          infit: q.irt_infit,
          outfit: q.irt_outfit,
        } as IRTParameters,
        difficulty: q.difficulty as DifficultyLevel,
        ontology: {
          area: q.area,
          subspecialty: q.subspecialty || '',
          topic: q.topic || '',
          icd10: q.icd10_codes,
          atcCodes: q.atc_codes,
        } as QuestionOntology,
        references: q.reference_list,
        isAIGenerated: q.is_ai_generated,
        validatedBy: q.validated_by,
        image_url: q.image_url ?? undefined,
      }))

      // Sort questions by the order in exam.question_ids
      const orderedQuestions = exam.question_ids
        .map((id: string) => transformedQuestions.find(q => q.id === id))
        .filter(Boolean) as ENAMEDQuestion[]

      if (orderedQuestions.length === 0) {
        setError('Nenhuma questão encontrada para este simulado')
        setLoading(false)
        return
      }

      // Check for existing attempt or create new one
      const { data: existingAttempt } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('user_id', user.id)
        .is('completed_at', null)
        .single() as { data: ExamAttemptData | null; error: any }

      let attemptId: string

      if (existingAttempt) {
        attemptId = existingAttempt.id
        // Restore state from existing attempt
        const savedAnswers = existingAttempt.answers || {}
        const savedFlagged = existingAttempt.marked_for_review || []
        const startedAt = (existingAttempt as any).started_at
        const elapsedSeconds = startedAt
          ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
          : 0

        restoreExam(
          {
            id: examId,
            title: exam.title,
            questions: orderedQuestions,
            timeLimit: exam.time_limit_minutes * 60,
          },
          attemptId,
          savedAnswers,
          savedFlagged,
          elapsedSeconds
        )
        setLoading(false)
        return
      } else {
        // Create new attempt
        const { data: newAttempt, error: attemptError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId,
            user_id: user.id,
            answers: {},
            marked_for_review: [],
          } as any)
          .select()
          .single() as { data: ExamAttemptData | null; error: any }

        if (attemptError || !newAttempt) {
          setError('Erro ao iniciar simulado')
          setLoading(false)
          return
        }

        attemptId = newAttempt.id
      }

      // Initialize exam store
      startExam(
        {
          id: examId,
          title: exam.title,
          questions: orderedQuestions,
          timeLimit: exam.time_limit_minutes * 60, // Convert to seconds
        },
        attemptId
      )

      setLoading(false)
    }

    loadExam()
  }, [examId, router, startExam, restoreExam])

  const handleSubmit = async () => {
    if (!currentExam) return

    setSubmitting(true)

    try {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login')
        return
      }

      // Calculate results using TRI
      const { calculateTRIScore } = await import('@darwin-education/shared')

      // Prepare responses for TRI calculation
      const responses = currentExam.questions.map((q) => ({
        questionId: q.id,
        correct: answers[q.id]?.selectedAnswer === q.options[q.correctIndex]?.text,
        area: q.ontology.area,
      }))

      // Create a Map of IRT parameters keyed by question ID
      const irtParams = new Map(
        currentExam.questions.map(q => [q.id, q.irt])
      )

      const triScore = calculateTRIScore(responses, irtParams)

      // Update attempt with results
      const attemptId = useExamStore.getState().attemptId
      const { error: updateError } = await (supabase
        .from('exam_attempts') as any)
        .update({
          answers: Object.fromEntries(
            Object.entries(answers).map(([qId, ans]) => {
              const question = currentExam.questions.find(q => q.id === qId)
              const optionIndex = question?.options.findIndex(o => o.text === ans.selectedAnswer)
              return [qId, optionIndex ?? -1]
            })
          ),
          completed_at: new Date().toISOString(),
          theta: triScore.theta,
          standard_error: triScore.standardError,
          scaled_score: triScore.scaledScore,
          passed: triScore.passed,
          correct_count: triScore.correctCount,
          area_breakdown: triScore.areaBreakdown,
          total_time_seconds: (currentExam.timeLimit - remainingTime),
        })
        .eq('id', attemptId)

      if (updateError) {
        console.error('Error saving results:', updateError)
      }

      // Track study activity for streak calculation
      const today = new Date().toISOString().split('T')[0]
      const questionsCount = currentExam.questions.length
      const timeSpent = currentExam.timeLimit - remainingTime
      try {
        const { error: rpcError } = await (supabase as any).rpc('update_study_activity', {
          p_user_id: user!.id,
          p_exams: 1,
          p_flashcards: 0,
          p_questions: questionsCount,
          p_time_seconds: timeSpent,
        })

        if (rpcError) {
          // Fall back to direct upsert if RPC doesn't exist
          await (supabase.from('study_activity') as any).upsert({
            user_id: user!.id,
            activity_date: today,
            exams_completed: 1,
            questions_answered: questionsCount,
            time_spent_seconds: timeSpent,
          }, {
            onConflict: 'user_id,activity_date',
          })
        }
      } catch {
        // Ignore errors - study activity is non-critical
      }

      // Trigger DDL analysis (fire-and-forget)
      if (attemptId) {
        fetch(`/api/ddl/exam/${attemptId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ processNow: true }),
        }).catch(() => { /* DDL is optional */ })
      }

      // Navigate to results page
      router.push(`/simulado/${examId}/result`)
    } catch (err) {
      console.error('Error submitting exam:', err)
      setError('Erro ao enviar simulado')
    } finally {
      setSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  const handleTimeUp = () => {
    setShowSubmitModal(true)
    handleSubmit()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FeatureState
            kind="loading"
            title="Carregando simulado"
            description="Estamos preparando suas questões e restaurando o progresso da sessão."
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
            title="Falha ao abrir simulado"
            description={error}
            action={{
              label: 'Voltar para simulados',
              onClick: () => router.push('/simulado'),
              variant: 'secondary',
            }}
          />
        </div>
      </div>
    )
  }

  if (!currentExam || currentExam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <FeatureState
              kind="empty"
              title="Simulado indisponível"
              description="Não foi possível carregar as questões deste simulado."
              action={{
                label: 'Voltar para Simulados',
                onClick: () => router.push('/simulado'),
                variant: 'secondary',
              }}
            />
            <Button variant="outline" onClick={() => router.refresh()} fullWidth className="darwin-nav-link mt-3">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = currentExam.questions[currentQuestionIndex]
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <FeatureState
              kind="error"
              title="Questão indisponível"
              description="A questão atual não pôde ser carregada. Você pode continuar em outra questão."
              action={{
                label: 'Tentar recuperar sessão',
                onClick: () =>
                  goToQuestion(
                    Math.max(0, Math.min(currentQuestionIndex, currentExam.questions.length - 1))
                  ),
              }}
            />
            <Button variant="outline" onClick={() => router.push('/simulado')} fullWidth className="darwin-nav-link mt-3">
              Voltar para Simulados
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  const answeredCount = Object.values(answers).filter(a => a.selectedAnswer !== null).length
  const direction = currentQuestionIndex >= prevIndexRef.current ? 1 : -1
  prevIndexRef.current = currentQuestionIndex

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-separator bg-surface-1/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-label-primary hidden sm:block">
              {currentExam.title}
            </h1>
            <span className="rounded-lg border border-separator/80 bg-surface-2/70 px-2.5 py-1 text-sm text-label-secondary">
              {answeredCount}/{currentExam.questions.length} respondidas
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ExamTimer
              initialTime={remainingTime}
              onTimeUp={handleTimeUp}
              onTick={updateRemainingTime}
            />
            <Button
              variant="outline"
              size="sm"
              className="darwin-nav-link"
              onClick={() => setShowSubmitModal(true)}
            >
              Finalizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation - Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <QuestionNavigation
                questions={currentExam.questions}
                currentIndex={currentQuestionIndex}
                answers={answers}
                onSelectQuestion={goToQuestion}
              />
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentQuestionIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={spring.snappy}
              >
                <ExamQuestion
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={currentExam.questions.length}
                  selectedAnswer={answers[currentQuestion.id]?.selectedAnswer}
                  isFlagged={answers[currentQuestion.id]?.flagged}
                  onAnswerSelect={(answer) => selectAnswer(currentQuestion.id, answer)}
                  onToggleFlag={() => toggleFlagQuestion(currentQuestion.id)}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                className="darwin-nav-link"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Anterior
              </Button>

              <Button
                className="darwin-nav-link"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === currentExam.questions.length - 1}
              >
                Próxima
              </Button>
            </div>

            {/* Mobile Question Navigation */}
            <div className="lg:hidden mt-6">
              <QuestionNavigation
                questions={currentExam.questions}
                currentIndex={currentQuestionIndex}
                answers={answers}
                onSelectQuestion={goToQuestion}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        title="Finalizar Simulado"
      >
        <div className="text-label-primary">
          <p className="mb-4">
            Você respondeu <strong>{answeredCount}</strong> de{' '}
            <strong>{currentExam.questions.length}</strong> questões.
          </p>

          {answeredCount < currentExam.questions.length && (
            <p className="text-yellow-400 mb-4">
              Atenção: {currentExam.questions.length - answeredCount} questões não foram
              respondidas e serão consideradas erradas.
            </p>
          )}

          <p>Deseja realmente finalizar o simulado?</p>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="darwin-nav-link"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
              fullWidth
            >
              Continuar
            </Button>
            <Button
              variant="primary"
              className="darwin-nav-link"
              onClick={handleSubmit}
              loading={submitting}
              fullWidth
            >
              Finalizar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
