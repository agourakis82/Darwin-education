'use client'

import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import type { CIPSection, CIPPuzzle } from '@darwin-education/shared'
import { CIP_SECTION_LABELS_PT } from '@darwin-education/shared'
import {
  useCIPStore,
  selectCellStatus,
  selectFindingForCell,
  selectSectionProgress,
  selectDiagnosisProgress,
} from '@/lib/stores/cipStore'

interface CIPPuzzleGridProps {
  puzzle: CIPPuzzle
  onCellClick: (row: number, section: CIPSection) => void
  showResults?: boolean
}

const cellStatusStyles = {
  empty: 'bg-surface-2/50 hover:bg-surface-3/50 border-separator cursor-pointer',
  filled: 'bg-emerald-900/30 hover:bg-emerald-800/30 border-emerald-700/50 cursor-pointer',
  correct: 'bg-emerald-600/30 border-emerald-500',
  incorrect: 'bg-red-600/30 border-red-500',
}

export function CIPPuzzleGrid({ puzzle, onCellClick, showResults = false }: CIPPuzzleGridProps) {
  const { cellStates, isSubmitted, activeCell } = useCIPStore()

  // Get sections from puzzle settings
  const sections = puzzle.settings.sections

  return (
    <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-surface-3 scrollbar-track-transparent">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {/* Diagnosis column header */}
            <th className="p-2 md:p-3 text-left text-xs md:text-sm font-semibold text-label-primary bg-surface-1/80 border border-separator sticky left-0 z-10 min-w-[120px] md:min-w-[180px]">
              Diagnóstico
            </th>
            {/* Section headers */}
            {sections.map((section) => (
              <th
                key={section}
                className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-label-primary bg-surface-1/80 border border-separator min-w-[100px] md:min-w-[140px]"
              >
                <div>{CIP_SECTION_LABELS_PT[section]}</div>
                <SectionProgress section={section} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {puzzle.diagnoses.map((diagnosis, rowIndex) => (
            <tr key={diagnosis.id}>
              {/* Diagnosis name cell */}
              <td className="p-2 md:p-3 text-xs md:text-sm font-medium text-white bg-surface-1/60 border border-separator sticky left-0 z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-2">{diagnosis.namePt}</span>
                  <DiagnosisProgress row={rowIndex} />
                </div>
              </td>
              {/* Grid cells */}
              {sections.map((section) => (
                <GridCell
                  key={`${rowIndex}_${section}`}
                  row={rowIndex}
                  section={section}
                  puzzle={puzzle}
                  isActive={activeCell?.row === rowIndex && activeCell?.section === section}
                  onClick={() => !isSubmitted && onCellClick(rowIndex, section)}
                  showResults={showResults || isSubmitted}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface GridCellProps {
  row: number
  section: CIPSection
  puzzle: CIPPuzzle
  isActive: boolean
  onClick: () => void
  showResults: boolean
}

function GridCell({ row, section, puzzle, isActive, onClick, showResults }: GridCellProps) {
  const state = useCIPStore()
  const status = selectCellStatus(state, row, section)
  const finding = selectFindingForCell(state, row, section)

  // Get correct finding for showing after submission
  const correctFinding = useMemo(() => {
    if (!showResults) return null
    const cell = puzzle.grid[row]?.find((c) => c.column === section)
    if (!cell) return null
    return puzzle.optionsPerSection[section]?.find((f) => f.id === cell.correctFindingId)
  }, [puzzle, row, section, showResults])

  const isClickable = status === 'empty' || status === 'filled'

  return (
    <td
      onClick={isClickable ? onClick : undefined}
      className={`
        p-2 border transition-colors min-h-[80px] align-top
        ${cellStatusStyles[status]}
        ${isActive ? 'ring-2 ring-emerald-400 ring-inset' : ''}
        ${!isClickable ? 'cursor-default' : ''}
      `}
    >
      <div className="min-h-[60px] text-xs">
        {finding ? (
          <div className="flex flex-col gap-1">
            <span className="text-label-primary line-clamp-3">{finding.textPt}</span>
            {showResults && status === 'incorrect' && correctFinding && (
              <div className="mt-1 pt-1 border-t border-separator">
                <span className="text-emerald-400 text-[10px] block mb-0.5">Correto:</span>
                <span className="text-emerald-300 line-clamp-2">{correctFinding.textPt}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[60px] text-label-tertiary">
            <Plus className="w-5 h-5" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </td>
  )
}

function SectionProgress({ section }: { section: CIPSection }) {
  const state = useCIPStore()
  const progress = selectSectionProgress(state, section)

  if (progress.total === 0) return null

  return (
    <div className="text-[10px] text-label-secondary mt-1 font-normal">
      {progress.answered}/{progress.total}
    </div>
  )
}

function DiagnosisProgress({ row }: { row: number }) {
  const state = useCIPStore()
  const progress = selectDiagnosisProgress(state, row)

  if (progress.total === 0) return null

  const percentage = Math.round((progress.answered / progress.total) * 100)

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <div className="w-8 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] text-label-secondary">{progress.answered}/{progress.total}</span>
    </div>
  )
}
