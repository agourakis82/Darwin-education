'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface ThetaIndicatorProps {
  theta: number // raw theta (-4 to 4)
  se: number // standard error
  thetaHistory: { itemNum: number; theta: number; se: number }[]
}

/** Convert raw theta to scaled score (0-1000), clamped. */
function toScaled(theta: number): number {
  return Math.round(Math.min(1000, Math.max(0, 500 + theta * 100)))
}

/** Convert a scaled score to a percentage position on the bar (0-100). */
function toPercent(scaled: number): number {
  return Math.min(100, Math.max(0, (scaled / 1000) * 100))
}

const CUTOFF = 600
const CUTOFF_PERCENT = (CUTOFF / 1000) * 100

export function ThetaIndicator({ theta, se, thetaHistory }: ThetaIndicatorProps) {
  const scaledScore = toScaled(theta)
  const seBand = Math.round(se * 100)
  const markerPercent = toPercent(scaledScore)
  const isAboveCutoff = scaledScore >= CUTOFF

  // SE band edges (clamped to 0-100%)
  const bandLow = toPercent(Math.max(0, scaledScore - seBand))
  const bandHigh = toPercent(Math.min(1000, scaledScore + seBand))

  return (
    <div className="flex flex-col gap-3">
      {/* Scale bar container */}
      <div className="relative h-10">
        {/* Background track */}
        <div className="absolute top-4 left-0 right-0 h-2 bg-surface-2 rounded-full" />

        {/* SE uncertainty band */}
        <div
          className={`absolute top-3 h-4 rounded-full ${
            isAboveCutoff ? 'bg-emerald-500/15' : 'bg-red-500/15'
          }`}
          style={{
            left: `${bandLow}%`,
            width: `${bandHigh - bandLow}%`,
          }}
        />

        {/* Cutoff line at 600 */}
        <div
          className="absolute top-1 h-8 w-px border-l border-dashed border-label-tertiary"
          style={{ left: `${CUTOFF_PERCENT}%` }}
        />
        <span
          className="absolute -top-3 text-[10px] text-label-quaternary -translate-x-1/2"
          style={{ left: `${CUTOFF_PERCENT}%` }}
        >
          600
        </span>

        {/* Current score marker */}
        <motion.div
          className={`absolute top-2 w-3 h-6 rounded-sm -translate-x-1/2 ${
            isAboveCutoff ? 'bg-emerald-400' : 'bg-red-400'
          }`}
          initial={{ left: '50%' }}
          animate={{ left: `${markerPercent}%` }}
          transition={spring.gentle}
        />

        {/* Scale labels */}
        <span className="absolute top-7 left-0 text-[10px] text-label-quaternary">0</span>
        <span className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] text-label-quaternary">
          500
        </span>
        <span className="absolute top-7 right-0 text-[10px] text-label-quaternary">1000</span>
      </div>

      {/* Numeric score display */}
      <div className="flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tabular-nums ${
            isAboveCutoff ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {scaledScore}
        </span>
        <span className="text-sm text-label-secondary">
          pontos
        </span>
        <span className="text-xs text-label-quaternary">
          (SE: ±{seBand})
        </span>
      </div>

      {/* Sparkline of theta history */}
      {thetaHistory.length > 1 && (
        <ThetaSparkline history={thetaHistory} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sparkline sub-component
// ---------------------------------------------------------------------------

function ThetaSparkline({
  history,
}: {
  history: { itemNum: number; theta: number; se: number }[]
}) {
  const width = 200
  const height = 40
  const paddingY = 4

  // Derive scaled scores
  const scores = history.map((h) => toScaled(h.theta))
  const minScore = Math.min(...scores, 0)
  const maxScore = Math.max(...scores, 1000)
  const range = maxScore - minScore || 1

  // Build polyline points
  const points = scores
    .map((score, i) => {
      const x = (i / (scores.length - 1)) * width
      const y = height - paddingY - ((score - minScore) / range) * (height - paddingY * 2)
      return `${x},${y}`
    })
    .join(' ')

  // Cutoff y position
  const cutoffY =
    height - paddingY - ((CUTOFF - minScore) / range) * (height - paddingY * 2)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-label-quaternary uppercase tracking-wider">
        Evolução
      </span>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Cutoff reference line */}
        <line
          x1={0}
          y1={cutoffY}
          x2={width}
          y2={cutoffY}
          stroke="currentColor"
          className="text-label-quaternary"
          strokeWidth={0.5}
          strokeDasharray="4 3"
        />
        {/* Theta polyline */}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          className="text-emerald-400"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Last point dot */}
        {scores.length > 0 && (() => {
          const lastX = width
          const lastScore = scores[scores.length - 1]
          const lastY =
            height - paddingY - ((lastScore - minScore) / range) * (height - paddingY * 2)
          return (
            <circle
              cx={lastX}
              cy={lastY}
              r={2.5}
              className={lastScore >= CUTOFF ? 'fill-emerald-400' : 'fill-red-400'}
            />
          )
        })()}
      </svg>
    </div>
  )
}
