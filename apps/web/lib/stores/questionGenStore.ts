import { create } from 'zustand'
import type { ENAMEDArea } from '@darwin-education/shared'

type Difficulty = 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'

export interface GeneratedQuestionData {
  stem: string
  options: { letter: string; text: string; feedback?: string }[]
  correct_index: number
  explanation: string
  area: string
  topic?: string
  difficulty?: string
  irt?: {
    difficulty: number
    discrimination: number
    guessing: number
  }
}

interface GenerationResult {
  question: GeneratedQuestionData
  tokensUsed: number | null
  costBRL: number | null
  cached: boolean
  remaining: number | null
  generatedAt: string
}

interface QuestionGenState {
  // Form state
  selectedArea: ENAMEDArea | null
  topic: string
  difficulty: Difficulty
  focus: string

  // Generation state
  generating: boolean
  result: GenerationResult | null
  error: string | null

  // History
  history: GenerationResult[]

  // Validation queue
  saving: boolean
  saved: boolean

  // Actions
  setArea: (area: ENAMEDArea | null) => void
  setTopic: (topic: string) => void
  setDifficulty: (difficulty: Difficulty) => void
  setFocus: (focus: string) => void
  setGenerating: (generating: boolean) => void
  setResult: (result: GenerationResult | null) => void
  setError: (error: string | null) => void
  addToHistory: (result: GenerationResult) => void
  setSaving: (saving: boolean) => void
  setSaved: (saved: boolean) => void
  reset: () => void
}

const initialState = {
  selectedArea: null as ENAMEDArea | null,
  topic: '',
  difficulty: 'medio' as Difficulty,
  focus: '',
  generating: false,
  result: null as GenerationResult | null,
  error: null as string | null,
  history: [] as GenerationResult[],
  saving: false,
  saved: false,
}

export const useQuestionGenStore = create<QuestionGenState>()((set) => ({
  ...initialState,

  setArea: (area) => set({ selectedArea: area, saved: false }),
  setTopic: (topic) => set({ topic, saved: false }),
  setDifficulty: (difficulty) => set({ difficulty, saved: false }),
  setFocus: (focus) => set({ focus, saved: false }),
  setGenerating: (generating) => set({ generating, error: null }),
  setResult: (result) => set({ result, saved: false }),
  setError: (error) => set({ error, generating: false }),
  addToHistory: (result) =>
    set((state) => ({ history: [result, ...state.history].slice(0, 20) })),
  setSaving: (saving) => set({ saving }),
  setSaved: (saved) => set({ saved }),
  reset: () => set(initialState),
}))

// Selectors
export const selectCanGenerate = (state: QuestionGenState) =>
  state.selectedArea !== null && !state.generating

export const selectHasResult = (state: QuestionGenState) =>
  state.result !== null

export const selectTotalCost = (state: QuestionGenState) =>
  state.history.reduce((sum, r) => sum + (r.costBRL ?? 0), 0)
