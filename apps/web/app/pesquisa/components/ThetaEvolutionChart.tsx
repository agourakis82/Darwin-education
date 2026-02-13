'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface ThetaPoint {
  index: number
  theta: number
  date?: string
}

interface ThetaEvolutionChartProps {
  data: ThetaPoint[]
  label?: string
}

/**
 * Line chart showing IRT theta evolution over time.
 * Shows trend direction and pass threshold reference line.
 */
export function ThetaEvolutionChart({ data, label = 'Evolução do Theta' }: ThetaEvolutionChartProps) {
  if (data.length < 2) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">{label}</h4>
        <div className="bg-surface-2 rounded-lg p-6 text-center text-label-quaternary text-sm">
          Dados insuficientes para visualizar evolução.
        </div>
      </div>
    )
  }

  const width = 360
  const height = 180
  const padding = 40
  const plotW = width - padding * 2
  const plotH = height - padding * 2

  const minTheta = Math.min(-1, ...data.map(d => d.theta))
  const maxTheta = Math.max(2, ...data.map(d => d.theta))
  const range = maxTheta - minTheta

  const toX = (i: number) => padding + (i / (data.length - 1)) * plotW
  const toY = (theta: number) => padding + (1 - (theta - minTheta) / range) * plotH

  // Path
  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.theta)}`)
    .join(' ')

  // Area fill
  const areaPath = path + `L${toX(data.length - 1)},${toY(minTheta)}L${toX(0)},${toY(minTheta)}Z`

  // Pass threshold (theta = 1.0 corresponds to ~600 TRI score)
  const passTheta = 1.0
  const passY = toY(passTheta)

  // Trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const avgFirst = firstHalf.reduce((s, d) => s + d.theta, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((s, d) => s + d.theta, 0) / secondHalf.length
  const trending = avgSecond > avgFirst + 0.1 ? 'up' : avgSecond < avgFirst - 0.1 ? 'down' : 'stable'

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">{label}</h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <defs>
            <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0.25, 0.5, 0.75].map((frac) => {
            const v = minTheta + frac * range
            return (
              <g key={frac}>
                <line x1={padding} y1={toY(v)} x2={width - padding} y2={toY(v)}
                  stroke="currentColor" className="text-label-faint" strokeDasharray="2,4" />
                <text x={padding - 6} y={toY(v) + 3} textAnchor="end"
                  className="fill-label-quaternary" fontSize={8}>
                  {v.toFixed(1)}
                </text>
              </g>
            )
          })}

          {/* Pass threshold */}
          {passTheta >= minTheta && passTheta <= maxTheta && (
            <g>
              <line x1={padding} y1={passY} x2={width - padding} y2={passY}
                stroke="#10B981" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
              <text x={width - padding + 4} y={passY + 3}
                className="fill-emerald-400" fontSize={7}>
                Aprovação
              </text>
            </g>
          )}

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill="url(#thetaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Line */}
          <motion.path
            d={path}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
          />

          {/* Points */}
          {data.map((d, i) => (
            <motion.circle
              key={i}
              cx={toX(i)} cy={toY(d.theta)} r={3}
              fill="#8b5cf6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.5 + i * 0.03 }}
            />
          ))}

          {/* Axis labels */}
          <text x={width / 2} y={height - 2} textAnchor="middle"
            className="fill-label-tertiary" fontSize={9}>
            Tentativas
          </text>
        </svg>

        {/* Trend indicator */}
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className="text-label-quaternary">Tendencia:</span>
          <span className={
            trending === 'up' ? 'text-emerald-400' :
            trending === 'down' ? 'text-red-400' : 'text-amber-400'
          }>
            {trending === 'up' ? 'Crescente' : trending === 'down' ? 'Decrescente' : 'Estavel'}
          </span>
          <span className="text-label-quaternary">
            ({data[data.length - 1].theta.toFixed(2)} atual)
          </span>
        </div>
      </div>
    </div>
  )
}
