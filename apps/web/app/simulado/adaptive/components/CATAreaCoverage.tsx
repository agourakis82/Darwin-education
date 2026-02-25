'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'

interface CATAreaCoverageProps {
  areaCoverage: Record<string, number> // area -> count
  totalItems: number
  areaTargets?: Record<string, number> // area -> target proportion (default 0.2 each)
}

const AREAS = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
] as const

const SHORT_LABELS: Record<string, string> = {
  clinica_medica: 'Cln. Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Col.',
}

export function CATAreaCoverage({
  areaCoverage,
  totalItems,
  areaTargets,
}: CATAreaCoverageProps) {
  return (
    <div className="bg-surface-1 border border-separator rounded-xl p-4 flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-label-tertiary">
        Cobertura por Área
      </span>
      {AREAS.map((area) => {
        const count = areaCoverage[area] ?? 0
        const barPercent = totalItems > 0 ? (count / totalItems) * 100 : 0
        const target = areaTargets?.[area] ?? 0.2
        const targetPercent = target * 100
        const colors = AREA_COLORS[area]

        return (
          <div key={area} className="flex items-center gap-3">
            {/* Area label — fixed width for alignment */}
            <span
              className="text-xs font-medium text-label-secondary w-[5.5rem] truncate"
              title={AREA_LABELS[area]}
            >
              {SHORT_LABELS[area]}
            </span>

            {/* Item count */}
            <span className="text-xs tabular-nums text-label-tertiary w-[3.5rem] text-right">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden relative">
              {/* Target marker */}
              {targetPercent > 0 && targetPercent < 100 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                  style={{ left: `${targetPercent}%` }}
                  title={`Meta: ${Math.round(targetPercent)}%`}
                />
              )}

              {/* Filled bar */}
              <motion.div
                className={`h-full rounded-full ${colors?.solid ?? 'bg-emerald-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, barPercent)}%` }}
                transition={spring.snappy}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
