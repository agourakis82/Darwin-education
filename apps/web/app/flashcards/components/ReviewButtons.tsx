'use client'

import type { ReviewQuality } from '@darwin-education/shared'

interface ReviewButtonsProps {
  onReview: (quality: ReviewQuality) => void
}

const reviewOptions: Array<{
  quality: ReviewQuality
  label: string
  description: string
  color: string
  shortcut: string
}> = [
  {
    quality: 1,
    label: 'Errei',
    description: 'Não lembrei',
    color: 'bg-red-600 hover:bg-red-500 border-red-500',
    shortcut: '1',
  },
  {
    quality: 2,
    label: 'Difícil',
    description: 'Lembrei com dificuldade',
    color: 'bg-orange-600 hover:bg-orange-500 border-orange-500',
    shortcut: '2',
  },
  {
    quality: 3,
    label: 'Regular',
    description: 'Lembrei com esforço',
    color: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500',
    shortcut: '3',
  },
  {
    quality: 4,
    label: 'Bom',
    description: 'Lembrei bem',
    color: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500',
    shortcut: '4',
  },
  {
    quality: 5,
    label: 'Fácil',
    description: 'Lembrei facilmente',
    color: 'bg-blue-600 hover:bg-blue-500 border-blue-500',
    shortcut: '5',
  },
]

export function ReviewButtons({ onReview }: ReviewButtonsProps) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-400">
        Como você se saiu?
      </p>
      <div className="grid grid-cols-5 gap-2">
        {reviewOptions.map((option) => (
          <button
            key={option.quality}
            onClick={() => onReview(option.quality)}
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
            <span className="absolute top-1 right-1 text-xs opacity-50 font-mono">
              {option.shortcut}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">
        Use as teclas 1-5 para avaliar rapidamente
      </p>
    </div>
  )
}
