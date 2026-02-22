import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ENAMEDQuestion, CATConfig } from '@darwin-education/shared'

interface CATAnswer {
  questionId: string
  selectedAnswer: string | null
  confirmed: boolean
}

// Export CATState interface for use in selectors
export interface CATState {
  // Session data (opaque sessionId - server stores actual CAT state)
  examId: string | null
  attemptId: string | null
  sessionId: string | null
  config: CATConfig | null

  // Current question
  currentQuestion: ENAMEDQuestion | null
  currentAnswer: string | null
  questionNumber: number

  // UI state (not persisted)
  loading: boolean
  submitting: boolean
  error: string | null
  startedAt: Date | null

  // History (for display)
  answers: CATAnswer[]

  // Pre-fetched question buffer (for shadow pre-fetching)
  prefetchedQuestion: ENAMEDQuestion | null

  // Actions
  startCAT: (params: {
    examId: string
    attemptId: string
    sessionId: string
    config: CATConfig
    firstQuestion: ENAMEDQuestion
  }) => void
  selectAnswer: (answer: string) => void
  confirmAnswer: (nextQuestion: ENAMEDQuestion | null, questionNumber?: number) => void
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  resetCAT: () => void
  // Pre-fetch actions
  setPrefetchedQuestion: (question: ENAMEDQuestion | null) => void
  consumePrefetchedQuestion: () => ENAMEDQuestion | null
}

const initialState = {
  examId: null,
  attemptId: null,
  sessionId: null,
  config: null,
  currentQuestion: null,
  currentAnswer: null,
  questionNumber: 0,
  loading: false,
  submitting: false,
  error: null,
  startedAt: null,
  answers: [],
  prefetchedQuestion: null,
}

/**
 * Creates a debounced storage wrapper for Zustand persist middleware.
 * Prevents excessive localStorage writes by batching changes.
 */
const createDebouncedStorage = (delay: number = 500) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') return null
      try {
        return localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(name, value)
        } catch (error) {
          console.error('Failed to persist CAT state:', error)
        }
      }, delay)
    },
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return
      try {
        localStorage.removeItem(name)
      } catch (error) {
        console.error('Failed to remove CAT state:', error)
      }
    },
  }
}

export const useCATStore = create<CATState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startCAT: ({ examId, attemptId, sessionId, config, firstQuestion }) => {
        set({
          examId,
          attemptId,
          sessionId,
          config,
          currentQuestion: firstQuestion,
          currentAnswer: null,
          questionNumber: 1,
          loading: false,
          submitting: false,
          error: null,
          startedAt: new Date(),
          answers: [],
          prefetchedQuestion: null,
        })
      },

      selectAnswer: (answer) => {
        set({ currentAnswer: answer })
      },

      confirmAnswer: (nextQuestion, newQuestionNumber) => {
        const { currentQuestion, currentAnswer, questionNumber, answers } = get()

        const newAnswers = currentQuestion
          ? [
              ...answers,
              {
                questionId: currentQuestion.id,
                selectedAnswer: currentAnswer,
                confirmed: true,
              },
            ]
          : answers

        set({
          currentQuestion: nextQuestion,
          currentAnswer: null,
          questionNumber: newQuestionNumber ?? (nextQuestion ? questionNumber + 1 : questionNumber),
          answers: newAnswers,
          submitting: false,
          prefetchedQuestion: null, // Clear prefetched question after consumption
        })
      },

      setLoading: (loading) => set({ loading }),
      setSubmitting: (submitting) => set({ submitting }),
      setError: (error) => set({ error }),
      resetCAT: () => set(initialState),

      // Pre-fetch actions
      setPrefetchedQuestion: (question) => set({ prefetchedQuestion: question }),
      consumePrefetchedQuestion: () => {
        const { prefetchedQuestion } = get()
        if (prefetchedQuestion) {
          set({ prefetchedQuestion: null })
        }
        return prefetchedQuestion
      },
    }),
    {
      name: 'darwin-cat-store',
      storage: createJSONStorage(createDebouncedStorage),
      partialize: (state) => ({
        // Only persist essential session data, exclude transient UI state
        examId: state.examId,
        attemptId: state.attemptId,
        sessionId: state.sessionId,
        config: state.config,
        currentQuestion: state.currentQuestion,
        questionNumber: state.questionNumber,
        startedAt: state.startedAt,
        answers: state.answers,
        // Explicitly NOT persisting: loading, submitting, error, currentAnswer, prefetchedQuestion
      }),
    }
  )
)

// Selectors (server provides theta/se via API, not stored client-side)
export const selectQuestionNumber = (state: CATState) => state.questionNumber
export const selectIsComplete = (state: CATState) => !state.currentQuestion && state.questionNumber > 0
export const selectProgress = (state: CATState) => ({
  questionNumber: state.questionNumber,
  totalAnswered: state.answers.length,
})
