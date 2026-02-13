import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CIPPuzzle,
  CIPScore,
  CIPSection,
  CIPDiagnosis,
  CIPFinding,
} from '@darwin-education/shared'

interface CIPCellState {
  row: number
  section: CIPSection
  selectedFindingId: string | null
  timeSpent: number // seconds spent on this cell
}

interface CIPState {
  // Current puzzle data
  currentPuzzle: CIPPuzzle | null

  // Attempt state
  attemptId: string | null
  cellStates: Record<string, CIPCellState> // key: "row_section"
  activeCell: { row: number; section: CIPSection } | null
  remainingTime: number
  startedAt: Date | null
  isSubmitted: boolean

  // Results
  result: CIPScore | null

  // Actions
  startPuzzle: (
    puzzle: CIPPuzzle,
    attemptId: string,
    restoreState?: {
      gridState?: Record<string, string>
      timePerCell?: Record<string, number>
      remainingTime?: number
      startedAt?: string | Date | null
    }
  ) => void
  selectCell: (row: number, section: CIPSection) => void
  selectFinding: (row: number, section: CIPSection, findingId: string) => void
  clearCell: (row: number, section: CIPSection) => void
  updateTimeSpent: (row: number, section: CIPSection, seconds: number) => void
  updateRemainingTime: (seconds: number) => void
  submitPuzzle: (score: CIPScore) => void
  resetPuzzle: () => void
}

const getCellKey = (row: number, section: CIPSection) => `${row}_${section}`

const initialState = {
  currentPuzzle: null,
  attemptId: null,
  cellStates: {},
  activeCell: null,
  remainingTime: 0,
  startedAt: null,
  isSubmitted: false,
  result: null,
}

export const useCIPStore = create<CIPState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startPuzzle: (puzzle, attemptId, restoreState) => {
        // Initialize cell states for all cells in the grid
        const cellStates: Record<string, CIPCellState> = {}

        for (const row of puzzle.grid) {
          for (const cell of row) {
            const key = getCellKey(cell.row, cell.column)
            cellStates[key] = {
              row: cell.row,
              section: cell.column,
              selectedFindingId: null,
              timeSpent: 0,
            }
          }
        }

        // Hydrate existing progress when resuming an attempt.
        if (restoreState?.gridState) {
          for (const [key, findingId] of Object.entries(restoreState.gridState)) {
            if (cellStates[key]) {
              cellStates[key] = {
                ...cellStates[key],
                selectedFindingId: findingId || null,
              }
            }
          }
        }

        if (restoreState?.timePerCell) {
          for (const [key, seconds] of Object.entries(restoreState.timePerCell)) {
            if (cellStates[key]) {
              cellStates[key] = {
                ...cellStates[key],
                timeSpent: Math.max(0, Number(seconds) || 0),
              }
            }
          }
        }

        set({
          currentPuzzle: puzzle,
          attemptId,
          cellStates,
          activeCell: null,
          remainingTime: Math.max(
            0,
            restoreState?.remainingTime ?? puzzle.timeLimitMinutes * 60
          ),
          startedAt: restoreState?.startedAt ? new Date(restoreState.startedAt) : new Date(),
          isSubmitted: false,
          result: null,
        })
      },

      selectCell: (row, section) => {
        set({ activeCell: { row, section } })
      },

      selectFinding: (row, section, findingId) => {
        const key = getCellKey(row, section)
        set((state) => ({
          cellStates: {
            ...state.cellStates,
            [key]: {
              ...state.cellStates[key],
              selectedFindingId: findingId,
            },
          },
          activeCell: null, // Close the options modal
        }))
      },

      clearCell: (row, section) => {
        const key = getCellKey(row, section)
        set((state) => ({
          cellStates: {
            ...state.cellStates,
            [key]: {
              ...state.cellStates[key],
              selectedFindingId: null,
            },
          },
        }))
      },

      updateTimeSpent: (row, section, seconds) => {
        const key = getCellKey(row, section)
        set((state) => ({
          cellStates: {
            ...state.cellStates,
            [key]: {
              ...state.cellStates[key],
              timeSpent: state.cellStates[key].timeSpent + seconds,
            },
          },
        }))
      },

      updateRemainingTime: (seconds) => {
        set({ remainingTime: seconds })
      },

      submitPuzzle: (score) => {
        set({
          isSubmitted: true,
          result: score,
        })
      },

      resetPuzzle: () => {
        set(initialState)
      },
    }),
    {
      name: 'darwin-cip-store',
      partialize: (state) => ({
        currentPuzzle: state.currentPuzzle,
        attemptId: state.attemptId,
        cellStates: state.cellStates,
        remainingTime: state.remainingTime,
        startedAt: state.startedAt,
        isSubmitted: state.isSubmitted,
      }),
    }
  )
)

// Selectors
export const selectGridState = (state: CIPState): Record<string, string> => {
  const gridState: Record<string, string> = {}
  for (const [key, cell] of Object.entries(state.cellStates)) {
    if (cell.selectedFindingId) {
      gridState[key] = cell.selectedFindingId
    }
  }
  return gridState
}

export const selectAnsweredCount = (state: CIPState): number => {
  return Object.values(state.cellStates).filter(
    (cell) => cell.selectedFindingId !== null
  ).length
}

export const selectTotalCells = (state: CIPState): number => {
  return Object.keys(state.cellStates).length
}

export const selectProgress = (state: CIPState): number => {
  const total = selectTotalCells(state)
  if (total === 0) return 0
  return (selectAnsweredCount(state) / total) * 100
}

export const selectCellStatus = (
  state: CIPState,
  row: number,
  section: CIPSection
): 'empty' | 'filled' | 'correct' | 'incorrect' => {
  const key = getCellKey(row, section)
  const cell = state.cellStates[key]

  if (!cell || !cell.selectedFindingId) return 'empty'
  if (!state.isSubmitted) return 'filled'

  // After submission, check correctness
  const puzzleCell = state.currentPuzzle?.grid[row]?.find(
    (c) => c.column === section
  )
  if (!puzzleCell) return 'filled'

  return cell.selectedFindingId === puzzleCell.correctFindingId
    ? 'correct'
    : 'incorrect'
}

export const selectFindingForCell = (
  state: CIPState,
  row: number,
  section: CIPSection
): CIPFinding | null => {
  const key = getCellKey(row, section)
  const cell = state.cellStates[key]

  if (!cell?.selectedFindingId || !state.currentPuzzle) return null

  return (
    state.currentPuzzle.optionsPerSection[section]?.find(
      (f) => f.id === cell.selectedFindingId
    ) || null
  )
}

export const selectSectionProgress = (
  state: CIPState,
  section: CIPSection
): { answered: number; total: number } => {
  const sectionCells = Object.values(state.cellStates).filter(
    (cell) => cell.section === section
  )

  return {
    answered: sectionCells.filter((c) => c.selectedFindingId !== null).length,
    total: sectionCells.length,
  }
}

export const selectDiagnosisProgress = (
  state: CIPState,
  row: number
): { answered: number; total: number } => {
  const rowCells = Object.values(state.cellStates).filter(
    (cell) => cell.row === row
  )

  return {
    answered: rowCells.filter((c) => c.selectedFindingId !== null).length,
    total: rowCells.length,
  }
}

// Export utility
export { getCellKey }
