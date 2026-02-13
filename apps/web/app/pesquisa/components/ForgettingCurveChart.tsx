'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { PersonalizedForgettingCurve, ENAMEDArea } from '@darwin-education/shared'

interface ForgettingCurveChartProps {
  curves: PersonalizedForgettingCurve[]
}

const AREA_COLORS: Record<string, string> = {
  clinica_medica: '#3B82F6',
  cirurgia: '#EF4444',
  ginecologia_obstetricia: '#EC4899',
  pediatria: '#F59E0B',
  saude_coletiva: '#10B981',
}

/**
 * Exponential forgetting curves per area (HLR model).
 * Shows retention decay over time with review markers and target threshold.
 */
export function ForgettingCurveChart({ curves }: ForgettingCurveChartProps) {
  const width = 360
  const height = 200
  const padding = 40
  const plotW = width - padding * 2
  const plotH = height - padding * 2

  if (curves.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
          Curvas de Esquecimento
        </h4>
        <div className="bg-surface-2 rounded-lg p-6 text-center text-label-quaternary text-sm">
          Nenhuma curva disponível ainda. Complete revisões de flashcards.
        </div>
      </div>
    )
  }

  const maxDays = Math.max(...curves.flatMap(c => c.points.map(p => p.day)), 30)

  const toX = (day: number) => padding + (day / maxDays) * plotW
  const toY = (ret: number) => padding + (1 - ret) * plotH

  const targetRetention = 0.85
  const targetY = toY(targetRetention)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Curvas de Esquecimento (HLR)
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <defs>
            {curves.map((curve) => (
              <linearGradient key={`grad-${curve.identifier}`} id={`grad-${curve.identifier}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AREA_COLORS[curve.identifier] || '#8b5cf6'} stopOpacity="0.15" />
                <stop offset="100%" stopColor={AREA_COLORS[curve.identifier] || '#8b5cf6'} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid */}
          {[0.25, 0.5, 0.75, 1.0].map((v) => (
            <g key={v}>
              <line x1={padding} y1={toY(v)} x2={width - padding} y2={toY(v)}
                stroke="currentColor" className="text-label-faint" strokeDasharray="2,4" />
              <text x={padding - 6} y={toY(v) + 3} textAnchor="end"
                className="fill-label-quaternary" fontSize={8}>
                {Math.round(v * 100)}%
              </text>
            </g>
          ))}

          {/* Target retention line */}
          <line x1={padding} y1={targetY} x2={width - padding} y2={targetY}
            stroke="#10B981" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
          <text x={width - padding + 4} y={targetY + 3}
            className="fill-emerald-400" fontSize={7}>
            Alvo 85%
          </text>

          {/* Curves */}
          {curves.map((curve, ci) => {
            const color = AREA_COLORS[curve.identifier] || '#8b5cf6'
            const linePath = curve.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.day)},${toY(p.retention)}`)
              .join(' ')
            const areaPath = linePath +
              `L${toX(curve.points[curve.points.length - 1].day)},${toY(0)}L${toX(0)},${toY(0)}Z`

            return (
              <g key={curve.identifier}>
                {/* Area fill */}
                <motion.path
                  d={areaPath}
                  fill={`url(#grad-${curve.identifier})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: ci * 0.2 }}
                />

                {/* Line */}
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: ci * 0.2 }}
                />

                {/* Half-life marker */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + ci * 0.2 }}
                >
                  <line
                    x1={toX(curve.halfLife)} y1={toY(0.5) - 4}
                    x2={toX(curve.halfLife)} y2={toY(0.5) + 4}
                    stroke={color} strokeWidth={2}
                  />
                  <text x={toX(curve.halfLife)} y={toY(0.5) - 8}
                    textAnchor="middle" fill={color} fontSize={7}>
                    h={curve.halfLife.toFixed(0)}d
                  </text>
                </motion.g>
              </g>
            )
          })}

          {/* X-axis ticks */}
          {[0, 30, 60, 90].filter(v => v <= maxDays).map((day) => (
            <text key={day} x={toX(day)} y={height - padding + 16}
              textAnchor="middle" className="fill-label-quaternary" fontSize={8}>
              {day}d
            </text>
          ))}

          <text x={width / 2} y={height - 2} textAnchor="middle"
            className="fill-label-tertiary" fontSize={9}>
            Dias desde ultima revisao
          </text>
        </svg>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
          {curves.map((curve) => (
            <div key={curve.identifier} className="flex items-center gap-1">
              <div className="w-3 h-1 rounded" style={{ backgroundColor: AREA_COLORS[curve.identifier] || '#8b5cf6' }} />
              <span className="text-label-secondary">{curve.label}</span>
              <span className="text-label-quaternary font-mono">({curve.halfLife.toFixed(0)}d)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
