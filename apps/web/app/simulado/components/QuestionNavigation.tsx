'use client'

import type { ENAMEDQuestion } from '@darwin-education/shared'

interface ExamAnswer {
  questionId: string
  selectedAnswer: string | null
  timeSpent: number
  flagged: boolean
}

interface QuestionNavigationProps {
  questions: ENAMEDQuestion[]
  currentIndex: number
  answers: Record<string, ExamAnswer>
  onSelectQuestion: (index: number) => void
  compact?: boolean
}

export function QuestionNavigation({
  questions,
  currentIndex,
  answers,
  onSelectQuestion,
  compact = false,
}: QuestionNavigationProps) {
  const getQuestionStatus = (question: ENAMEDQuestion, index: number) => {
    const answer = answers[question.id]
    const isCurrent = index === currentIndex

    if (isCurrent) return 'current'
    if (answer?.flagged) return 'flagged'
    if (answer?.selectedAnswer !== null) return 'answered'
    return 'unanswered'
  }

  const statusStyles = {
    current: 'bg-emerald-600 text-white border-emerald-500',
    answered: 'bg-surface-3 text-label-primary border-surface-4',
    flagged: 'bg-yellow-600/20 text-yellow-400 border-yellow-600',
    unanswered: 'bg-surface-2 text-label-secondary border-separator hover:border-surface-4',
  }

  const answeredCount = Object.values(answers).filter(a => a.selectedAnswer !== null).length
  const flaggedCount = Object.values(answers).filter(a => a.flagged).length

  if (compact) {
    return (
      <div className="bg-surface-1 border border-separator rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-label-primary">Navegação</span>
          <div className="flex gap-3 text-xs">
            <span className="text-label-secondary">
              {answeredCount}/{questions.length} respondidas
            </span>
            {flaggedCount > 0 && (
              <span className="text-yellow-400">{flaggedCount} marcadas</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question, index)
            return (
              <button
                key={question.id}
                onClick={() => onSelectQuestion(index)}
                className={`
                  w-8 h-8 text-xs font-medium rounded border transition-colors
                  ${statusStyles[status]}
                `}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 border border-separator rounded-xl p-4">
      <h3 className="text-sm font-medium text-label-primary mb-4">Questões</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-600" />
          <span className="text-label-secondary">Atual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-surface-3" />
          <span className="text-label-secondary">Respondida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-600/30 border border-yellow-600" />
          <span className="text-label-secondary">Marcada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-surface-2 border border-separator" />
          <span className="text-label-secondary">Não respondida</span>
        </div>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question, index)
          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(index)}
              className={`
                aspect-square text-sm font-medium rounded-lg border transition-colors
                flex items-center justify-center
                ${statusStyles[status]}
              `}
              title={`Questão ${index + 1}`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-separator">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-label-primary tabular-nums">{answeredCount}</div>
            <div className="text-xs text-label-secondary">Respondidas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{flaggedCount}</div>
            <div className="text-xs text-label-secondary">Marcadas</div>
          </div>
        </div>
      </div>
    </div>
  )
}
