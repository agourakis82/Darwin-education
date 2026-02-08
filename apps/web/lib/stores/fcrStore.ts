import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  FCRCase,
  FCRScore,
  FCRLevel,
  ConfidenceRating,
} from '@darwin-education/shared'
import { FCR_LEVEL_ORDER } from '@darwin-education/shared'

interface FCRState {
  // Current case data
  currentCase: FCRCase | null

  // Attempt state
  attemptId: string | null
  currentLevel: FCRLevel

  // Selections
  selectedDados: string[]
  selectedPadrao: string | null
  selectedHipotese: string | null
  selectedConduta: string | null

  // Confidence per level
  confidenceDados: ConfidenceRating | null
  confidencePadrao: ConfidenceRating | null
  confidenceHipotese: ConfidenceRating | null
  confidenceConduta: ConfidenceRating | null

  // Timing
  stepTimes: Record<string, number>
  stepStartedAt: number | null
  totalTimeSeconds: number
  startedAt: Date | null
  isSubmitted: boolean

  // Results
  result: FCRScore | null

  // Actions
  startCase: (fcrCase: FCRCase, attemptId: string) => void
  toggleDados: (findingId: string) => void
  selectPadrao: (id: string) => void
  selectHipotese: (id: string) => void
  selectConduta: (id: string) => void
  setConfidence: (level: FCRLevel, rating: ConfidenceRating) => void
  advanceLevel: () => void
  goBackLevel: () => void
  submitCase: (score: FCRScore) => void
  resetCase: () => void
}

const initialState = {
  currentCase: null,
  attemptId: null,
  currentLevel: 'dados' as FCRLevel,
  selectedDados: [] as string[],
  selectedPadrao: null,
  selectedHipotese: null,
  selectedConduta: null,
  confidenceDados: null as ConfidenceRating | null,
  confidencePadrao: null as ConfidenceRating | null,
  confidenceHipotese: null as ConfidenceRating | null,
  confidenceConduta: null as ConfidenceRating | null,
  stepTimes: {} as Record<string, number>,
  stepStartedAt: null as number | null,
  totalTimeSeconds: 0,
  startedAt: null as Date | null,
  isSubmitted: false,
  result: null,
}

function recordStepTime(
  state: Pick<FCRState, 'stepStartedAt' | 'stepTimes' | 'currentLevel'>
): Record<string, number> {
  if (!state.stepStartedAt) return state.stepTimes
  const elapsed = Math.round((Date.now() - state.stepStartedAt) / 1000)
  const prev = state.stepTimes[state.currentLevel] || 0
  return {
    ...state.stepTimes,
    [state.currentLevel]: prev + elapsed,
  }
}

export const useFCRStore = create<FCRState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startCase: (fcrCase, attemptId) => {
        set({
          currentCase: fcrCase,
          attemptId,
          currentLevel: 'dados',
          selectedDados: [],
          selectedPadrao: null,
          selectedHipotese: null,
          selectedConduta: null,
          confidenceDados: null,
          confidencePadrao: null,
          confidenceHipotese: null,
          confidenceConduta: null,
          stepTimes: {},
          stepStartedAt: Date.now(),
          totalTimeSeconds: 0,
          startedAt: new Date(),
          isSubmitted: false,
          result: null,
        })
      },

      toggleDados: (findingId) => {
        const { selectedDados } = get()
        if (selectedDados.includes(findingId)) {
          set({
            selectedDados: selectedDados.filter((id) => id !== findingId),
          })
        } else {
          set({
            selectedDados: [...selectedDados, findingId],
          })
        }
      },

      selectPadrao: (id) => set({ selectedPadrao: id }),
      selectHipotese: (id) => set({ selectedHipotese: id }),
      selectConduta: (id) => set({ selectedConduta: id }),

      setConfidence: (level, rating) => {
        switch (level) {
          case 'dados':
            set({ confidenceDados: rating })
            break
          case 'padrao':
            set({ confidencePadrao: rating })
            break
          case 'hipotese':
            set({ confidenceHipotese: rating })
            break
          case 'conduta':
            set({ confidenceConduta: rating })
            break
        }
      },

      advanceLevel: () => {
        const state = get()
        const currentIndex = FCR_LEVEL_ORDER.indexOf(state.currentLevel)
        if (currentIndex < FCR_LEVEL_ORDER.length - 1) {
          const updatedTimes = recordStepTime(state)
          set({
            currentLevel: FCR_LEVEL_ORDER[currentIndex + 1],
            stepTimes: updatedTimes,
            stepStartedAt: Date.now(),
          })
        }
      },

      goBackLevel: () => {
        const state = get()
        const currentIndex = FCR_LEVEL_ORDER.indexOf(state.currentLevel)
        if (currentIndex > 0) {
          const updatedTimes = recordStepTime(state)
          set({
            currentLevel: FCR_LEVEL_ORDER[currentIndex - 1],
            stepTimes: updatedTimes,
            stepStartedAt: Date.now(),
          })
        }
      },

      submitCase: (score) => {
        const state = get()
        const updatedTimes = recordStepTime(state)
        const totalTime = Object.values(updatedTimes).reduce(
          (sum, t) => sum + t,
          0
        )
        set({
          isSubmitted: true,
          result: score,
          stepTimes: updatedTimes,
          totalTimeSeconds: totalTime,
          stepStartedAt: null,
        })
      },

      resetCase: () => {
        set(initialState)
      },
    }),
    {
      name: 'darwin-fcr-store',
      partialize: (state) => ({
        currentCase: state.currentCase,
        attemptId: state.attemptId,
        currentLevel: state.currentLevel,
        selectedDados: state.selectedDados,
        selectedPadrao: state.selectedPadrao,
        selectedHipotese: state.selectedHipotese,
        selectedConduta: state.selectedConduta,
        confidenceDados: state.confidenceDados,
        confidencePadrao: state.confidencePadrao,
        confidenceHipotese: state.confidenceHipotese,
        confidenceConduta: state.confidenceConduta,
        stepTimes: state.stepTimes,
        startedAt: state.startedAt,
        isSubmitted: state.isSubmitted,
      }),
    }
  )
)

// Selectors
export const selectFCRLevelIndex = (state: FCRState): number =>
  FCR_LEVEL_ORDER.indexOf(state.currentLevel)

export const selectFCRProgress = (state: FCRState): number => {
  const index = FCR_LEVEL_ORDER.indexOf(state.currentLevel)
  if (state.isSubmitted) return 100
  return (index / FCR_LEVEL_ORDER.length) * 100
}

export const selectCanAdvanceFCR = (state: FCRState): boolean => {
  const hasSelection = (() => {
    switch (state.currentLevel) {
      case 'dados':
        return state.selectedDados.length > 0
      case 'padrao':
        return state.selectedPadrao !== null
      case 'hipotese':
        return state.selectedHipotese !== null
      case 'conduta':
        return state.selectedConduta !== null
      default:
        return false
    }
  })()

  const hasConfidence = (() => {
    switch (state.currentLevel) {
      case 'dados':
        return state.confidenceDados !== null
      case 'padrao':
        return state.confidencePadrao !== null
      case 'hipotese':
        return state.confidenceHipotese !== null
      case 'conduta':
        return state.confidenceConduta !== null
      default:
        return false
    }
  })()

  return hasSelection && hasConfidence
}

export const selectIsLastLevel = (state: FCRState): boolean =>
  state.currentLevel === 'conduta'

export const selectIsFirstLevel = (state: FCRState): boolean =>
  state.currentLevel === 'dados'
