'use client'

import { QuestionCard } from '@/components/ui/QuestionCard'
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
    <QuestionCard
      question={question}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      selectedAnswer={selectedAnswer}
      onAnswerSelect={onAnswerSelect}
      showCorrectAnswer={false}
      showExplanation={false}
      isFlagged={isFlagged}
      onToggleFlag={hideFlagButton ? undefined : onToggleFlag}
    />
  )
}
