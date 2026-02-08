'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { SpeedAccuracyProfile } from '@darwin-education/shared'

interface SpeedDistributionHistogramProps {
  profile: SpeedAccuracyProfile
}

/**
 * Response time distribution histogram with log-normal overlay.
 * Shows how the student's RT distribution compares to the expected model.
 */
export function SpeedDistributionHistogram({ profile }: SpeedDistributionHistogramProps) {
  const width = 320
  const height = 180
  const padding = 40
  const plotW = width - padding * 2
  const plotH = height - padding * 2

  // Collect log-RTs from behaviors
  const logRTs = profile.responseBehaviors
    .map(b => b.logRT)
    .filter((v): v is number => v !== undefined)

  if (logRTs.length < 5) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
          Distribuicao de Tempo
        </h4>
        <div className="bg-surface-2 rounded-lg p-6 text-center text-label-quaternary text-sm">
          Dados insuficientes.
        </div>
      </div>
    )
  }

  // Build histogram bins
  const minRT = Math.min(...logRTs)
  const maxRT = Math.max(...logRTs)
  const numBins = 15
  const binWidth = (maxRT - minRT) / numBins
  const bins = Array.from({ length: numBins }, (_, i) => {
    const low = minRT + i * binWidth
    const high = low + binWidth
    const count = logRTs.filter(rt => rt >= low && rt < high).length
    return { low, high, mid: (low + high) / 2, count }
  })
  const maxCount = Math.max(...bins.map(b => b.count), 1)

  // Log-normal overlay curve
  const mean = logRTs.reduce((s, v) => s + v, 0) / logRTs.length
  const variance = logRTs.reduce((s, v) => s + (v - mean) ** 2, 0) / logRTs.length
  const std = Math.sqrt(variance)
  const curvePoints = Array.from({ length: 40 }, (_, i) => {
    const x = minRT + (i / 39) * (maxRT - minRT)
    const pdf = std > 0
      ? Math.exp(-((x - mean) ** 2) / (2 * std * std)) / (std * Math.sqrt(2 * Math.PI))
      : 0
    return { x, pdf }
  })
  const maxPdf = Math.max(...curvePoints.map(p => p.pdf), 0.001)

  const toX = (v: number) => padding + ((v - minRT) / (maxRT - minRT)) * plotW
  const barToY = (count: number) => padding + (1 - count / maxCount) * plotH
  const curveToY = (pdf: number) => padding + (1 - pdf / maxPdf) * plotH

  const barPixelWidth = (plotW / numBins) * 0.8

  const curvePath = curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x)},${curveToY(p.pdf)}`)
    .join(' ')

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Distribuicao de Tempo de Resposta
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Histogram bars */}
          {bins.map((bin, i) => {
            const bh = (bin.count / maxCount) * plotH
            return (
              <motion.rect
                key={i}
                x={toX(bin.mid) - barPixelWidth / 2}
                y={padding + plotH}
                width={barPixelWidth}
                height={0}
                rx={2}
                fill="#8b5cf6"
                opacity={0.5}
                animate={{ y: padding + plotH - bh, height: bh }}
                transition={{ ...spring.gentle, delay: i * 0.03 }}
              />
            )
          })}

          {/* Log-normal overlay */}
          <motion.path
            d={curvePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Mean line */}
          <line x1={toX(mean)} y1={padding} x2={toX(mean)} y2={padding + plotH}
            stroke="#10B981" strokeWidth={1.5} strokeDasharray="4,4" opacity={0.6} />

          {/* Axis labels */}
          <text x={width / 2} y={height - 2} textAnchor="middle"
            className="fill-label-tertiary" fontSize={9}>
            log(Tempo) em segundos
          </text>

          {/* Tick labels */}
          {[0, 0.5, 1].map((frac) => {
            const v = minRT + frac * (maxRT - minRT)
            return (
              <text key={frac} x={toX(v)} y={padding + plotH + 12}
                textAnchor="middle" className="fill-label-quaternary" fontSize={7}>
                {v.toFixed(1)}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-label-quaternary">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-purple-500/50" />
            <span>Observado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-amber-400" />
            <span>Log-normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-emerald-400 border-t border-dashed" />
            <span>Media</span>
          </div>
        </div>
      </div>
    </div>
  )
}
