import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ENAMEDQuestion, ENAMEDArea, CATConfig, CATSession } from '@darwin-education/shared'

interface CATAnswer {
  questionId: string
  selectedAnswer: string | null
  confirmed: boolean
}

interface CATState {
  // Session data
  examId: string | null
  attemptId: string | null
  config: CATConfig | null
  session: CATSession | null

  // Current question
  currentQuestion: ENAMEDQuestion | null
  currentAnswer: string | null
  questionNumber: number

  // UI state
  loading: boolean
  submitting: boolean
  error: string | null
  startedAt: Date | null

  // History (for display)
  answers: CATAnswer[]

  // Actions
  startCAT: (params: {
    examId: string
    attemptId: string
    config: CATConfig
    session: CATSession
    firstQuestion: ENAMEDQuestion
  }) => void
  selectAnswer: (answer: string) => void
  confirmAnswer: (nextQuestion: ENAMEDQuestion | null, updatedSession: CATSession) => void
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  resetCAT: () => void
}

const initialState = {
  examId: null,
  attemptId: null,
  config: null,
  session: null,
  currentQuestion: null,
  currentAnswer: null,
  questionNumber: 0,
  loading: false,
  submitting: false,
  error: null,
  startedAt: null,
  answers: [],
}

export const useCATStore = create<CATState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startCAT: ({ examId, attemptId, config, session, firstQuestion }) => {
        set({
          examId,
          attemptId,
          config,
          session,
          currentQuestion: firstQuestion,
          currentAnswer: null,
          questionNumber: 1,
          loading: false,
          submitting: false,
          error: null,
          startedAt: new Date(),
          answers: [],
        })
      },

      selectAnswer: (answer) => {
        set({ currentAnswer: answer })
      },

      confirmAnswer: (nextQuestion, updatedSession) => {
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
          session: updatedSession,
          currentQuestion: nextQuestion,
          currentAnswer: null,
          questionNumber: nextQuestion ? questionNumber + 1 : questionNumber,
          answers: newAnswers,
          submitting: false,
        })
      },

      setLoading: (loading) => set({ loading }),
      setSubmitting: (submitting) => set({ submitting }),
      setError: (error) => set({ error }),
      resetCAT: () => set(initialState),
    }),
    {
      name: 'darwin-cat-store',
      partialize: (state) => ({
        examId: state.examId,
        attemptId: state.attemptId,
        config: state.config,
        session: state.session,
        currentQuestion: state.currentQuestion,
        questionNumber: state.questionNumber,
        startedAt: state.startedAt,
        answers: state.answers,
      }),
    }
  )
)

// Selectors
export const selectPrecision = (state: CATState) => {
  if (!state.session || state.session.se === Infinity) return 0
  return Math.min(100, Math.max(0, 100 - state.session.se * 300))
}

export const selectScaledTheta = (state: CATState) => {
  if (!state.session) return 500
  return Math.round(500 + state.session.theta * 100)
}

export const selectIsComplete = (state: CATState) =>
  state.session?.isComplete ?? false
