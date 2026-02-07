'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { CIPSection, CIPPuzzle, CIPFinding } from '@darwin-education/shared'
import { CIP_SECTION_LABELS_PT } from '@darwin-education/shared'
import { useCIPStore, selectFindingForCell } from '@/lib/stores/cipStore'

interface CIPOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  puzzle: CIPPuzzle
  row: number
  section: CIPSection
}

export function CIPOptionsModal({
  isOpen,
  onClose,
  puzzle,
  row,
  section,
}: CIPOptionsModalProps) {
  const state = useCIPStore()
  const { selectFinding, clearCell } = useCIPStore()
  const currentFinding = selectFindingForCell(state, row, section)

  // Get options for this section
  const options = useMemo(() => {
    return puzzle.optionsPerSection[section] || []
  }, [puzzle, section])

  // Get diagnosis name for context
  const diagnosisName = puzzle.diagnoses[row]?.namePt || `Diagnóstico ${row + 1}`

  const handleSelect = (finding: CIPFinding) => {
    selectFinding(row, section, finding.id)
    onClose()
  }

  const handleClear = () => {
    clearCell(row, section)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${CIP_SECTION_LABELS_PT[section]}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Context info */}
        <div className="text-sm text-label-secondary pb-3 border-b border-separator">
          <span className="text-label-primary">Diagnóstico:</span>{' '}
          <span className="text-emerald-400 font-medium">{diagnosisName}</span>
        </div>

        {/* Instructions */}
        <p className="text-xs text-label-tertiary">
          Selecione o achado clínico mais apropriado para este diagnóstico na seção de{' '}
          {CIP_SECTION_LABELS_PT[section].toLowerCase()}.
        </p>

        {/* Options list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {options.map((option) => {
            const isSelected = currentFinding?.id === option.id

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`
                  w-full p-3 text-left rounded-lg border transition-all
                  ${
                    isSelected
                      ? 'bg-emerald-900/40 border-emerald-600 ring-1 ring-emerald-500'
                      : 'bg-surface-2/50 border-separator hover:bg-surface-2 hover:border-surface-4'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Selection indicator */}
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
                      flex items-center justify-center
                      ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-label-tertiary'
                      }
                    `}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>

                  {/* Option text */}
                  <div className="flex-1">
                    <p className={`text-sm ${isSelected ? 'text-emerald-200' : 'text-label-primary'}`}>
                      {option.textPt}
                    </p>
                    {/* Tags if available */}
                    {option.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {option.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 bg-surface-3 text-label-secondary rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-separator">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!currentFinding}
          >
            Limpar seleção
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
