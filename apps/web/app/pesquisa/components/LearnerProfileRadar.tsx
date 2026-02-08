'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface LearnerProfileRadarProps {
  dimensions: {
    label: string
    value: number  // 0-1 normalized
    color: string
  }[]
}

/**
 * 6-axis radar for unified learner profile:
 * IRT, MIRT, FCR, BKT, HLR, Engagement
 */
export function LearnerProfileRadar({ dimensions }: LearnerProfileRadarProps) {
  const cx = 140
  const cy = 140
  const maxR = 95
  const levels = [0.25, 0.5, 0.75, 1.0]
  const ndim = dimensions.length

  const angleStep = (2 * Math.PI) / ndim
  const toPoint = (i: number, r: number) => ({
    x: cx + r * maxR * Math.sin(i * angleStep),
    y: cy - r * maxR * Math.cos(i * angleStep),
  })

  // Build polygon
  const profilePoints = dimensions.map((d, i) => toPoint(i, d.value))
  const profilePath = profilePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ') + 'Z'

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Perfil Unificado do Aprendiz
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
          {/* Level rings */}
          {levels.map((level) => {
            const ringPath = Array.from({ length: ndim }, (_, i) => {
              const p = toPoint(i, level)
              return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`
            }).join(' ') + 'Z'
            return (
              <path key={level} d={ringPath}
                fill="none" stroke="currentColor" className="text-label-faint" strokeWidth={0.5} />
            )
          })}

          {/* Axis lines + labels */}
          {dimensions.map((d, i) => {
            const p = toPoint(i, 1)
            const lp = toPoint(i, 1.2)
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={p.x} y2={p.y}
                  stroke="currentColor" className="text-label-faint" strokeWidth={0.5} />
                <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                  className="fill-label-secondary" fontSize={8} fontWeight={500}>
                  {d.label}
                </text>
              </g>
            )
          })}

          {/* Profile polygon */}
          <motion.path
            d={profilePath}
            fill="#8b5cf6" fillOpacity={0.15}
            stroke="#8b5cf6" strokeWidth={2} strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Data points */}
          {profilePoints.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x} cy={p.y} r={4}
              fill={dimensions[i].color}
              stroke="white" strokeWidth={1.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.5 + i * 0.08 }}
            />
          ))}
        </svg>

        {/* Values table */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {dimensions.map((d) => (
            <div key={d.label} className="text-center">
              <div className="text-label-primary font-mono text-sm">
                {Math.round(d.value * 100)}%
              </div>
              <div className="text-[10px] text-label-quaternary">{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
