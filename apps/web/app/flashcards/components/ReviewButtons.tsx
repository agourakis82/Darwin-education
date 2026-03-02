'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
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

const glowColors: Record<number, string> = {
  1: 'rgba(239, 68, 68, 0.45)',
  2: 'rgba(249, 115, 22, 0.45)',
  3: 'rgba(16, 185, 129, 0.45)',
  4: 'rgba(59, 130, 246, 0.45)',
}

const buttonsContainerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const buttonVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring.snappy },
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
    color: 'bg-red-600 border-red-500',
    shortcut: '1',
    intervalKey: 'again',
  },
  {
    rating: 2,
    label: 'Difícil',
    description: 'Lembrei com dificuldade',
    color: 'bg-orange-600 border-orange-500',
    shortcut: '2',
    intervalKey: 'hard',
  },
  {
    rating: 3,
    label: 'Bom',
    description: 'Lembrei com esforço',
    color: 'bg-emerald-600 border-emerald-500',
    shortcut: '3',
    intervalKey: 'good',
  },
  {
    rating: 4,
    label: 'Fácil',
    description: 'Lembrei facilmente',
    color: 'bg-blue-600 border-blue-500',
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
      <motion.div
        className="grid grid-cols-4 gap-2"
        variants={buttonsContainerVariants}
        initial="hidden"
        animate="show"
      >
        {reviewOptions.map((option) => (
          <motion.button
            key={option.rating}
            variants={buttonVariants}
            whileHover={{
              scale: 1.05,
              y: -3,
              boxShadow: `0 12px 30px -8px ${glowColors[option.rating]}, 0 0 0 1px ${glowColors[option.rating].replace('0.45', '0.2')}`,
            }}
            whileTap={{ scale: 0.96, y: 0, boxShadow: 'none' }}
            transition={spring.snappy}
            onClick={() => onReview(option.rating)}
            className={`
              relative p-4 rounded-xl border transition-colors
              shadow-inner-shine ${option.color}
              text-white font-medium
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
          </motion.button>
        ))}
      </motion.div>
      <p className="text-center text-xs text-label-tertiary">
        Use as teclas 1-4 para avaliar rapidamente
      </p>
    </div>
  )
}
