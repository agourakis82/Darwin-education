'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { ReliabilityPoint, ConfidenceBinStats } from '@darwin-education/shared'

interface ReliabilityDiagramProps {
  reliabilityData: ReliabilityPoint[]
  bins: ConfidenceBinStats[]
}

/**
 * Reliability Diagram — SOTA calibration visualization.
 *
 * Shows observed accuracy vs expected confidence as a calibration curve.
 * The diagonal is perfect calibration; deviation = miscalibration.
 *
 * Above the diagonal → underconfident (P(correct) > confidence)
 * Below the diagonal → overconfident (P(correct) < confidence)
 *
 * This is the standard visualization from:
 *   - Guo et al. (2017) "On Calibration of Modern Neural Networks"
 *   - DeGroot & Fienberg (1983) "Comparison and Evaluation of Forecasters"
 */
export function ReliabilityDiagram({ reliabilityData, bins }: ReliabilityDiagramProps) {
  const width = 280
  const height = 280
  const padding = 40
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2

  const toX = (v: number) => padding + v * plotWidth
  const toY = (v: number) => padding + (1 - v) * plotHeight

  // Build bar chart data (gap visualization)
  const barWidth = plotWidth / 7

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Diagrama de Confiabilidade
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px] mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line
                x1={toX(0)} y1={toY(v)}
                x2={toX(1)} y2={toY(v)}
                stroke="currentColor" className="text-border/30"
                strokeDasharray="2,4"
              />
              <line
                x1={toX(v)} y1={toY(0)}
                x2={toX(v)} y2={toY(1)}
                stroke="currentColor" className="text-border/30"
                strokeDasharray="2,4"
              />
            </g>
          ))}

          {/* Perfect calibration diagonal */}
          <line
            x1={toX(0)} y1={toY(0)}
            x2={toX(1)} y2={toY(1)}
            stroke="currentColor" className="text-muted-foreground/40"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Gap bars (shaded area between diagonal and curve) */}
          {reliabilityData.map((point, i) => {
            const x = toX(point.binMidpoint)
            const yExpected = toY(point.binMidpoint)
            const yObserved = toY(point.observedAccuracy)
            const gapHeight = Math.abs(yExpected - yObserved)
            const isOverconfident = point.observedAccuracy < point.binMidpoint
            const fillColor = isOverconfident ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'

            return (
              <motion.rect
                key={i}
                x={x - barWidth / 2}
                y={Math.min(yExpected, yObserved)}
                width={barWidth}
                height={gapHeight}
                fill={fillColor}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: gapHeight }}
                transition={{ ...spring.gentle, delay: 0.3 + i * 0.1 }}
              />
            )
          })}

          {/* Calibration curve (observed accuracy) */}
          {reliabilityData.length > 1 && (
            <motion.polyline
              points={reliabilityData
                .map((p) => `${toX(p.binMidpoint)},${toY(p.observedAccuracy)}`)
                .join(' ')}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          )}

          {/* Data points with error bars */}
          {reliabilityData.map((point, i) => {
            const cx = toX(point.binMidpoint)
            const cy = toY(point.observedAccuracy)
            const seTop = toY(Math.min(1, point.observedAccuracy + point.standardError))
            const seBottom = toY(Math.max(0, point.observedAccuracy - point.standardError))

            return (
              <g key={i}>
                {/* Error bar */}
                <motion.line
                  x1={cx} y1={seTop}
                  x2={cx} y2={seBottom}
                  stroke="#8b5cf6" strokeWidth={1} opacity={0.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                />
                {/* Point */}
                <motion.circle
                  cx={cx} cy={cy} r={4}
                  fill="#8b5cf6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...spring.bouncy, delay: 0.5 + i * 0.1 }}
                />
                {/* Count label */}
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={8}
                >
                  n={point.count}
                </text>
              </g>
            )
          })}

          {/* Axis labels */}
          <text
            x={width / 2} y={height - 4}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
          >
            Confianca Reportada
          </text>
          <text
            x={8} y={height / 2}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
            transform={`rotate(-90 8 ${height / 2})`}
          >
            Acuracia Observada
          </text>

          {/* Axis tick labels */}
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <text
                x={toX(v)} y={toY(0) + 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {v.toFixed(1)}
              </text>
              <text
                x={toX(0) - 6} y={toY(v) + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/30" />
            <span>Excesso de confianca</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/30" />
            <span>Subconfianca</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 border-t border-dashed border-muted-foreground/40" />
            <span>Perfeito</span>
          </div>
        </div>
      </div>
    </div>
  )
}
