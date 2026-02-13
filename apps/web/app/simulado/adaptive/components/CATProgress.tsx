'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface CATProgressProps {
  questionNumber: number
  precision: number // 0-100
  minItems: number
  maxItems: number
  isComplete: boolean
}

export function CATProgress({
  questionNumber,
  precision,
  minItems,
  maxItems,
  isComplete,
}: CATProgressProps) {
  const clampedPrecision = Math.min(100, Math.max(0, precision))

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Top row: question number + precision */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-label-primary">
          Questão {questionNumber}
        </span>
        <span className="text-sm text-label-secondary">
          Precisão:{' '}
          <span
            className={`font-semibold ${
              isComplete
                ? 'text-emerald-400'
                : clampedPrecision >= 80
                  ? 'text-emerald-400'
                  : clampedPrecision >= 50
                    ? 'text-yellow-400'
                    : 'text-label-tertiary'
            }`}
          >
            {Math.round(clampedPrecision)}%
          </span>
        </span>
      </div>

      {/* Progress bar row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${clampedPrecision}%` }}
            transition={spring.snappy}
          />
        </div>
        <span className="text-xs text-label-quaternary whitespace-nowrap">
          {minItems}-{maxItems} itens
        </span>
      </div>
    </div>
  )
}
