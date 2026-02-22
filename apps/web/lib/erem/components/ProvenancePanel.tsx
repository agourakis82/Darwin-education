'use client'

import { cn } from '@/lib/utils'
import { ProvenanceEntry } from '@/lib/erem/epistemicTypes'

interface ProvenancePanelProps {
  provenance: ProvenanceEntry[]
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
  daysOfData: number
  className?: string
}

const SOURCE_LABELS: Record<string, string> = {
  theta_trend_analysis: 'Análise de Tendência Theta',
  theta_volatility_analysis: 'Análise de Volatilidade Theta',
  semantic_analysis: 'Análise Semântica DDL',
  lacuna_pattern_analysis: 'Análise de Padrões de Lacuna',
  concept_coverage_analysis: 'Análise de Cobertura de Conceitos',
  login_frequency_analysis: 'Análise de Frequência de Login',
  session_duration_analysis: 'Análise de Duração de Sessão',
  pause_pattern_analysis: 'Análise de Padrões de Pausa',
  response_time_pattern_analysis: 'Análise de Tempo de Resposta',
  hesitation_pattern_analysis: 'Análise de Padrões de Hesitação',
  anxiety_indicators_analysis: 'Análise de Indicadores de Ansiedade',
  study_schedule_regularity_analysis: 'Análise de Regularidade de Estudos',
  keystroke_dynamics_analysis: 'Análise de Dinâmica de Digitação',
  area_performance_variance_analysis: 'Análise de Variância por Área',
  recent_performance_trend_analysis: 'Análise de Tendência Recente',
  difficulty_progression_analysis: 'Análise de Progressão de Dificuldade',
  knowledge_retention_analysis: 'Análise de Retenção de Conhecimento',
  clinical_reasoning_fusion: 'Fusão de Raciocínio Clínico',
  engagement_fusion: 'Fusão de Engajamento',
  wellbeing_fusion: 'Fusão de Bem-estar',
  academic_fusion: 'Fusão Acadêmica',
  composite_risk_fusion: 'Fusão de Risco Composto',
  shap_prediction: 'Predição SHAP',
}

export function ProvenancePanel({
  provenance,
  dataQuality,
  daysOfData,
  className,
}: ProvenancePanelProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' }
      case 'good':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
      case 'fair':
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }
      case 'poor':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    }
  }

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'Excelente'
      case 'good':
        return 'Bom'
      case 'fair':
        return 'Razoável'
      case 'poor':
        return 'Insuficiente'
      default:
        return quality
    }
  }

  const qualityColors = getQualityColor(dataQuality)

  // Group provenance by source type
  const groupedProvenance = provenance.reduce((acc, entry) => {
    const type = entry.source.includes('fusion') ? 'fusion' : 'analysis'
    if (!acc[type]) acc[type] = []
    acc[type].push(entry)
    return acc
  }, {} as Record<string, ProvenanceEntry[]>)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Data quality summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={cn('px-2 py-1 rounded text-sm font-medium', qualityColors.bg, qualityColors.text)}>
            {getQualityLabel(dataQuality)}
          </div>
          <span className="text-sm text-gray-600">
            {daysOfData} dias de dados
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {provenance.length} fontes de dados
        </span>
      </div>

      {/* Provenance list */}
      <div className="space-y-3">
        {Object.entries(groupedProvenance).map(([type, entries]) => (
          <div key={type} className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {type === 'fusion' ? 'Fusões de Risco' : 'Análises de Sinais'}
            </h4>
            <div className="space-y-1">
              {entries.map((entry, index) => {
                const label = SOURCE_LABELS[entry.source] || entry.source
                const confidence = Math.round(entry.confidence * 100)
                const age = Math.round(
                  (Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60)
                )
                const ageDisplay = age < 1 ? 'Recente' : age < 24 ? `${age}h` : `${Math.round(age / 24)}d`

                return (
                  <div
                    key={`${entry.source}-${index}`}
                    className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          confidence >= 70 ? 'bg-emerald-500' : confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                      />
                      <span className="text-gray-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span title="Idade dos dados">{ageDisplay}</span>
                      <span
                        className={cn(
                          'font-medium',
                          confidence >= 70 ? 'text-emerald-600' : confidence >= 40 ? 'text-amber-600' : 'text-red-600'
                        )}
                        title="Confiança"
                      >
                        {confidence}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Alta confiança</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Média</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Baixa</span>
        </div>
      </div>
    </div>
  )
}

interface DataSourceSummaryProps {
  sources: {
    irtResponses: number
    ddlResponses: number
    examAttempts: number
    telemetryEvents: number
    flashcards: number
  }
}

export function DataSourceSummary({ sources }: DataSourceSummaryProps) {
  const total = Object.values(sources).reduce((a, b) => a + b, 0)

  const sourceLabels: Record<string, { label: string; color: string }> = {
    irtResponses: { label: 'Respostas IRT', color: 'bg-blue-500' },
    ddlResponses: { label: 'Respostas DDL', color: 'bg-purple-500' },
    examAttempts: { label: 'Simulados', color: 'bg-emerald-500' },
    telemetryEvents: { label: 'Eventos Telemetria', color: 'bg-amber-500' },
    flashcards: { label: 'Flashcards', color: 'bg-rose-500' },
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Fontes de Dados</h4>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
        {Object.entries(sources).map(([key, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          const { color } = sourceLabels[key] || { color: 'bg-gray-400' }

          return (
            <div
              key={key}
              className={cn(color, 'transition-all')}
              style={{ width: `${percentage}%` }}
              title={`${sourceLabels[key]?.label || key}: ${count}`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(sources).map(([key, count]) => {
          const { label, color } = sourceLabels[key] || { label: key, color: 'bg-gray-400' }

          return (
            <div key={key} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded', color)} />
              <span className="text-gray-600">{label}</span>
              <span className="text-gray-400">({count})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
