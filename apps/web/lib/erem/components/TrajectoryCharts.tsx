'use client'

import { cn } from '@/lib/utils'
import { RiskTrajectory } from '@/lib/erem/epistemicTypes'

interface TrajectoryChartProps {
  snapshots: Array<{
    timestamp: string | Date
    compositeRisk: number
    clinicalReasoningRisk: number
    engagementRisk: number
    wellbeingRisk: number
    academicRisk: number
  }>
  trajectory: RiskTrajectory
  forecast?: {
    predictedRisk30Days: number
    lowerBound: number
    upperBound: number
    confidence: number
  }
  height?: number
}

export function TrajectoryChart({
  snapshots,
  trajectory,
  forecast,
  height = 200,
}: TrajectoryChartProps) {
  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 bg-gray-50 rounded-lg">
        Dados insuficientes para análise de trajetória
      </div>
    )
  }

  // Prepare data
  const data = snapshots.map((s) => ({
    ...s,
    date: new Date(s.timestamp),
  }))

  const minRisk = Math.min(...data.map((d) => d.compositeRisk), forecast?.lowerBound ?? 1)
  const maxRisk = Math.max(...data.map((d) => d.compositeRisk), forecast?.upperBound ?? 0)
  const riskRange = maxRisk - minRisk || 1
  const padding = riskRange * 0.1

  const chartMin = Math.max(0, minRisk - padding)
  const chartMax = Math.min(1, maxRisk + padding)
  const chartRange = chartMax - chartMin

  const xScale = (index: number) => (index / (data.length - 1)) * 100
  const yScale = (value: number) => ((chartMax - value) / chartRange) * 100

  const getTrajectoryColor = (t: RiskTrajectory) => {
    switch (t) {
      case 'improving':
        return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' }
      case 'stable':
        return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' }
      case 'declining':
        return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' }
      case 'volatile':
        return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' }
    }
  }

  const trajectoryColors = getTrajectoryColor(trajectory)

  const getTrajectoryLabel = (t: RiskTrajectory) => {
    switch (t) {
      case 'improving':
        return 'Melhorando'
      case 'stable':
        return 'Estável'
      case 'declining':
        return 'Em Declínio'
      case 'volatile':
        return 'Volátil'
    }
  }

  // Generate path for main line
  const pathData = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.compositeRisk)}`)
    .join(' ')

  // Generate area fill
  const areaData = `${pathData} L ${xScale(data.length - 1)} 100 L 0 100 Z`

  // Generate forecast area (if available)
  let forecastPath = ''
  let forecastArea = ''
  if (forecast && data.length > 0) {
    const lastX = xScale(data.length - 1)
    const forecastX = 105 // Extend beyond the chart

    forecastPath = `M ${lastX} ${yScale(data[data.length - 1].compositeRisk)} ` +
      `L ${forecastX} ${yScale(forecast.predictedRisk30Days)}`

    forecastArea = `M ${lastX} ${yScale(forecast.upperBound)} ` +
      `L ${forecastX} ${yScale(forecast.upperBound)} ` +
      `L ${forecastX} ${yScale(forecast.lowerBound)} ` +
      `L ${lastX} ${yScale(forecast.lowerBound)} Z`
  }

  return (
    <div className="space-y-4">
      {/* Trajectory badge */}
      <div className="flex items-center justify-between">
        <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border', trajectoryColors.border)}>
          <div className={cn('w-2 h-2 rounded-full', trajectoryColors.bg)} />
          <span className={cn('text-sm font-medium', trajectoryColors.text)}>
            {getTrajectoryLabel(trajectory)}
          </span>
        </div>
        {forecast && (
          <span className="text-sm text-gray-500">
            Previsão 30d: {Math.round(forecast.predictedRisk30Days * 100)}%
            (IC: {Math.round(forecast.lowerBound * 100)}%-{Math.round(forecast.upperBound * 100)}%)
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 110 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-200"
            />
          ))}

          {/* Historical area fill */}
          <path
            d={areaData}
            fill="url(#riskGradient)"
            opacity="0.3"
          />

          {/* Historical line */}
          <path
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-500"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forecast confidence band */}
          {forecast && (
            <path
              d={forecastArea}
              fill="currentColor"
              className="text-gray-300"
              opacity="0.4"
            />
          )}

          {/* Forecast line */}
          {forecast && (
            <path
              d={forecastPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="text-gray-400"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.compositeRisk)}
              r="2"
              className="fill-blue-500"
            />
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 py-1">
          <span>{Math.round(chartMax * 100)}%</span>
          <span>{Math.round(((chartMax + chartMin) / 2) * 100)}%</span>
          <span>{Math.round(chartMin * 100)}%</span>
        </div>
      </div>

      {/* Date range */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>{data[0].date.toLocaleDateString('pt-BR')}</span>
        <span>{data[data.length - 1].date.toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  )
}

interface DimensionTrendChartProps {
  snapshots: Array<{
    timestamp: string | Date
    clinicalReasoningRisk: number
    engagementRisk: number
    wellbeingRisk: number
    academicRisk: number
  }>
  height?: number
}

export function DimensionTrendChart({ snapshots, height = 150 }: DimensionTrendChartProps) {
  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-500 bg-gray-50 rounded-lg">
        Dados insuficientes
      </div>
    )
  }

  const data = snapshots.map((s) => ({
    ...s,
    date: new Date(s.timestamp),
  }))

  const dimensions = [
    { key: 'clinicalReasoningRisk', label: 'Raciocínio Clínico', color: 'text-blue-500' },
    { key: 'engagementRisk', label: 'Engajamento', color: 'text-purple-500' },
    { key: 'wellbeingRisk', label: 'Bem-estar', color: 'text-rose-500' },
    { key: 'academicRisk', label: 'Acadêmico', color: 'text-amber-500' },
  ] as const

  const xScale = (index: number) => (index / (data.length - 1)) * 100
  const yScale = (value: number) => (1 - value) * 100 // Invert: higher risk = lower on chart

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
        {/* Grid */}
        {[0, 50, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.3" className="text-gray-200" />
        ))}

        {/* Dimension lines */}
        {dimensions.map((dim) => {
          const pathData = data
            .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d[dim.key])}`)
            .join(' ')

          return (
            <path
              key={dim.key}
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={dim.color}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {dimensions.map((dim) => (
          <div key={dim.key} className="flex items-center gap-1">
            <div className={cn('w-2 h-0.5', dim.color.replace('text-', 'bg-'))} />
            <span className="text-gray-600">{dim.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
