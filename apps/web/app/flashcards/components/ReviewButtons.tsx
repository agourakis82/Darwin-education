'use client'

import { FSRS } from '@darwin-education/shared'

type FSRSRating = FSRS.FSRSRating

interface ReviewButtonsProps {
  onReview: (rating: FSRSRating) => void
  /** Show next review intervals for each button */
  intervals?: {
    again: string
    hard: string
    good: string
    easy: string
  }
}

const reviewOptions: Array<{
  rating: FSRSRating
  label: string
  description: string
  color: string
  shortcut: string
  intervalKey: 'again' | 'hard' | 'good' | 'easy'
}> = [
  {
    rating: 1,
    label: 'Errei',
    description: 'Não lembrei',
    color: 'bg-red-600 hover:bg-red-500 border-red-500',
    shortcut: '1',
    intervalKey: 'again',
  },
  {
    rating: 2,
    label: 'Difícil',
    description: 'Lembrei com dificuldade',
    color: 'bg-orange-600 hover:bg-orange-500 border-orange-500',
    shortcut: '2',
    intervalKey: 'hard',
  },
  {
    rating: 3,
    label: 'Bom',
    description: 'Lembrei com esforço',
    color: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500',
    shortcut: '3',
    intervalKey: 'good',
  },
  {
    rating: 4,
    label: 'Fácil',
    description: 'Lembrei facilmente',
    color: 'bg-blue-600 hover:bg-blue-500 border-blue-500',
    shortcut: '4',
    intervalKey: 'easy',
  },
]

export function ReviewButtons({ onReview, intervals }: ReviewButtonsProps) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-label-secondary">
        Como você se saiu?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {reviewOptions.map((option) => (
          <button
            key={option.rating}
            onClick={() => onReview(option.rating)}
            className={`
              relative p-3 rounded-lg border transition-all
              ${option.color}
              text-white font-medium
              hover:scale-105 active:scale-95
            `}
          >
            <div className="text-sm md:text-base">{option.label}</div>
            <div className="text-xs opacity-75 hidden md:block">
              {option.description}
            </div>
            {intervals && (
              <div className="text-xs opacity-60 mt-1">
                {intervals[option.intervalKey]}
              </div>
            )}
            <span className="absolute top-1 right-1 text-xs opacity-50 font-mono">
              {option.shortcut}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-label-tertiary">
        Use as teclas 1-4 para avaliar rapidamente
      </p>
    </div>
  )
}
