'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TimelinePoint {
  date: Date
  calibrationScore: number
  overconfidenceIndex: number
  ece: number
  rollingCalibration: number
  rollingOverconfidence: number
}

interface CalibrationTrendChartProps {
  timeline: TimelinePoint[]
  trending: 'improving' | 'stable' | 'degrading'
}

/**
 * Calibration Trend Chart — shows calibration evolution over time.
 *
 * Displays rolling calibration score + overconfidence index as dual-axis SVG.
 * Uses a rolling window average for smoother visualization.
 */
export function CalibrationTrendChart({ timeline, trending }: CalibrationTrendChartProps) {
  if (timeline.length < 2) {
    return (
      <div className="bg-surface-2 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Complete mais casos para ver a tendencia de calibracao.
        </p>
      </div>
    )
  }

  const width = 320
  const height = 160
  const padding = { top: 20, right: 50, bottom: 30, left: 40 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  // Calibration scale: 0-100
  const calToY = (v: number) => padding.top + (1 - v / 100) * plotH
  // Overconfidence scale: -0.5 to +0.5
  const ocToY = (v: number) => padding.top + (1 - (v + 0.5) / 1) * plotH
  const toX = (i: number) => padding.left + (i / (timeline.length - 1)) * plotW

  // Build path strings
  const calPath = timeline
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${calToY(p.rollingCalibration)}`)
    .join(' ')

  const ocPath = timeline
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${ocToY(p.rollingOverconfidence)}`)
    .join(' ')

  const TrendIcon =
    trending === 'improving' ? TrendingUp :
    trending === 'degrading' ? TrendingDown : Minus

  const trendColor =
    trending === 'improving' ? 'text-emerald-400' :
    trending === 'degrading' ? 'text-red-400' : 'text-muted-foreground'

  const trendLabel =
    trending === 'improving' ? 'Melhorando' :
    trending === 'degrading' ? 'Piorando' : 'Estavel'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Tendência de Calibração
        </h4>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{trendLabel}</span>
        </div>
      </div>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Grid */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line
                x1={padding.left} y1={calToY(v)}
                x2={width - padding.right} y2={calToY(v)}
                stroke="currentColor" className="text-border/20"
                strokeDasharray="2,4"
              />
              <text
                x={padding.left - 4} y={calToY(v) + 3}
                textAnchor="end" className="fill-muted-foreground" fontSize={8}
              >
                {v}
              </text>
            </g>
          ))}

          {/* Overconfidence zero line */}
          <line
            x1={padding.left} y1={ocToY(0)}
            x2={width - padding.right} y2={ocToY(0)}
            stroke="currentColor" className="text-amber-500/30"
            strokeDasharray="3,3"
          />

          {/* Overconfidence right-axis labels */}
          {[-0.3, 0, 0.3].map((v) => (
            <text
              key={v}
              x={width - padding.right + 4} y={ocToY(v) + 3}
              textAnchor="start" className="fill-amber-400/60" fontSize={8}
            >
              {v > 0 ? '+' : ''}{v.toFixed(1)}
            </text>
          ))}

          {/* Calibration area fill */}
          <motion.path
            d={`${calPath} L${toX(timeline.length - 1)},${calToY(0)} L${toX(0)},${calToY(0)} Z`}
            fill="url(#calGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Calibration line */}
          <motion.path
            d={calPath}
            fill="none" stroke="#8b5cf6" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Overconfidence line */}
          <motion.path
            d={ocPath}
            fill="none" stroke="#f59e0b" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="4,2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          {/* Data points for calibration */}
          {timeline.map((point, i) => (
            <motion.circle
              key={i}
              cx={toX(i)} cy={calToY(point.rollingCalibration)}
              r={2.5}
              fill="#8b5cf6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            />
          ))}

          {/* Axis labels */}
          <text
            x={padding.left - 4} y={10}
            textAnchor="end" className="fill-violet-400" fontSize={8}
          >
            Cal.
          </text>
          <text
            x={width - padding.right + 4} y={10}
            textAnchor="start" className="fill-amber-400/60" fontSize={8}
          >
            OC
          </text>

          {/* X-axis: attempt numbers */}
          {timeline.length <= 10
            ? timeline.map((_, i) => (
                <text
                  key={i}
                  x={toX(i)} y={height - 6}
                  textAnchor="middle" className="fill-muted-foreground" fontSize={8}
                >
                  {i + 1}
                </text>
              ))
            : [0, Math.floor(timeline.length / 2), timeline.length - 1].map((i) => (
                <text
                  key={i}
                  x={toX(i)} y={height - 6}
                  textAnchor="middle" className="fill-muted-foreground" fontSize={8}
                >
                  {i + 1}
                </text>
              ))
          }
          <text
            x={width / 2} y={height}
            textAnchor="middle" className="fill-muted-foreground" fontSize={8}
          >
            Tentativa #
          </text>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-violet-500 rounded" />
            <span>Calibração</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-amber-500 rounded border-t border-dashed" />
            <span>Excesso Conf.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
