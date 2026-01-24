import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ENAMEDQuestion, TRIScore, ENAMEDArea } from '@darwin-education/shared'

interface ExamAnswer {
  questionId: string
  selectedAnswer: string | null
  timeSpent: number // seconds spent on this question
  flagged: boolean
}

interface ExamState {
  // Current exam data
  currentExam: {
    id: string
    title: string
    questions: ENAMEDQuestion[]
    timeLimit: number // seconds
  } | null

  // Attempt state
  attemptId: string | null
  answers: Record<string, ExamAnswer>
  currentQuestionIndex: number
  remainingTime: number
  startedAt: Date | null
  isSubmitted: boolean

  // Results
  result: {
    triScore: TRIScore
    areaScores: Record<ENAMEDArea, { correct: number; total: number; percentage: number }>
    timeSpent: number
    passed: boolean
  } | null

  // Actions
  startExam: (exam: {
    id: string
    title: string
    questions: ENAMEDQuestion[]
    timeLimit: number
  }, attemptId: string) => void
  selectAnswer: (questionId: string, answer: string) => void
  toggleFlagQuestion: (questionId: string) => void
  goToQuestion: (index: number) => void
  nextQuestion: () => void
  previousQuestion: () => void
  updateTimeSpent: (questionId: string, seconds: number) => void
  updateRemainingTime: (seconds: number) => void
  submitExam: (triScore: TRIScore) => void
  resetExam: () => void
}

const initialState = {
  currentExam: null,
  attemptId: null,
  answers: {},
  currentQuestionIndex: 0,
  remainingTime: 0,
  startedAt: null,
  isSubmitted: false,
  result: null,
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startExam: (exam, attemptId) => {
        const answers: Record<string, ExamAnswer> = {}
        exam.questions.forEach((q) => {
          answers[q.id] = {
            questionId: q.id,
            selectedAnswer: null,
            timeSpent: 0,
            flagged: false,
          }
        })

        set({
          currentExam: exam,
          attemptId,
          answers,
          currentQuestionIndex: 0,
          remainingTime: exam.timeLimit,
          startedAt: new Date(),
          isSubmitted: false,
          result: null,
        })
      },

      selectAnswer: (questionId, answer) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: {
              ...state.answers[questionId],
              selectedAnswer: answer,
            },
          },
        }))
      },

      toggleFlagQuestion: (questionId) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: {
              ...state.answers[questionId],
              flagged: !state.answers[questionId].flagged,
            },
          },
        }))
      },

      goToQuestion: (index) => {
        const { currentExam } = get()
        if (!currentExam) return
        if (index >= 0 && index < currentExam.questions.length) {
          set({ currentQuestionIndex: index })
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, currentExam } = get()
        if (!currentExam) return
        if (currentQuestionIndex < currentExam.questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 })
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get()
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 })
        }
      },

      updateTimeSpent: (questionId, seconds) => {
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: {
              ...state.answers[questionId],
              timeSpent: state.answers[questionId].timeSpent + seconds,
            },
          },
        }))
      },

      updateRemainingTime: (seconds) => {
        set({ remainingTime: seconds })
      },

      submitExam: (triScore) => {
        const { currentExam, answers, startedAt } = get()
        if (!currentExam) return

        // Calculate area scores
        const areaScores = {} as Record<ENAMEDArea, { correct: number; total: number; percentage: number }>
        const areas: ENAMEDArea[] = ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva']

        areas.forEach((area) => {
          const areaQuestions = currentExam.questions.filter((q) => q.ontology.area === area)
          const correct = areaQuestions.filter(
            (q) => answers[q.id]?.selectedAnswer === q.options[q.correctIndex]?.text
          ).length
          areaScores[area] = {
            correct,
            total: areaQuestions.length,
            percentage: areaQuestions.length > 0 ? (correct / areaQuestions.length) * 100 : 0,
          }
        })

        const timeSpent = startedAt
          ? Math.floor((Date.now() - startedAt.getTime()) / 1000)
          : 0

        set({
          isSubmitted: true,
          result: {
            triScore,
            areaScores,
            timeSpent,
            passed: triScore.passed,
          },
        })
      },

      resetExam: () => {
        set(initialState)
      },
    }),
    {
      name: 'darwin-exam-store',
      partialize: (state) => ({
        currentExam: state.currentExam,
        attemptId: state.attemptId,
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
        remainingTime: state.remainingTime,
        startedAt: state.startedAt,
        isSubmitted: state.isSubmitted,
      }),
    }
  )
)

// Selectors
export const selectCurrentQuestion = (state: ExamState) =>
  state.currentExam?.questions[state.currentQuestionIndex] ?? null

export const selectAnsweredCount = (state: ExamState) =>
  Object.values(state.answers).filter((a) => a.selectedAnswer !== null).length

export const selectFlaggedCount = (state: ExamState) =>
  Object.values(state.answers).filter((a) => a.flagged).length

export const selectProgress = (state: ExamState) => {
  if (!state.currentExam) return 0
  return (selectAnsweredCount(state) / state.currentExam.questions.length) * 100
}
