'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface ThetaIndicatorProps {
  theta: number
  se: number
  thetaHistory: { itemNum: number; theta: number; se: number }[]
}

function toScaled(theta: number): number {
  return Math.round(Math.min(1000, Math.max(0, 500 + theta * 100)))
}

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

  const bandLow = toPercent(Math.max(0, scaledScore - seBand))
  const bandHigh = toPercent(Math.min(1000, scaledScore + seBand))

  return (
    <div className="bg-surface-1 border border-separator rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-label-tertiary">
          Estimativa de Desempenho
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isAboveCutoff
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isAboveCutoff ? 'Acima da média' : 'Abaixo da média'}
        </span>
      </div>

      {/* Numeric score */}
      <div className="flex items-baseline gap-2">
        <span
          className={`text-3xl font-bold tabular-nums ${
            isAboveCutoff ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {scaledScore}
        </span>
        <span className="text-sm text-label-secondary">pontos</span>
        <span className="ml-auto text-xs text-label-quaternary tabular-nums">
          ±{seBand} pts
        </span>
      </div>

      {/* Scale bar */}
      <div className="relative h-10">
        <div className="absolute top-4 left-0 right-0 h-2 bg-surface-2 rounded-full" />

        {/* SE uncertainty band */}
        <div
          className={`absolute top-3 h-4 rounded-full ${
            isAboveCutoff ? 'bg-emerald-500/15' : 'bg-red-500/15'
          }`}
          style={{ left: `${bandLow}%`, width: `${bandHigh - bandLow}%` }}
        />

        {/* Cutoff line */}
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

        {/* Score marker */}
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
        <span className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] text-label-quaternary">500</span>
        <span className="absolute top-7 right-0 text-[10px] text-label-quaternary">1000</span>
      </div>

      {/* Sparkline */}
      {thetaHistory.length > 1 && <ThetaSparkline history={thetaHistory} />}
    </div>
  )
}

function ThetaSparkline({
  history,
}: {
  history: { itemNum: number; theta: number; se: number }[]
}) {
  const height = 40
  const paddingY = 4

  const scores = history.map((h) => toScaled(h.theta))
  const minScore = Math.min(...scores, 0)
  const maxScore = Math.max(...scores, 1000)
  const range = maxScore - minScore || 1

  const buildPoints = (w: number) =>
    scores
      .map((score, i) => {
        const x = scores.length > 1 ? (i / (scores.length - 1)) * w : w / 2
        const y =
          height - paddingY - ((score - minScore) / range) * (height - paddingY * 2)
        return `${x},${y}`
      })
      .join(' ')

  const cutoffY =
    height - paddingY - ((CUTOFF - minScore) / range) * (height - paddingY * 2)

  const lastScore = scores[scores.length - 1]
  const lastY =
    height - paddingY - ((lastScore - minScore) / range) * (height - paddingY * 2)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-label-quaternary uppercase tracking-wider">
        Evolução
      </span>
      <svg
        viewBox={`0 0 200 ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
      >
        <line
          x1={0} y1={cutoffY} x2={200} y2={cutoffY}
          stroke="currentColor"
          className="text-label-quaternary"
          strokeWidth={0.5}
          strokeDasharray="4 3"
        />
        <polyline
          points={buildPoints(200)}
          fill="none"
          stroke="currentColor"
          className="text-emerald-400"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={200}
          cy={lastY}
          r={2.5}
          className={lastScore >= CUTOFF ? 'fill-emerald-400' : 'fill-red-400'}
        />
      </svg>
    </div>
  )
}
