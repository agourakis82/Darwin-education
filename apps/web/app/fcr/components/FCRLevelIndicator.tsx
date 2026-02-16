'use client'

import { Check } from 'lucide-react'
import type { FCRLevel, ConfidenceRating } from '@darwin-education/shared'
import { FCR_LEVEL_ORDER, FCR_LEVEL_LABELS_PT } from '@darwin-education/shared'

interface FCRLevelIndicatorProps {
  currentLevel: FCRLevel
  isSubmitted?: boolean
  confidences?: Record<FCRLevel, ConfidenceRating | null>
}

export function FCRLevelIndicator({
  currentLevel,
  isSubmitted = false,
  confidences,
}: FCRLevelIndicatorProps) {
  const currentIndex = FCR_LEVEL_ORDER.indexOf(currentLevel)

  return (
    <div className="flex items-center gap-1 w-full">
      {FCR_LEVEL_ORDER.map((level, index) => {
        const isActive = level === currentLevel && !isSubmitted
        const isDone = isSubmitted || index < currentIndex
        const confidence = confidences?.[level]

        return (
          <div key={level} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  transition-colors duration-200
                  ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isDone ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={`text-xs mt-1 text-center ${
                  isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {FCR_LEVEL_LABELS_PT[level]}
              </span>
              {isDone && confidence && (
                <span className="text-[10px] text-muted-foreground">
                  {confidence}/5
                </span>
              )}
            </div>

            {index < FCR_LEVEL_ORDER.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 -mt-4 ${
                  isDone ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
