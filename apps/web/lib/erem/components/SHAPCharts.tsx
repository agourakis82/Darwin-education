'use client'

import { cn } from '@/lib/utils'

interface SHAPWaterfallProps {
  contributors: Array<{
    feature: string
    shapValue: number
    direction: 'increases_risk' | 'decreases_risk'
    magnitude: 'high' | 'medium' | 'low'
    description: string
  }>
  baseValue: number
  predictedValue: number
  maxFeatures?: number
}

const FEATURE_LABELS: Record<string, string> = {
  thetaTrend: 'Tendência Theta',
  thetaVolatility: 'Volatilidade Theta',
  semanticSimilarity: 'Similaridade Semântica',
  lacunaLIE: 'Lacuna LIE (Integração)',
  lacunaLEm: 'Lacuna LEm (Metodológica)',
  lacunaLE: 'Lacuna LE (Epistêmica)',
  conceptCoverage: 'Cobertura de Conceitos',
  loginFrequency: 'Frequência de Login',
  avgSessionDuration: 'Duração Média Sessão',
  sessionVariance: 'Variância de Sessão',
  streakDays: 'Dias Consecutivos',
  avgResponseTime: 'Tempo Médio de Resposta',
  responseTimeVariance: 'Variância Tempo Resposta',
  hesitationScore: 'Indicador de Hesitação',
  anxietyIndicators: 'Indicadores de Ansiedade',
  studyScheduleRegularity: 'Regularidade de Estudos',
  keystrokeDeviation: 'Desvio de Digitação',
  areaVariance: 'Variância por Área',
  recentPerformanceTrend: 'Tendência Recente',
  difficultyProgression: 'Progressão de Dificuldade',
  knowledgeRetention: 'Retenção de Conhecimento',
  daysSinceLastActivity: 'Dias desde Última Atividade',
  totalQuestionsAnswered: 'Total de Questões',
  overallAccuracy: 'Acurácia Geral',
}

export function SHAPWaterfallChart({
  contributors,
  baseValue,
  predictedValue,
  maxFeatures = 8,
}: SHAPWaterfallProps) {
  const topContributors = contributors.slice(0, maxFeatures)
  const basePercentage = Math.round(baseValue * 100)
  const predictedPercentage = Math.round(predictedValue * 100)

  // Calculate running total for waterfall positioning
  let runningValue = baseValue
  const waterfallItems = topContributors.map((c) => {
    const start = runningValue
    const end = runningValue + c.shapValue
    runningValue = end
    return { ...c, start, end }
  })

  // Find max absolute value for scaling
  const maxAbsValue = Math.max(
    ...waterfallItems.map((w) => Math.abs(w.shapValue)),
    Math.abs(predictedValue - baseValue)
  )

  const scaleValue = (val: number) => (val / (maxAbsValue * 2)) * 100

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Valor Base: <span className="font-medium">{basePercentage}%</span>
        {' → '}
        Predição Final: <span className="font-medium">{predictedPercentage}%</span>
      </div>

      <div className="space-y-2">
        {/* Base value */}
        <div className="flex items-center gap-2">
          <div className="w-32 text-sm text-gray-600">Valor Base</div>
          <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
            <div
              className="absolute h-full bg-gray-400 rounded"
              style={{ left: '50%', width: `${scaleValue(baseValue - 0.5)}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="w-12 text-right text-sm font-medium">{basePercentage}%</div>
        </div>

        {/* SHAP contributions */}
        {waterfallItems.map((item, index) => {
          const isIncrease = item.shapValue > 0
          const colorClass = isIncrease ? 'bg-red-400' : 'bg-emerald-400'
          const label = FEATURE_LABELS[item.feature] || item.feature
          const valuePercent = Math.round(item.shapValue * 100)

          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-32 text-sm text-gray-600 truncate" title={item.description}>
                {label}
              </div>
              <div className="flex-1 h-6 bg-gray-50 rounded relative overflow-hidden">
                <div
                  className={cn('absolute h-full rounded transition-all', colorClass)}
                  style={{
                    left: `${50 + scaleValue(item.start - 0.5)}%`,
                    width: `${Math.abs(scaleValue(item.shapValue))}%`,
                  }}
                />
              </div>
              <div className={cn('w-12 text-right text-sm font-medium', isIncrease ? 'text-red-500' : 'text-emerald-500')}>
                {isIncrease ? '+' : ''}{valuePercent}%
              </div>
            </div>
          )
        })}

        {/* Final predicted value */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <div className="w-32 text-sm font-medium text-gray-700">Predição Final</div>
          <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
            <div
              className={cn(
                'absolute h-full rounded',
                predictedValue > 0.7 ? 'bg-red-500' : predictedValue > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ left: '50%', width: `${scaleValue(predictedValue - 0.5)}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="w-12 text-right text-sm font-bold">{predictedPercentage}%</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 pt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-400 rounded" />
          <span>Aumenta Risco</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-400 rounded" />
          <span>Diminui Risco</span>
        </div>
      </div>
    </div>
  )
}

interface SHAPBarChartProps {
  shapValues: Record<string, number>
  maxFeatures?: number
}

export function SHAPBarChart({ shapValues, maxFeatures = 10 }: SHAPBarChartProps) {
  const sortedFeatures = Object.entries(shapValues)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, maxFeatures)

  const maxAbsValue = Math.max(...sortedFeatures.map(([, v]) => Math.abs(v)))

  return (
    <div className="space-y-2">
      {sortedFeatures.map(([feature, value]) => {
        const isIncrease = value > 0
        const colorClass = isIncrease ? 'bg-red-400' : 'bg-emerald-400'
        const label = FEATURE_LABELS[feature] || feature
        const barWidth = (Math.abs(value) / maxAbsValue) * 100

        return (
          <div key={feature} className="flex items-center gap-2">
            <div className="w-36 text-sm text-gray-600 truncate">{label}</div>
            <div className="flex-1 h-4 bg-gray-50 rounded overflow-hidden">
              <div
                className={cn('h-full rounded transition-all', colorClass)}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className={cn('w-16 text-right text-sm', isIncrease ? 'text-red-500' : 'text-emerald-500')}>
              {isIncrease ? '+' : ''}{(value * 100).toFixed(1)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
