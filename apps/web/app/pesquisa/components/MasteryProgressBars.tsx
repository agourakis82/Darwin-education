'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { BKTMasteryState, MasteryClassification } from '@darwin-education/shared'

interface MasteryProgressBarsProps {
  masteryStates: BKTMasteryState[]
  maxItems?: number
}

const CLASSIFICATION_STYLES: Record<MasteryClassification, {
  bg: string; fill: string; label: string
}> = {
  mastered: { bg: 'bg-emerald-500/10', fill: 'bg-emerald-500', label: 'Dominado' },
  near_mastery: { bg: 'bg-blue-500/10', fill: 'bg-blue-500', label: 'Quase' },
  learning: { bg: 'bg-amber-500/10', fill: 'bg-amber-500', label: 'Aprendendo' },
  not_started: { bg: 'bg-gray-500/10', fill: 'bg-gray-600', label: 'Nao Iniciado' },
}

/**
 * Per-KC progress bars showing BKT mastery percentage.
 * Sorted by mastery descending with classification badges.
 */
export function MasteryProgressBars({ masteryStates, maxItems = 20 }: MasteryProgressBarsProps) {
  const sorted = [...masteryStates]
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, maxItems)

  if (sorted.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
          Progresso por Componente
        </h4>
        <div className="bg-surface-2 rounded-lg p-6 text-center text-label-quaternary text-sm">
          Nenhum componente rastreado ainda.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Progresso por Componente (BKT)
      </h4>

      <div className="bg-surface-2 rounded-lg p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {sorted.map((state, i) => {
          const style = CLASSIFICATION_STYLES[state.classification]
          const pct = Math.round(state.mastery * 100)

          return (
            <motion.div
              key={state.kcId}
              className="space-y-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.gentle, delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-label-secondary truncate max-w-[60%]">
                  {state.kcId.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${style.bg} text-label-tertiary`}>
                    {style.label}
                  </span>
                  <span className="text-label-primary font-mono w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${style.fill}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ...spring.gentle, delay: 0.1 + i * 0.03 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
