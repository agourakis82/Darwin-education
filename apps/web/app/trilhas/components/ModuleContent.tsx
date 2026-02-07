'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { ModuleType } from './ModuleList'

interface ModuleContentProps {
  type: ModuleType
  title: string
  content: {
    text?: string
    video_url?: string
    quiz_questions?: QuizQuestion[]
    flashcard_deck_id?: string
    case_study?: CaseStudy
  }
  onComplete: () => void
  isCompleting?: boolean
}

interface QuizQuestion {
  id: string
  stem: string
  options: string[]
  correct_index: number
  explanation?: string
}

interface CaseStudy {
  patient_info: string
  history: string
  exam_findings: string
  questions: QuizQuestion[]
}

export function ModuleContent({ type, title, content, onComplete, isCompleting }: ModuleContentProps) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [currentCaseStep, setCurrentCaseStep] = useState(0)

  const renderReading = () => (
    <div className="prose prose-invert prose-slate max-w-none">
      <div
        className="text-label-primary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content.text || '' }}
      />
    </div>
  )

  const renderVideo = () => (
    <div className="aspect-video bg-surface-2 rounded-lg overflow-hidden">
      {content.video_url ? (
        <iframe
          src={content.video_url}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-label-tertiary">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}
    </div>
  )

  const renderQuiz = () => {
    const questions = content.quiz_questions || []
    const allAnswered = questions.every(q => quizAnswers[q.id] !== undefined)
    const correctCount = showResults
      ? questions.filter(q => quizAnswers[q.id] === q.correct_index).length
      : 0

    return (
      <div className="space-y-6">
        {showResults && (
          <Card className={correctCount >= questions.length * 0.7 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">
                    Resultado: {correctCount}/{questions.length} corretas
                  </p>
                  <p className="text-sm text-label-secondary">
                    {correctCount >= questions.length * 0.7
                      ? 'Parabéns! Você pode prosseguir.'
                      : 'Revise o conteúdo e tente novamente.'}
                  </p>
                </div>
                {correctCount >= questions.length * 0.7 && (
                  <Button onClick={onComplete} loading={isCompleting}>
                    Próximo Módulo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {questions.map((question, qIndex) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {qIndex + 1}. {question.stem}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => {
                  const isSelected = quizAnswers[question.id] === oIndex
                  const isCorrect = question.correct_index === oIndex
                  const showCorrectness = showResults

                  return (
                    <button
                      key={oIndex}
                      onClick={() => !showResults && setQuizAnswers(prev => ({ ...prev, [question.id]: oIndex }))}
                      disabled={showResults}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        showCorrectness
                          ? isCorrect
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : isSelected
                            ? 'bg-red-500/20 border-red-500 text-white'
                            : 'border-separator text-label-secondary'
                          : isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'border-separator hover:border-surface-4 text-label-primary'
                      }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      {option}
                    </button>
                  )
                })}
              </div>

              {showResults && question.explanation && (
                <div className="mt-4 p-3 bg-surface-2/50 rounded-lg">
                  <p className="text-sm text-label-secondary">
                    <span className="font-medium text-label-primary">Explicação: </span>
                    {question.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {!showResults && allAnswered && (
          <Button onClick={() => setShowResults(true)} className="w-full">
            Verificar Respostas
          </Button>
        )}
      </div>
    )
  }

  const renderFlashcards = () => (
    <div className="text-center py-12">
      <svg className="w-16 h-16 text-label-quaternary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p className="text-label-secondary mb-4">
        Este módulo contém um deck de flashcards para revisão.
      </p>
      <Button onClick={() => window.open(`/flashcards/${content.flashcard_deck_id}`, '_blank')}>
        Abrir Flashcards
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Button>
      <Button variant="outline" onClick={onComplete} loading={isCompleting} className="ml-2">
        Marcar como Concluído
      </Button>
    </div>
  )

  const renderCaseStudy = () => {
    const caseData = content.case_study
    if (!caseData) return null

    const steps = [
      { title: 'Informações do Paciente', content: caseData.patient_info },
      { title: 'História Clínica', content: caseData.history },
      { title: 'Exame Físico', content: caseData.exam_findings },
      { title: 'Questões', content: null },
    ]

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex gap-2">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setCurrentCaseStep(index)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentCaseStep === index
                  ? 'bg-emerald-500 text-white'
                  : currentCaseStep > index
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-surface-2 text-label-secondary'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentCaseStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentCaseStep < 3 ? (
              <div className="prose prose-invert prose-slate max-w-none">
                <p className="text-label-primary leading-relaxed whitespace-pre-wrap">
                  {steps[currentCaseStep].content}
                </p>
              </div>
            ) : (
              renderQuiz()
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentCaseStep < 3 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentCaseStep(prev => Math.max(0, prev - 1))}
              disabled={currentCaseStep === 0}
            >
              Anterior
            </Button>
            <Button onClick={() => setCurrentCaseStep(prev => Math.min(3, prev + 1))}>
              Próximo
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (type) {
      case 'reading':
        return renderReading()
      case 'video':
        return renderVideo()
      case 'quiz':
        return renderQuiz()
      case 'flashcards':
        return renderFlashcards()
      case 'case_study':
        return renderCaseStudy()
      default:
        return <p className="text-label-secondary">Tipo de conteúdo não suportado.</p>
    }
  }

  return (
    <div>
      {renderContent()}

      {/* Complete button for reading and video */}
      {(type === 'reading' || type === 'video') && (
        <div className="mt-8 flex justify-end">
          <Button onClick={onComplete} loading={isCompleting}>
            Marcar como Concluído
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}
