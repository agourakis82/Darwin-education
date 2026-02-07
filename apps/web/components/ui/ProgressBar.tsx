'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  color?: 'emerald' | 'purple' | 'cyan' | 'orange' | 'rose'
  className?: string
}

const colorStyles = {
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
  cyan: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
  orange: 'bg-gradient-to-r from-orange-500 to-orange-400',
  rose: 'bg-gradient-to-r from-rose-500 to-rose-400',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'emerald',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-label-secondary">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-label-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorStyles[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
