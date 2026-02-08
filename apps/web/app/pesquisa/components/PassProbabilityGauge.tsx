'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { spring } from '@/lib/motion'
import { useEffect } from 'react'

interface PassProbabilityGaugeProps {
  probability: number  // 0-1
  overallCompetency: number  // 0-1
}

/**
 * Semicircular gauge showing predicted pass probability (0-100%).
 * Color transitions from red (low) through amber to green (high).
 */
export function PassProbabilityGauge({ probability, overallCompetency }: PassProbabilityGaugeProps) {
  const pct = Math.round(probability * 100)
  const cx = 150
  const cy = 140
  const r = 100
  const strokeWidth = 14

  // Semicircle: arc from 180° to 0° (left to right)
  const startAngle = Math.PI  // 180°
  const endAngle = 0          // 0°
  const sweepAngle = (endAngle - startAngle) * probability

  const arcEndX = cx + r * Math.cos(startAngle + sweepAngle)
  const arcEndY = cy - r * Math.sin(startAngle + sweepAngle)

  // Background arc
  const bgArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  // Value arc (sweep = probability * 180°)
  const largeArc = probability > 0.5 ? 1 : 0
  const valueArc = probability > 0.001
    ? `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`
    : ''

  // Color based on probability
  const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'
  const colorLabel = pct >= 70 ? 'Favoravel' : pct >= 50 ? 'Incerto' : 'Desfavoravel'

  // Animated counter
  const motionValue = useMotionValue(0)
  const displayValue = useTransform(motionValue, (v) => Math.round(v))

  useEffect(() => {
    animate(motionValue, pct, { duration: 1.5, ease: 'easeOut' })
  }, [pct, motionValue])

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Probabilidade de Aprovacao
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox="0 0 300 170" className="w-full max-w-[300px] mx-auto">
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={bgArc}
            fill="none"
            stroke="currentColor"
            className="text-surface-4"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc */}
          {valueArc && (
            <motion.path
              d={valueArc}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}

          {/* Center text */}
          <text x={cx} y={cy - 10} textAnchor="middle"
            className="fill-label-primary" fontSize={36} fontWeight={700}>
            {pct}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle"
            fill={color} fontSize={12} fontWeight={500}>
            {colorLabel}
          </text>

          {/* Scale labels */}
          <text x={cx - r - 4} y={cy + 16} textAnchor="middle"
            className="fill-label-quaternary" fontSize={9}>0%</text>
          <text x={cx} y={cy - r - 10} textAnchor="middle"
            className="fill-label-quaternary" fontSize={9}>50%</text>
          <text x={cx + r + 4} y={cy + 16} textAnchor="middle"
            className="fill-label-quaternary" fontSize={9}>100%</text>
        </svg>

        {/* Competency stat */}
        <div className="mt-2 text-center text-xs text-label-quaternary">
          Competencia geral: <span className="text-label-primary font-mono">
            {Math.round(overallCompetency * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
