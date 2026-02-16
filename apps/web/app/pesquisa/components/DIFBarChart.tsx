'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { DIFAnalysis, DIFItemResult, ETSClassification } from '@darwin-education/shared'

interface DIFBarChartProps {
  analysis: DIFAnalysis
  maxItems?: number
}

const ETS_COLORS: Record<ETSClassification, { bg: string; border: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Negligível' },
  B: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Moderado' },
  C: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Grande' },
}

/**
 * Horizontal bar chart showing DIF delta_MH per item.
 * Color-coded by ETS classification (A=green, B=amber, C=red).
 * Sorted by |delta_MH| descending.
 */
export function DIFBarChart({ analysis, maxItems = 15 }: DIFBarChartProps) {
  const items = analysis.itemResults.slice(0, maxItems)
  const maxDelta = Math.max(2, ...items.map(r => Math.abs(r.mh.deltaMH)))

  const barWidth = 200
  const barHeight = 18
  const labelWidth = 80
  const gap = 4
  const width = labelWidth + barWidth + 60
  const height = items.length * (barHeight + gap) + 40

  const deltaToWidth = (delta: number) => (Math.abs(delta) / maxDelta) * (barWidth / 2)
  const centerX = labelWidth + barWidth / 2

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Análise DIF (Mantel-Haenszel)
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Center line (zero) */}
          <line
            x1={centerX} y1={10}
            x2={centerX} y2={height - 20}
            stroke="currentColor" className="text-label-faint"
            strokeWidth={1}
          />

          {/* Threshold lines at ±1.0 and ±1.5 */}
          {[1.0, 1.5].map((thresh) => {
            const w = deltaToWidth(thresh)
            return (
              <g key={thresh}>
                <line x1={centerX + w} y1={10} x2={centerX + w} y2={height - 20}
                  stroke="currentColor" className="text-label-faint" strokeDasharray="2,4" />
                <line x1={centerX - w} y1={10} x2={centerX - w} y2={height - 20}
                  stroke="currentColor" className="text-label-faint" strokeDasharray="2,4" />
              </g>
            )
          })}

          {/* Items */}
          {items.map((item, i) => {
            const y = 14 + i * (barHeight + gap)
            const delta = item.mh.deltaMH
            const w = deltaToWidth(delta)
            const ets = ETS_COLORS[item.etsClassification]
            const barColor = item.etsClassification === 'C' ? '#EF4444'
              : item.etsClassification === 'B' ? '#F59E0B' : '#10B981'

            return (
              <g key={item.itemId}>
                {/* Label */}
                <text
                  x={labelWidth - 4} y={y + barHeight / 2 + 3}
                  textAnchor="end"
                  className="fill-label-secondary"
                  fontSize={8}
                >
                  {item.itemId.slice(0, 10)}
                </text>

                {/* Bar */}
                <motion.rect
                  x={delta >= 0 ? centerX : centerX - w}
                  y={y}
                  width={0}
                  height={barHeight}
                  rx={3}
                  fill={barColor}
                  opacity={0.7}
                  animate={{ width: w }}
                  transition={{ ...spring.gentle, delay: i * 0.03 }}
                />

                {/* ETS badge */}
                <text
                  x={width - 20} y={y + barHeight / 2 + 3}
                  textAnchor="middle"
                  fill={barColor}
                  fontSize={9}
                  fontWeight={600}
                >
                  {item.etsClassification}
                </text>

                {/* Delta value */}
                <text
                  x={delta >= 0 ? centerX + w + 4 : centerX - w - 4}
                  y={y + barHeight / 2 + 3}
                  textAnchor={delta >= 0 ? 'start' : 'end'}
                  className="fill-label-quaternary"
                  fontSize={7}
                >
                  {delta.toFixed(2)}
                </text>
              </g>
            )
          })}

          {/* Direction labels */}
          <text x={centerX - barWidth / 4} y={height - 4}
            textAnchor="middle" className="fill-label-quaternary" fontSize={8}>
            Favorece Focal
          </text>
          <text x={centerX + barWidth / 4} y={height - 4}
            textAnchor="middle" className="fill-label-quaternary" fontSize={8}>
            Favorece Referencia
          </text>
        </svg>

        {/* Summary */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          {(['A', 'B', 'C'] as ETSClassification[]).map((cls) => (
            <div key={cls} className={`flex items-center gap-1 px-2 py-1 rounded ${ETS_COLORS[cls].bg} border ${ETS_COLORS[cls].border}`}>
              <span className={`font-semibold ${ETS_COLORS[cls].text}`}>{cls}</span>
              <span className="text-label-tertiary">
                {analysis.summary.classificationCounts[cls]}
              </span>
            </div>
          ))}
          <div className="text-label-quaternary">
            Taxa DIF: {Math.round(analysis.summary.difRate * 100)}%
          </div>
        </div>
      </div>
    </div>
  )
}
