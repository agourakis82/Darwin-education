'use client'

import { motion } from 'framer-motion'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import { spring } from '@/lib/motion'
import type { ENAMEDArea, AreaPerformance } from '@darwin-education/shared'

interface ExamResultsProps {
  areaBreakdown: Record<ENAMEDArea, AreaPerformance>
}

const rowContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: spring.snappy },
}

export function ExamResults({ areaBreakdown }: ExamResultsProps) {
  const areas = Object.keys(areaBreakdown) as ENAMEDArea[]

  // Sort areas by performance (worst first)
  const sortedAreas = [...areas].sort(
    (a, b) => areaBreakdown[a].percentage - areaBreakdown[b].percentage
  )

  return (
    <div
      className="darwin-panel border border-separator/40 rounded-2xl p-6"
      style={{
        boxShadow:
          '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.08)',
      }}
    >
      <h3 className="text-headline font-semibold text-label-primary mb-5">Desempenho por Área</h3>

      <motion.div
        className="space-y-4"
        variants={rowContainerVariants}
        initial="hidden"
        animate="show"
      >
        {sortedAreas.map((area) => {
          const performance = areaBreakdown[area]
          const percentage = Math.round(performance.percentage)

          return (
            <motion.div key={area} variants={rowVariants}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${AREA_COLORS[area]?.solid ?? ''}`} />
                  <span className="text-callout font-medium text-label-primary">
                    {AREA_LABELS[area]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-footnote text-label-tertiary">
                    {performance.correct}/{performance.total}
                  </span>
                  <span
                    className={`text-callout font-semibold ${
                      percentage >= 70
                        ? 'text-emerald-400'
                        : percentage >= 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-surface-2/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${AREA_COLORS[area]?.solid ?? ''}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ ...spring.gentle, delay: 0.1 }}
                />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Performance Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-5 pt-4 border-t border-separator/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-caption text-label-tertiary">Bom (70%+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-caption text-label-tertiary">Regular (50–69%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-caption text-label-tertiary">Fraco (&lt;50%)</span>
        </div>
      </div>

      {/* Weak Areas Callout */}
      {sortedAreas.length > 0 && areaBreakdown[sortedAreas[0]].percentage < 50 && (
        <div className="mt-4 darwin-panel border-l-4 border-l-red-500/60 border border-separator/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-callout font-medium text-red-300">
                Área que precisa de atenção: {AREA_LABELS[sortedAreas[0]]}
              </p>
              <p className="text-footnote text-red-400/80 mt-1">
                Recomendamos revisar esta área usando flashcards e trilhas de estudo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
