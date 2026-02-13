'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Card, CardContent } from '@/components/ui/Card'
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

      // Fetch exam attempt with answers
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

      // Fetch questions
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', attempt.exams.question_ids) as { data: any[] | null; error: any }

      if (questionsError || !questions) {
        console.error('Error loading questions:', questionsError)
        router.push(`/simulado/${examId}`)
        return
      }

      // Transform to ENAMEDQuestion format
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
      }))

      // Build review array
      const reviewData: QuestionReview[] = attempt.exams.question_ids
        .map((qId: string) => {
          const question = transformedQuestions.find(q => q.id === qId)
          if (!question) return null

          const userAnswer = attempt.answers[qId] ?? -1
          const isCorrect = userAnswer === question.correctIndex

          return {
            question,
            userAnswer,
            isCorrect,
          }
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

      // Build flashcard content
      const front = review.question.stem
      const back = [
        `**Resposta correta:** ${correctOption?.text || 'N/A'}`,
        '',
        userOption ? `**Sua resposta:** ${userOption.text}` : '',
        '',
        `**Explicacao:**`,
        review.question.explanation,
      ].filter(Boolean).join('\n')

      // Use the API to create flashcard
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
              <Button variant="outline" onClick={() => router.push('/simulado')} fullWidth>
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
      <div className="sticky top-0 z-40 bg-surface-1 border-b border-separator">
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
              variant="outline"
              size="sm"
              onClick={() => router.push(`/simulado/${examId}/result`)}
            >
              Voltar aos Resultados
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Question Card */}
        <Card className={`mb-6 ${
          currentReview.isCorrect
            ? 'border-emerald-800 bg-emerald-950/20'
            : 'border-red-800 bg-red-950/20'
        }`}>
          <CardContent>
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                currentReview.isCorrect
                  ? 'bg-emerald-900/50 text-emerald-300'
                  : 'bg-red-900/50 text-red-300'
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

              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <span className="px-2 py-1 bg-surface-2 rounded text-xs">
                  {AREA_LABELS[currentReview.question.ontology.area]}
                </span>
                {currentReview.question.ontology?.topic && (
                  <span className="text-label-tertiary">{currentReview.question.ontology.topic}</span>
                )}
              </div>
            </div>

            {/* Question Stem */}
            <div className="mb-6 whitespace-pre-wrap text-label-primary leading-relaxed">
              {currentReview.question.stem}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentReview.question.options.map((option, idx) => {
                const isUserAnswer = currentReview.userAnswer === idx
                const isCorrectAnswer = currentReview.question.correctIndex === idx

                let bgColor = 'bg-surface-2/50'
                let borderColor = 'border-separator'
                let textColor = 'text-label-primary'

                if (isCorrectAnswer) {
                  bgColor = 'bg-emerald-900/30'
                  borderColor = 'border-emerald-700'
                  textColor = 'text-emerald-200'
                } else if (isUserAnswer && !currentReview.isCorrect) {
                  bgColor = 'bg-red-900/30'
                  borderColor = 'border-red-700'
                  textColor = 'text-red-200'
                }

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${bgColor} ${borderColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                        isCorrectAnswer
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : isUserAnswer
                          ? 'border-red-500 bg-red-500/20 text-red-300'
                          : 'border-surface-4 text-label-secondary'
                      }`}>
                        {option.letter}
                      </div>
                      <div className="flex-1">
                        <p className={textColor}>{option.text}</p>
                        {isCorrectAnswer && (
                          <div className="mt-2 text-sm text-emerald-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Resposta Correta
                          </div>
                        )}
                        {isUserAnswer && !currentReview.isCorrect && (
                          <div className="mt-2 text-sm text-red-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Sua Resposta
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Explanation Card */}
        <Card className="mb-6 bg-surface-1/50">
          <CardContent>
            <h3 className="text-lg font-semibold text-label-primary mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Explicação
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-label-primary whitespace-pre-wrap">
                {currentReview.question.explanation}
              </p>
            </div>

            {/* References */}
            {currentReview.question.references && currentReview.question.references.length > 0 && (
              <div className="mt-4 pt-4 border-t border-separator">
                <h4 className="text-sm font-medium text-label-secondary mb-2">Referências:</h4>
                <ul className="list-disc list-inside text-sm text-label-tertiary space-y-1">
                  {currentReview.question.references.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save to Flashcards (only for incorrect) */}
        {!currentReview.isCorrect && (
          <Card className="mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-800/50">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
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
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </Button>

          <div className="text-sm text-label-secondary">
            Questão {currentIndex + 1} de {reviews.length}
          </div>

          <Button
            onClick={() => setCurrentIndex(prev => Math.min(reviews.length - 1, prev + 1))}
            disabled={currentIndex === reviews.length - 1}
          >
            Próxima
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextIncorrect = reviews.findIndex((r, idx) => idx > currentIndex && !r.isCorrect)
              if (nextIncorrect !== -1) setCurrentIndex(nextIncorrect)
            }}
          >
            Próxima Errada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextCorrect = reviews.findIndex((r, idx) => idx > currentIndex && r.isCorrect)
              if (nextCorrect !== -1) setCurrentIndex(nextCorrect)
            }}
          >
            Próxima Certa
          </Button>
        </div>
      </div>
    </div>
  )
}
