import { useMemo } from 'react'
import type { CATState } from './catStore'

// Base selectors
export const selectSessionId = (state: CATState) => state.sessionId
export const selectAttemptId = (state: CATState) => state.attemptId
export const selectExamId = (state: CATState) => state.examId
export const selectConfig = (state: CATState) => state.config
export const selectCurrentQuestion = (state: CATState) => state.currentQuestion
export const selectCurrentAnswer = (state: CATState) => state.currentAnswer
export const selectQuestionNumber = (state: CATState) => state.questionNumber
export const selectLoading = (state: CATState) => state.loading
export const selectSubmitting = (state: CATState) => state.submitting
export const selectError = (state: CATState) => state.error
export const selectAnswers = (state: CATState) => state.answers
export const selectPrefetchedQuestion = (state: CATState) => state.prefetchedQuestion

// Computed selectors (derived state)
export const selectIsComplete = (state: CATState) =>
  !state.currentQuestion && state.questionNumber > 0

export const selectProgress = (state: CATState) => ({
  questionNumber: state.questionNumber,
  totalAnswered: state.answers.length,
})

export const selectHasAnswer = (state: CATState) => state.currentAnswer !== null

export const selectItemsAdministered = (state: CATState) => state.answers.length

// Hook for combining multiple selectors with useMemo
export function useCATSelectors(
  useCATStore: (selector: (state: CATState) => unknown) => unknown
) {
  const sessionId = useCATStore(selectSessionId) as string | null
  const attemptId = useCATStore(selectAttemptId) as string | null
  const examId = useCATStore(selectExamId) as string | null
  const config = useCATStore(selectConfig) as CATState['config']
  const currentQuestion = useCATStore(selectCurrentQuestion) as CATState['currentQuestion']
  const currentAnswer = useCATStore(selectCurrentAnswer) as CATState['currentAnswer']
  const questionNumber = useCATStore(selectQuestionNumber) as number
  const loading = useCATStore(selectLoading) as boolean
  const submitting = useCATStore(selectSubmitting) as boolean
  const error = useCATStore(selectError) as CATState['error']
  const answers = useCATStore(selectAnswers) as CATState['answers']
  const prefetchedQuestion = useCATStore(selectPrefetchedQuestion) as CATState['prefetchedQuestion']

  // Memoized computed values
  const isComplete = useMemo(() => !currentQuestion && questionNumber > 0, [currentQuestion, questionNumber])
  const progress = useMemo(
    () => ({ questionNumber, totalAnswered: answers.length }),
    [questionNumber, answers.length]
  )
  const hasAnswer = useMemo(() => currentAnswer !== null, [currentAnswer])
  const itemsAdministered = useMemo(() => answers.length, [answers.length])

  return {
    sessionId,
    attemptId,
    examId,
    config,
    currentQuestion,
    currentAnswer,
    questionNumber,
    loading,
    submitting,
    error,
    answers,
    prefetchedQuestion,
    isComplete,
    progress,
    hasAnswer,
    itemsAdministered,
  }
}
