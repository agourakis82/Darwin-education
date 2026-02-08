'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { SpeedAccuracyProfile } from '@darwin-education/shared'

interface SpeedAccuracyPlotProps {
  profile: SpeedAccuracyProfile
}

const QUADRANT_LABELS: Record<string, { label: string; color: string }> = {
  fast_accurate: { label: 'Rapido + Preciso', color: '#10B981' },
  slow_accurate: { label: 'Lento + Preciso', color: '#3B82F6' },
  fast_inaccurate: { label: 'Rapido + Impreciso', color: '#F59E0B' },
  slow_inaccurate: { label: 'Lento + Impreciso', color: '#EF4444' },
}

const BEHAVIOR_COLORS: Record<string, string> = {
  rapid_guess: '#EF4444',
  fast_correct: '#10B981',
  normal: '#8b5cf6',
  slow_careful: '#3B82F6',
  aberrant_slow: '#F59E0B',
}

/**
 * Speed-Accuracy scatter plot for RT-IRT.
 * X-axis = theta (accuracy), Y-axis = tau (speed).
 * 4 quadrants: fast+accurate, slow+accurate, fast+inaccurate, slow+inaccurate.
 */
export function SpeedAccuracyPlot({ profile }: SpeedAccuracyPlotProps) {
  const width = 320
  const height = 280
  const padding = 45
  const plotW = width - padding * 2
  const plotH = height - padding * 2

  // Map theta [-4,4] to x, tau [-3,3] to y
  const toX = (theta: number) => padding + ((theta + 4) / 8) * plotW
  const toY = (tau: number) => padding + ((3 - tau) / 6) * plotH

  // Quadrant dividers at theta=0, tau=0
  const midX = toX(0)
  const midY = toY(0)

  // Student point
  const sx = toX(profile.theta)
  const sy = toY(profile.tau)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Velocidade x Precisao (RT-IRT)
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[320px] mx-auto">
          {/* Quadrant backgrounds */}
          <rect x={midX} y={padding} width={toX(4) - midX} height={midY - padding}
            fill="#10B981" opacity={0.05} />
          <rect x={padding} y={padding} width={midX - padding} height={midY - padding}
            fill="#3B82F6" opacity={0.05} />
          <rect x={padding} y={midY} width={midX - padding} height={toY(-3) - midY}
            fill="#EF4444" opacity={0.05} />
          <rect x={midX} y={midY} width={toX(4) - midX} height={toY(-3) - midY}
            fill="#F59E0B" opacity={0.05} />

          {/* Grid lines */}
          {[-2, 0, 2].map((v) => (
            <g key={`grid-${v}`}>
              <line x1={toX(v)} y1={padding} x2={toX(v)} y2={toY(-3)}
                stroke="currentColor" className="text-label-faint" strokeDasharray="2,4" />
              <line x1={padding} y1={toY(v)} x2={toX(4)} y2={toY(v)}
                stroke="currentColor" className="text-label-faint" strokeDasharray="2,4" />
            </g>
          ))}

          {/* Quadrant dividers */}
          <line x1={midX} y1={padding} x2={midX} y2={toY(-3)}
            stroke="currentColor" className="text-label-quaternary" strokeWidth={1} />
          <line x1={padding} y1={midY} x2={toX(4)} y2={midY}
            stroke="currentColor" className="text-label-quaternary" strokeWidth={1} />

          {/* Response behavior dots */}
          {profile.responseBehaviors.map((b, i) => (
            <motion.circle
              key={i}
              cx={toX(profile.theta + (Math.random() - 0.5) * 0.5)}
              cy={toY(profile.tau + (Math.random() - 0.5) * 0.3)}
              r={2.5}
              fill={BEHAVIOR_COLORS[b.classification] || '#8b5cf6'}
              opacity={0.4}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: i * 0.02 }}
            />
          ))}

          {/* Student position */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...spring.bouncy, delay: 0.5 }}
          >
            {/* Crosshair */}
            <line x1={sx - 8} y1={sy} x2={sx + 8} y2={sy}
              stroke="#8b5cf6" strokeWidth={1.5} opacity={0.6} />
            <line x1={sx} y1={sy - 8} x2={sx} y2={sy + 8}
              stroke="#8b5cf6" strokeWidth={1.5} opacity={0.6} />
            {/* SE ellipse */}
            <ellipse cx={sx} cy={sy}
              rx={(profile.thetaSE / 8) * plotW}
              ry={(profile.tauSE / 6) * plotH}
              fill="#8b5cf6" opacity={0.15}
              stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3,3"
            />
            {/* Main dot */}
            <circle cx={sx} cy={sy} r={6}
              fill="#8b5cf6" stroke="white" strokeWidth={2} />
          </motion.g>

          {/* Quadrant labels */}
          <text x={toX(2)} y={padding + 14} textAnchor="middle"
            className="fill-emerald-400/60" fontSize={8}>Rapido + Preciso</text>
          <text x={toX(-2)} y={padding + 14} textAnchor="middle"
            className="fill-blue-400/60" fontSize={8}>Lento + Preciso</text>
          <text x={toX(-2)} y={toY(-3) - 6} textAnchor="middle"
            className="fill-red-400/60" fontSize={8}>Lento + Impreciso</text>
          <text x={toX(2)} y={toY(-3) - 6} textAnchor="middle"
            className="fill-amber-400/60" fontSize={8}>Rapido + Impreciso</text>

          {/* Axis labels */}
          <text x={width / 2} y={height - 4} textAnchor="middle"
            className="fill-label-tertiary" fontSize={10}>
            Theta (Precisao)
          </text>
          <text x={8} y={height / 2} textAnchor="middle"
            className="fill-label-tertiary" fontSize={10}
            transform={`rotate(-90 8 ${height / 2})`}>
            Tau (Velocidade)
          </text>

          {/* Axis ticks */}
          {[-2, 0, 2].map((v) => (
            <g key={`tick-${v}`}>
              <text x={toX(v)} y={toY(-3) + 14} textAnchor="middle"
                className="fill-label-quaternary" fontSize={8}>{v}</text>
              <text x={padding - 6} y={toY(v) + 3} textAnchor="end"
                className="fill-label-quaternary" fontSize={8}>{v}</text>
            </g>
          ))}
        </svg>

        {/* Summary */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="text-center">
            <div className="text-label-primary font-mono">{profile.theta.toFixed(2)}</div>
            <div className="text-label-quaternary">Theta</div>
          </div>
          <div className="text-center">
            <div className="text-label-primary font-mono">{profile.tau.toFixed(2)}</div>
            <div className="text-label-quaternary">Tau</div>
          </div>
          <div className="text-center">
            {(() => {
              const q = profile.theta >= 0
                ? (profile.tau >= 0 ? 'fast_accurate' : 'slow_accurate')
                : (profile.tau >= 0 ? 'fast_inaccurate' : 'slow_inaccurate')
              return (
                <div className="text-label-primary font-mono" style={{
                  color: QUADRANT_LABELS[q]?.color
                }}>
                  {QUADRANT_LABELS[q]?.label || q}
                </div>
              )
            })()}
            <div className="text-label-quaternary">Quadrante</div>
          </div>
        </div>
      </div>
    </div>
  )
}
