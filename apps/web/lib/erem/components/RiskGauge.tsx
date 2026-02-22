'use client'

import { cn } from '@/lib/utils'

interface RiskGaugeProps {
  value: number
  confidence: number
  lowerBound: number
  upperBound: number
  label: string
  showConfidenceBand?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RiskGauge({
  value,
  confidence,
  lowerBound,
  upperBound,
  label,
  showConfidenceBand = true,
  size = 'md',
}: RiskGaugeProps) {
  const percentage = Math.round(value * 100)
  const lowerPercentage = Math.round(lowerBound * 100)
  const upperPercentage = Math.round(upperBound * 100)
  const confidencePercentage = Math.round(confidence * 100)

  const getColor = (val: number) => {
    if (val < 0.3) return { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500/30' }
    if (val < 0.5) return { bg: 'bg-lime-500', text: 'text-lime-500', ring: 'ring-lime-500/30' }
    if (val < 0.7) return { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500/30' }
    if (val < 0.85) return { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/30' }
    return { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500/30' }
  }

  const getRiskLevel = (val: number) => {
    if (val < 0.3) return 'Baixo'
    if (val < 0.5) return 'Moderado'
    if (val < 0.7) return 'Elevado'
    if (val < 0.85) return 'Alto'
    return 'Crítico'
  }

  const colors = getColor(value)
  const riskLevel = getRiskLevel(value)

  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-sm', label: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-lg', label: 'text-sm' },
    lg: { container: 'w-40 h-40', text: 'text-2xl', label: 'text-base' },
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizeClasses[size].container)}>
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          
          {/* Confidence band (if enabled) */}
          {showConfidenceBand && (
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${(upperPercentage - lowerPercentage) * 2.64} ${264 - (upperPercentage - lowerPercentage) * 2.64}`}
              strokeDashoffset={-lowerPercentage * 2.64}
              className={cn('opacity-30', colors.bg.replace('bg-', 'text-'))}
            />
          )}
          
          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
            className={colors.bg.replace('bg-', 'text-')}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', sizeClasses[size].text, colors.text)}>
            {percentage}%
          </span>
          {size !== 'sm' && (
            <span className={cn('text-gray-500', sizeClasses[size].label)}>
              {riskLevel}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className={cn('font-medium text-gray-700', sizeClasses[size].label)}>{label}</p>
        {showConfidenceBand && size !== 'sm' && (
          <p className="text-xs text-gray-500">
            IC 95%: {lowerPercentage}%-{upperPercentage}% | Conf: {confidencePercentage}%
          </p>
        )}
      </div>
    </div>
  )
}

interface RiskDimensionBarProps {
  label: string
  value: number
  confidence: number
  maxValue?: number
}

export function RiskDimensionBar({
  label,
  value,
  confidence,
  maxValue = 1,
}: RiskDimensionBarProps) {
  const percentage = Math.round((value / maxValue) * 100)
  const confidencePercentage = Math.round(confidence * 100)

  const getColor = (val: number) => {
    if (val < 0.3) return 'bg-emerald-500'
    if (val < 0.5) return 'bg-lime-500'
    if (val < 0.7) return 'bg-amber-500'
    if (val < 0.85) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{percentage}% (conf: {confidencePercentage}%)</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColor(value))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
