'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { StudyRecommendation } from '@darwin-education/shared'
import {
  Target,
  RefreshCcw,
  Brain,
  TrendingUp,
  Layers,
  Zap,
} from 'lucide-react'

interface RecommendationCardsProps {
  recommendations: StudyRecommendation[]
}

const TYPE_CONFIG: Record<string, {
  icon: typeof Target
  color: string
  bg: string
}> = {
  fill_lacuna: { icon: Target, color: 'text-red-400', bg: 'bg-red-500/10' },
  calibrate: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  reduce_forgetting: { icon: RefreshCcw, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  deepen_mastery: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  broaden_coverage: { icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  practice_speed: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
}

const AREA_LABELS: Record<string, string> = {
  clinica_medica: 'Clinica Medica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saude Coletiva',
}

/**
 * Priority-ranked study recommendation cards.
 * Each card shows type, area, description, and suggested action.
 */
export function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
          Recomendacoes de Estudo
        </h4>
        <div className="bg-surface-2 rounded-lg p-6 text-center text-label-quaternary text-sm">
          Nenhuma recomendacao no momento. Continue estudando!
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Recomendacoes de Estudo
      </h4>

      <div className="space-y-2">
        {recommendations.map((rec, i) => {
          const config = TYPE_CONFIG[rec.type] || TYPE_CONFIG.fill_lacuna
          const Icon = config.icon

          return (
            <motion.div
              key={i}
              className="bg-surface-2 rounded-lg p-3 flex items-start gap-3 hover:bg-surface-3/80 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: i * 0.06 }}
            >
              {/* Priority badge + icon */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="text-[10px] font-mono text-label-quaternary">
                  #{i + 1}
                </div>
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {rec.area && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-label-tertiary">
                      {AREA_LABELS[rec.area] || rec.area}
                    </span>
                  )}
                  <div className="h-1.5 flex-1 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.bg.replace('/10', '/50')}`}
                      style={{ width: `${Math.round(rec.priority * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-label-secondary leading-relaxed">
                  {rec.descriptionPt}
                </p>
                <p className="text-[10px] text-label-quaternary mt-1 italic">
                  {rec.action.labelPt}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
