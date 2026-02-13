'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { MasteryHeatmapData, MasteryClassification, ENAMEDArea } from '@darwin-education/shared'

interface MasteryHeatmapProps {
  heatmap: MasteryHeatmapData
}

const AREA_LABELS: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clinica Medica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saude Coletiva',
}

const MASTERY_COLORS: Record<MasteryClassification, string> = {
  mastered: '#10B981',
  near_mastery: '#3B82F6',
  learning: '#F59E0B',
  not_started: '#374151',
}

/**
 * Area x KC mastery heatmap grid.
 * Each cell = one knowledge component, color = mastery level.
 * Rows = ENAMED areas, columns = KCs within each area.
 */
export function MasteryHeatmap({ heatmap }: MasteryHeatmapProps) {
  const areas = heatmap.areas

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Mapa de Domínio (BKT)
      </h4>

      <div className="bg-surface-2 rounded-lg p-4 space-y-4">
        {areas.map((area) => {
          const kcs = heatmap.kcsByArea[area] || []
          const areaMastery = heatmap.areaMastery[area] || 0

          return (
            <div key={area} className="space-y-1">
              {/* Area header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-label-secondary">
                  {AREA_LABELS[area]}
                </span>
                <span className="text-xs text-label-quaternary font-mono">
                  {Math.round(areaMastery * 100)}%
                </span>
              </div>

              {/* KC cells */}
              {kcs.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {kcs.map((kc, i) => (
                    <motion.div
                      key={kc.kcId}
                      className="relative group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring.gentle, delay: i * 0.02 }}
                    >
                      <div
                        className="w-6 h-6 rounded-sm cursor-default"
                        style={{
                          backgroundColor: MASTERY_COLORS[kc.classification],
                          opacity: 0.3 + kc.mastery * 0.7,
                        }}
                        title={`${kc.kcName}: ${Math.round(kc.mastery * 100)}% (${kc.classification})`}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-surface-4 border border-separator rounded px-2 py-1 text-[9px] text-label-secondary whitespace-nowrap shadow-elevation-2">
                          {kc.kcName}: {Math.round(kc.mastery * 100)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-label-quaternary">
                  Nenhum componente rastreado
                </div>
              )}

              {/* Area progress bar */}
              <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: areaMastery >= 0.95 ? '#10B981' : areaMastery >= 0.8 ? '#3B82F6' : '#F59E0B' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${areaMastery * 100}%` }}
                  transition={{ ...spring.gentle, delay: 0.3 }}
                />
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-separator">
          {[
            { label: 'Dominado', color: MASTERY_COLORS.mastered },
            { label: 'Quase', color: MASTERY_COLORS.near_mastery },
            { label: 'Aprendendo', color: MASTERY_COLORS.learning },
            { label: 'Não iniciado', color: MASTERY_COLORS.not_started },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1 text-[10px] text-label-quaternary">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="text-center">
            <div className="text-label-primary font-mono">{heatmap.masteredCount}</div>
            <div className="text-label-quaternary">Dominados</div>
          </div>
          <div className="text-center">
            <div className="text-label-primary font-mono">{heatmap.totalKCs}</div>
            <div className="text-label-quaternary">Total KCs</div>
          </div>
          <div className="text-center">
            <div className="text-label-primary font-mono">
              {Math.round(heatmap.overallMastery * 100)}%
            </div>
            <div className="text-label-quaternary">Domínio Geral</div>
          </div>
        </div>
      </div>
    </div>
  )
}
