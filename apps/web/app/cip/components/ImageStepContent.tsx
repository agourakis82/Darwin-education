'use client'

import { Check } from 'lucide-react'
import type { ImageOption, ImageInterpretationStep } from '@darwin-education/shared'
import { IMAGE_STEP_LABELS_PT } from '@darwin-education/shared'

interface ImageStepContentProps {
  step: ImageInterpretationStep
  options: ImageOption[]
  selectedValue: string | null
  selectedValues: string[]
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  isSubmitted?: boolean
}

export function ImageStepContent({
  step,
  options,
  selectedValue,
  selectedValues,
  onSelect,
  onToggle,
  isSubmitted = false,
}: ImageStepContentProps) {
  const isMultiSelect = step === 'findings'
  const stepLabel = IMAGE_STEP_LABELS_PT[step]

  const instructions: Record<string, string> = {
    modality: 'Identifique a modalidade do exame de imagem apresentado:',
    findings: 'Selecione todos os achados presentes na imagem (múltipla escolha):',
    diagnosis: 'Qual é o diagnóstico mais provável?',
    next_step: 'Qual é a conduta mais adequada?',
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{stepLabel}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {instructions[step] || ''}
        </p>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = isMultiSelect
            ? selectedValues.includes(option.id)
            : selectedValue === option.id

          let borderColor = 'border-border hover:border-primary/50'
          let bgColor = 'bg-card'

          if (isSelected && !isSubmitted) {
            borderColor = 'border-primary'
            bgColor = 'bg-primary/10'
          } else if (isSubmitted && option.isCorrect) {
            borderColor = 'border-green-500'
            bgColor = 'bg-green-500/10'
          } else if (isSubmitted && isSelected && !option.isCorrect) {
            borderColor = 'border-red-500'
            bgColor = 'bg-red-500/10'
          }

          return (
            <button
              key={option.id}
              onClick={() => {
                if (isSubmitted) return
                if (isMultiSelect) {
                  onToggle(option.id)
                } else {
                  onSelect(option.id)
                }
              }}
              disabled={isSubmitted}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-150
                ${borderColor} ${bgColor}
                ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <div className="mt-0.5 flex-shrink-0">
                  {isMultiSelect ? (
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs
                        ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        }
                        ${isSubmitted && option.isCorrect ? 'bg-green-500 border-green-500 text-white' : ''}
                        ${isSubmitted && isSelected && !option.isCorrect ? 'bg-red-500 border-red-500 text-white' : ''}
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${
                          isSelected
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }
                        ${isSubmitted && option.isCorrect ? 'border-green-500' : ''}
                        ${isSubmitted && isSelected && !option.isCorrect ? 'border-red-500' : ''}
                      `}
                    >
                      {isSelected && (
                        <div
                          className={`w-3 h-3 rounded-full
                            ${isSubmitted && option.isCorrect ? 'bg-green-500' : ''}
                            ${isSubmitted && isSelected && !option.isCorrect ? 'bg-red-500' : ''}
                            ${!isSubmitted && isSelected ? 'bg-primary' : ''}
                          `}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Option text */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{option.textPt}</span>
                  {/* Per-option explanation after submission */}
                  {isSubmitted && option.explanationPt && (isSelected || option.isCorrect) && (
                    <p className={`text-xs mt-1 ${
                      option.isCorrect ? 'text-green-400/80' : 'text-red-400/80'
                    }`}>
                      {option.explanationPt}
                    </p>
                  )}
                </div>

                {/* Correctness indicator after submission */}
                {isSubmitted && option.isCorrect && (
                  <span className="ml-auto text-green-500 text-sm font-medium flex-shrink-0">
                    Correto
                  </span>
                )}
                {isSubmitted && isSelected && !option.isCorrect && (
                  <span className="ml-auto text-red-500 text-sm font-medium flex-shrink-0">
                    Incorreto
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
