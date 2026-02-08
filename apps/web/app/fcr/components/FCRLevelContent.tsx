'use client'

import { Check } from 'lucide-react'
import type { FCROption, FCRLevel, ConfidenceRating } from '@darwin-education/shared'
import { FCR_LEVEL_LABELS_PT } from '@darwin-education/shared'
import { ConfidenceSlider } from './ConfidenceSlider'

interface FCRLevelContentProps {
  level: FCRLevel
  options: FCROption[]
  selectedValue: string | null
  selectedValues: string[]
  confidence: ConfidenceRating | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onConfidenceChange: (rating: ConfidenceRating) => void
  isSubmitted?: boolean
}

const LEVEL_INSTRUCTIONS: Record<FCRLevel, string> = {
  dados: 'Identifique os dados-chave da apresentacao clinica (multipla escolha):',
  padrao: 'Qual padrao ou sindrome clinica esses dados sugerem?',
  hipotese: 'Qual e o diagnostico mais provavel?',
  conduta: 'Qual e a conduta mais adequada?',
}

export function FCRLevelContent({
  level,
  options,
  selectedValue,
  selectedValues,
  confidence,
  onSelect,
  onToggle,
  onConfidenceChange,
  isSubmitted = false,
}: FCRLevelContentProps) {
  const isMultiSelect = level === 'dados'
  const levelLabel = FCR_LEVEL_LABELS_PT[level]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{levelLabel}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {LEVEL_INSTRUCTIONS[level]}
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

                <div className="flex-1 min-w-0">
                  <span className="text-sm">{option.textPt}</span>
                  {isSubmitted && option.explanationPt && (isSelected || option.isCorrect) && (
                    <p
                      className={`text-xs mt-1 ${
                        option.isCorrect ? 'text-green-400/80' : 'text-red-400/80'
                      }`}
                    >
                      {option.explanationPt}
                    </p>
                  )}
                </div>

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

      {/* Confidence slider below options */}
      {!isSubmitted && (
        <div className="pt-2 border-t border-border">
          <ConfidenceSlider
            value={confidence}
            onChange={onConfidenceChange}
            disabled={isSubmitted}
          />
        </div>
      )}
    </div>
  )
}
