'use client'

import { QuestionCard } from '@/components/ui/QuestionCard'
import { Button } from '@/components/ui/Button'
import type { ENAMEDQuestion } from '@darwin-education/shared'

interface ExamQuestionProps {
  question: ENAMEDQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | null | undefined
  isFlagged: boolean | undefined
  onAnswerSelect: (answer: string) => void
  onToggleFlag: () => void
  hideFlagButton?: boolean
}

export function ExamQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onAnswerSelect,
  onToggleFlag,
  hideFlagButton = false,
}: ExamQuestionProps) {
  return (
    <div>
      {/* Flag Button — hidden in adaptive/CAT mode */}
      {!hideFlagButton && (
        <div className="flex justify-end mb-4">
          <Button
            variant={isFlagged ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onToggleFlag}
            leftIcon={
              <svg
                className={`w-4 h-4 ${isFlagged ? 'text-yellow-400' : ''}`}
                fill={isFlagged ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            }
          >
            {isFlagged ? 'Marcada para revisão' : 'Marcar para revisão'}
          </Button>
        </div>
      )}

      {/* Question Card */}
      <QuestionCard
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={onAnswerSelect}
        showCorrectAnswer={false}
        showExplanation={false}
      />
    </div>
  )
}
