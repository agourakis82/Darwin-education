'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Card, CardContent } from '@/components/ui/Card'
import { QuestionCard } from '@/components/ui/QuestionCard'
import { AREA_LABELS } from '@/lib/area-colors'
import { useToast } from '@/lib/hooks/useToast'
import type { ENAMEDQuestion, IRTParameters, QuestionOntology, DifficultyLevel } from '@darwin-education/shared'

interface QuestionReview {
  question: ENAMEDQuestion
  userAnswer: number
  isCorrect: boolean
  timeTaken?: number
}

export default function ExamReviewPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<QuestionReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [examTitle, setExamTitle] = useState('')
  const [savingToFlashcards, setSavingToFlashcards] = useState<Set<string>>(new Set())
  const [savedFlashcards, setSavedFlashcards] = useState<Set<string>>(new Set())
  const [flashcardStatusMessage, setFlashcardStatusMessage] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  useEffect(() => {
    async function loadReview() {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login')
        return
      }

      interface AttemptRow {
        id: string
        answers: Record<string, number>
        exam_id: string
        exams: {
          title: string
          question_ids: string[]
        } | null
      }

      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('id, answers, exam_id, exams(title, question_ids)')
        .eq('exam_id', examId)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single() as { data: AttemptRow | null; error: any }

      if (attemptError || !attempt || !attempt.exams) {
        console.error('Error loading attempt:', attemptError)
        router.push(`/simulado/${examId}`)
        return
      }

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', attempt.exams.question_ids) as { data: any[] | null; error: any }

      if (questionsError || !questions) {
        console.error('Error loading questions:', questionsError)
        router.push(`/simulado/${examId}`)
        return
      }

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

      const reviewData: QuestionReview[] = attempt.exams.question_ids
        .map((qId: string) => {
          const question = transformedQuestions.find(q => q.id === qId)
          if (!question) return null
          const userAnswer = attempt.answers[qId] ?? -1
          const isCorrect = userAnswer === question.correctIndex
          return { question, userAnswer, isCorrect }
        })
        .filter(Boolean) as QuestionReview[]

      setReviews(reviewData)
      setExamTitle(attempt.exams.title)
      setLoading(false)
    }

    loadReview()
  }, [examId, router])

  const handleSaveToFlashcards = async (questionId: string) => {
    setSavingToFlashcards(prev => new Set(prev).add(questionId))
    setFlashcardStatusMessage(null)

    try {
      const review = reviews.find(r => r.question.id === questionId)
      if (!review) {
        const message = 'Não foi possível identificar esta questão para salvar.'
        setFlashcardStatusMessage(message)
        toastError(message)
        return
      }

      const correctOption = review.question.options[review.question.correctIndex]
      const userOption = review.question.options[review.userAnswer]

      const front = review.question.stem
      const back = [
        `**Resposta correta:** ${correctOption?.text || 'N/A'}`,
        '',
        userOption ? `**Sua resposta:** ${userOption.text}` : '',
        '',
        `**Explicacao:**`,
        review.question.explanation,
      ].filter(Boolean).join('\n')

      const response = await fetch('/api/flashcards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front,
          back,
          area: review.question.ontology.area,
          subspecialty: review.question.ontology.subspecialty,
          topic: review.question.ontology.topic,
          questionId,
          tags: ['erro-simulado', review.question.ontology.area],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error creating flashcard:', error)
        const message = 'Erro ao salvar flashcard. Tente novamente.'
        setFlashcardStatusMessage(message)
        toastError(message)
        return
      }

      const successMessage = 'Questão adicionada aos flashcards.'
      setSavedFlashcards(prev => new Set(prev).add(questionId))
      setFlashcardStatusMessage(successMessage)
      toastSuccess(successMessage)
    } catch (error) {
      console.error('Error saving to flashcards:', error)
      const message = 'Erro ao salvar flashcard. Tente novamente.'
      setFlashcardStatusMessage(message)
      toastError(message)
    } finally {
      setSavingToFlashcards(prev => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  const currentReview = reviews[currentIndex]
  const correctCount = reviews.filter(r => r.isCorrect).length
  const incorrectCount = reviews.length - correctCount

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-label-secondary">Carregando revisão...</p>
        </div>
      </div>
    )
  }

  if (!currentReview) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-label-primary mb-2">Revisão indisponível</h2>
            <p className="text-label-secondary mb-6">
              Não há respostas válidas para revisar neste simulado.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push(`/simulado/${examId}/result`)} fullWidth>
                Voltar aos Resultados
              </Button>
              <Button variant="bordered" onClick={() => router.push('/simulado')} fullWidth>
                Ver Simulados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface-1/85 backdrop-blur-xl border-b border-separator">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-label-primary">{examTitle}</h1>
            <p className="text-sm text-label-secondary">
              Revisão: {currentIndex + 1} de {reviews.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-emerald-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {correctCount}
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {incorrectCount}
              </div>
            </div>

            <Button
              variant="bordered"
              size="sm"
              onClick={() => router.push(`/simulado/${examId}/result`)}
            >
              Voltar aos Resultados
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={spring.snappy}
            className="space-y-4"
          >
            {/* Status + IRT row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {/* Acertou/Errou badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border shadow-inner-shine ${
                  currentReview.isCorrect
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border-red-500/30'
                }`}>
                  {currentReview.isCorrect ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Acertou
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Errou
                    </>
                  )}
                </div>

                {/* IRT Signature */}
                {currentReview.question.irt && (
                  <div className="hidden sm:flex gap-2">
                    <span className="px-3 py-1 bg-surface-3 rounded-full text-xs font-medium text-label-secondary border border-separator flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-label-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Dificuldade: {
                        currentReview.question.irt.difficulty < -1 ? 'Baixa' :
                        currentReview.question.irt.difficulty < 1 ? 'Média' : 'Alta'
                      }
                    </span>
                    <span className="px-3 py-1 bg-surface-3 rounded-full text-xs font-medium text-label-secondary border border-separator flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-label-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Impacto: {
                        currentReview.question.irt.discrimination < 0.8 ? 'Focado' :
                        currentReview.question.irt.discrimination < 1.5 ? 'Alto' : 'Crítico'
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <span className="px-2 py-1 bg-surface-2 rounded text-xs">
                  {AREA_LABELS[currentReview.question.ontology.area]}
                </span>
                {currentReview.question.ontology?.topic && (
                  <span className="text-label-tertiary">{currentReview.question.ontology.topic}</span>
                )}
              </div>
            </div>

            {/* QuestionCard — replaces all custom option + explanation rendering */}
            <QuestionCard
              question={currentReview.question}
              questionNumber={currentIndex + 1}
              totalQuestions={reviews.length}
              selectedAnswer={
                currentReview.userAnswer >= 0
                  ? currentReview.question.options[currentReview.userAnswer]?.text ?? null
                  : null
              }
              showCorrectAnswer
              showExplanation
              disabled
            />

            {/* References */}
            {currentReview.question.references && currentReview.question.references.length > 0 && (
              <div
                className="darwin-panel border border-separator/40 rounded-2xl p-5"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.08)' }}
              >
                <h4 className="text-footnote font-semibold text-label-secondary mb-2">Referências</h4>
                <ul className="list-disc list-inside text-footnote text-label-tertiary space-y-1">
                  {currentReview.question.references.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save to Flashcards (only for incorrect) */}
            {!currentReview.isCorrect && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-label-primary">Adicionar aos Flashcards</h4>
                      <p className="text-sm text-label-secondary">
                        Salve esta questão para revisar mais tarde
                      </p>
                      {flashcardStatusMessage && (
                        <p className="text-sm text-label-primary mt-2">{flashcardStatusMessage}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSaveToFlashcards(currentReview.question.id)}
                    disabled={savingToFlashcards.has(currentReview.question.id) || savedFlashcards.has(currentReview.question.id)}
                    loading={savingToFlashcards.has(currentReview.question.id)}
                  >
                    {savedFlashcards.has(currentReview.question.id)
                      ? 'Salvo'
                      : savingToFlashcards.has(currentReview.question.id)
                        ? 'Salvando...'
                        : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <motion.div
                whileHover={currentIndex !== 0 ? { x: -2 } : undefined}
                whileTap={currentIndex !== 0 ? { scale: 0.97 } : undefined}
                transition={spring.snappy}
              >
                <Button
                  variant="bordered"
                  onClick={() => { setDirection(-1); setCurrentIndex(prev => Math.max(0, prev - 1)) }}
                  disabled={currentIndex === 0}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Anterior
                </Button>
              </motion.div>

              <div className="text-sm text-label-secondary">
                Questão {currentIndex + 1} de {reviews.length}
              </div>

              <motion.div
                whileHover={currentIndex !== reviews.length - 1 ? { x: 2 } : undefined}
                whileTap={currentIndex !== reviews.length - 1 ? { scale: 0.97 } : undefined}
                transition={spring.snappy}
              >
                <Button
                  onClick={() => { setDirection(1); setCurrentIndex(prev => Math.min(reviews.length - 1, prev + 1)) }}
                  disabled={currentIndex === reviews.length - 1}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Próxima
                </Button>
              </motion.div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3">
              <Button
                variant="bordered"
                size="sm"
                onClick={() => {
                  const nextIncorrect = reviews.findIndex((r, idx) => idx > currentIndex && !r.isCorrect)
                  if (nextIncorrect !== -1) { setDirection(1); setCurrentIndex(nextIncorrect) }
                }}
              >
                Próxima Errada
              </Button>
              <Button
                variant="bordered"
                size="sm"
                onClick={() => {
                  const nextCorrect = reviews.findIndex((r, idx) => idx > currentIndex && r.isCorrect)
                  if (nextCorrect !== -1) { setDirection(1); setCurrentIndex(nextCorrect) }
                }}
              >
                Próxima Certa
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
