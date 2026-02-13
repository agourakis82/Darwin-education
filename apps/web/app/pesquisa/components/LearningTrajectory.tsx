'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface TrajectoryPoint {
  date: string
  overallCompetency: number
  passProbability: number
}

interface LearningTrajectoryProps {
  data: TrajectoryPoint[]
  growthRate?: number
  hasPlateaued?: boolean
  estimatedDaysToTarget?: number | null
}

/**
 * Multi-line time series chart showing overall competency and pass probability
 * over time. Includes growth rate, plateau detection, and target estimation.
 */
export function LearningTrajectory({
  data,
  growthRate,
  hasPlateaued,
  estimatedDaysToTarget,
}: LearningTrajectoryProps) {
  const width = 360
  const height = 200
  const padding = 40
  const plotW = width - padding * 2
  const plotH = height - padding * 2

  if (data.length < 2) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
          Trajetoria de Aprendizagem
        </h4>
        <div className="bg-surface-2 rounded-lg p-6 text-center text-label-quaternary text-sm">
          Dados insuficientes para visualizar trajetoria.
        </div>
      </div>
    )
  }

  const toX = (i: number) => padding + (i / (data.length - 1)) * plotW
  const toY = (v: number) => padding + (1 - v) * plotH

  const competencyPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.overallCompetency)}`)
    .join(' ')

  const passPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.passProbability)}`)
    .join(' ')

  // Pass threshold at 70%
  const passThresholdY = toY(0.7)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Trajetoria de Aprendizagem
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <defs>
            <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
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

          {/* Pass threshold */}
          <line x1={padding} y1={passThresholdY} x2={width - padding} y2={passThresholdY}
            stroke="#10B981" strokeWidth={1} strokeDasharray="4,4" opacity={0.4} />

          {/* Competency area fill */}
          <motion.path
            d={competencyPath + `L${toX(data.length - 1)},${toY(0)}L${toX(0)},${toY(0)}Z`}
            fill="url(#compGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Competency line */}
          <motion.path
            d={competencyPath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
          />

          {/* Pass probability line */}
          <motion.path
            d={passPath}
            fill="none"
            stroke="#10B981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4,4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />

          {/* End points */}
          <motion.circle
            cx={toX(data.length - 1)} cy={toY(data[data.length - 1].overallCompetency)} r={4}
            fill="#8b5cf6" stroke="white" strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...spring.bouncy, delay: 1 }}
          />
          <motion.circle
            cx={toX(data.length - 1)} cy={toY(data[data.length - 1].passProbability)} r={4}
            fill="#10B981" stroke="white" strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...spring.bouncy, delay: 1.2 }}
          />
        </svg>

        {/* Legend + stats */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-purple-500 rounded" />
            <span className="text-label-secondary">Competencia</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-emerald-500 rounded border-t border-dashed" />
            <span className="text-label-secondary">P(Aprovação)</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-label-quaternary">
          {growthRate !== undefined && (
            <span>
              Taxa: <span className={growthRate > 0 ? 'text-emerald-400' : 'text-red-400'}>
                {growthRate > 0 ? '+' : ''}{(growthRate * 100).toFixed(1)}%/sessao
              </span>
            </span>
          )}
          {hasPlateaued && (
            <span className="text-amber-400">Plato detectado</span>
          )}
          {estimatedDaysToTarget != null && estimatedDaysToTarget > 0 && (
            <span>
              ~{Math.round(estimatedDaysToTarget)} dias para meta
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
