import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CIPImageCase,
  CIPImageScore,
  ImageInterpretationStep,
} from '@darwin-education/shared'

interface CIPImageState {
  // Current case data
  currentCase: CIPImageCase | null

  // Attempt state
  attemptId: string | null
  currentStep: ImageInterpretationStep
  selectedModality: string | null
  selectedFindings: string[]
  selectedDiagnosis: string | null
  selectedNextStep: string | null
  stepTimes: Record<string, number> // step -> seconds
  stepStartedAt: number | null // timestamp ms for current step
  totalTimeSeconds: number
  startedAt: Date | null
  isSubmitted: boolean

  // Results
  result: CIPImageScore | null

  // Actions
  startCase: (imageCase: CIPImageCase, attemptId: string) => void
  selectModality: (modality: string) => void
  toggleFinding: (findingId: string) => void
  selectDiagnosis: (diagnosisId: string) => void
  selectNextStep: (nextStepId: string) => void
  advanceStep: () => void
  goBackStep: () => void
  submitCase: (score: CIPImageScore) => void
  resetCase: () => void
}

const STEP_ORDER: ImageInterpretationStep[] = [
  'modality',
  'findings',
  'diagnosis',
  'next_step',
]

const initialState = {
  currentCase: null,
  attemptId: null,
  currentStep: 'modality' as ImageInterpretationStep,
  selectedModality: null,
  selectedFindings: [] as string[],
  selectedDiagnosis: null,
  selectedNextStep: null,
  stepTimes: {} as Record<string, number>,
  stepStartedAt: null as number | null,
  totalTimeSeconds: 0,
  startedAt: null as Date | null,
  isSubmitted: false,
  result: null,
}

function recordStepTime(state: Pick<CIPImageState, 'stepStartedAt' | 'stepTimes' | 'currentStep'>): Record<string, number> {
  if (!state.stepStartedAt) return state.stepTimes
  const elapsed = Math.round((Date.now() - state.stepStartedAt) / 1000)
  const prev = state.stepTimes[state.currentStep] || 0
  return {
    ...state.stepTimes,
    [state.currentStep]: prev + elapsed,
  }
}

export const useCIPImageStore = create<CIPImageState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startCase: (imageCase, attemptId) => {
        set({
          currentCase: imageCase,
          attemptId,
          currentStep: 'modality',
          selectedModality: null,
          selectedFindings: [],
          selectedDiagnosis: null,
          selectedNextStep: null,
          stepTimes: {},
          stepStartedAt: Date.now(),
          totalTimeSeconds: 0,
          startedAt: new Date(),
          isSubmitted: false,
          result: null,
        })
      },

      selectModality: (modality) => {
        set({ selectedModality: modality })
      },

      toggleFinding: (findingId) => {
        const { selectedFindings } = get()
        if (selectedFindings.includes(findingId)) {
          set({
            selectedFindings: selectedFindings.filter((id) => id !== findingId),
          })
        } else {
          set({
            selectedFindings: [...selectedFindings, findingId],
          })
        }
      },

      selectDiagnosis: (diagnosisId) => {
        set({ selectedDiagnosis: diagnosisId })
      },

      selectNextStep: (nextStepId) => {
        set({ selectedNextStep: nextStepId })
      },

      advanceStep: () => {
        const state = get()
        const currentIndex = STEP_ORDER.indexOf(state.currentStep)
        if (currentIndex < STEP_ORDER.length - 1) {
          const updatedTimes = recordStepTime(state)
          set({
            currentStep: STEP_ORDER[currentIndex + 1],
            stepTimes: updatedTimes,
            stepStartedAt: Date.now(),
          })
        }
      },

      goBackStep: () => {
        const state = get()
        const currentIndex = STEP_ORDER.indexOf(state.currentStep)
        if (currentIndex > 0) {
          const updatedTimes = recordStepTime(state)
          set({
            currentStep: STEP_ORDER[currentIndex - 1],
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
          currentStep: 'completed',
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
      name: 'darwin-cip-image-store',
      partialize: (state) => ({
        currentCase: state.currentCase,
        attemptId: state.attemptId,
        currentStep: state.currentStep,
        selectedModality: state.selectedModality,
        selectedFindings: state.selectedFindings,
        selectedDiagnosis: state.selectedDiagnosis,
        selectedNextStep: state.selectedNextStep,
        stepTimes: state.stepTimes,
        startedAt: state.startedAt,
        isSubmitted: state.isSubmitted,
      }),
    }
  )
)

// Selectors
export const selectImageStepIndex = (state: CIPImageState): number =>
  STEP_ORDER.indexOf(state.currentStep)

export const selectImageProgress = (state: CIPImageState): number => {
  const index = STEP_ORDER.indexOf(state.currentStep)
  if (state.isSubmitted) return 100
  return (index / STEP_ORDER.length) * 100
}

export const selectCanAdvance = (state: CIPImageState): boolean => {
  switch (state.currentStep) {
    case 'modality':
      return state.selectedModality !== null
    case 'findings':
      return state.selectedFindings.length > 0
    case 'diagnosis':
      return state.selectedDiagnosis !== null
    case 'next_step':
      return state.selectedNextStep !== null
    default:
      return false
  }
}

export const selectIsLastStep = (state: CIPImageState): boolean =>
  state.currentStep === 'next_step'

export const selectIsFirstStep = (state: CIPImageState): boolean =>
  state.currentStep === 'modality'
