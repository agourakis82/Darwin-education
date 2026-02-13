'use client'

import { motion } from 'framer-motion'
import type { ConfidenceRating } from '@darwin-education/shared'
import { CONFIDENCE_LABELS_PT } from '@darwin-education/shared'

interface ConfidenceSliderProps {
  value: ConfidenceRating | null
  onChange: (rating: ConfidenceRating) => void
  disabled?: boolean
}

const RATING_COLORS: Record<ConfidenceRating, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
  2: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
  3: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
  4: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400' },
  5: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
}

export function ConfidenceSlider({ value, onChange, disabled = false }: ConfidenceSliderProps) {
  const ratings: ConfidenceRating[] = [1, 2, 3, 4, 5]

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Qual sua confiança nesta resposta?
      </label>
      <div className="flex gap-2">
        {ratings.map((rating) => {
          const isSelected = value === rating
          const colors = RATING_COLORS[rating]

          return (
            <motion.button
              key={rating}
              whileTap={disabled ? {} : { scale: 0.95 }}
              onClick={() => !disabled && onChange(rating)}
              disabled={disabled}
              className={`
                flex-1 py-2 px-1 rounded-lg border-2 transition-colors text-center
                ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'}
                ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }
              `}
            >
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <div className="text-lg font-bold">{rating}</div>
                  <div className="text-xs">{CONFIDENCE_LABELS_PT[rating]}</div>
                </motion.div>
              ) : (
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{rating}</div>
                  <div className="text-xs text-muted-foreground">{CONFIDENCE_LABELS_PT[rating]}</div>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
      {value && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs text-center ${RATING_COLORS[value].text}`}
        >
          {value <= 2
            ? 'Sua incerteza será considerada na avaliação metacognitiva'
            : value >= 4
              ? 'Alta confiança será cruzada com o resultado real'
              : 'Confiança moderada'}
        </motion.p>
      )}
    </div>
  )
}
