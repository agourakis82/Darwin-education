'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { FCRLevelResult, CalibrationQuadrant } from '@darwin-education/shared'
import { CALIBRATION_QUADRANT_LABELS_PT } from '@darwin-education/shared'

interface CalibrationMatrixProps {
  levelResults: FCRLevelResult[]
}

const QUADRANT_CONFIG: Record<
  CalibrationQuadrant,
  { color: string; bgColor: string; borderColor: string; description: string }
> = {
  mastery: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-700/50',
    description: 'Acertou com confiança',
  },
  illusion_of_knowing: {
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-700/50',
    description: 'Errou com confiança alta',
  },
  unconscious_competence: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
    description: 'Acertou sem confiança',
  },
  known_unknown: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-700/50',
    description: 'Errou sabendo que não sabia',
  },
}

const QUADRANT_ORDER: CalibrationQuadrant[] = [
  'mastery',
  'illusion_of_knowing',
  'unconscious_competence',
  'known_unknown',
]

export function CalibrationMatrix({ levelResults }: CalibrationMatrixProps) {
  // Group level results by quadrant
  const quadrantLevels: Record<CalibrationQuadrant, FCRLevelResult[]> = {
    mastery: [],
    illusion_of_knowing: [],
    unconscious_competence: [],
    known_unknown: [],
  }

  for (const result of levelResults) {
    quadrantLevels[result.quadrant].push(result)
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Matriz Metacognitiva
      </h4>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Header labels */}
        <div className="col-span-2 grid grid-cols-[auto_1fr_1fr] gap-2 text-xs text-muted-foreground text-center mb-1">
          <div className="w-20" />
          <div>Acertou</div>
          <div>Errou</div>
        </div>

        {/* Row 1: High Confidence */}
        <div className="col-span-2 grid grid-cols-[auto_1fr_1fr] gap-2 items-stretch">
          <div className="w-20 flex items-center text-xs text-muted-foreground text-right pr-2">
            Alta conf.
          </div>
          {/* Mastery (correct + high conf) */}
          <QuadrantCell
            quadrant="mastery"
            results={quadrantLevels.mastery}
            index={0}
          />
          {/* Illusion of Knowing (wrong + high conf) */}
          <QuadrantCell
            quadrant="illusion_of_knowing"
            results={quadrantLevels.illusion_of_knowing}
            index={1}
          />
        </div>

        {/* Row 2: Low Confidence */}
        <div className="col-span-2 grid grid-cols-[auto_1fr_1fr] gap-2 items-stretch">
          <div className="w-20 flex items-center text-xs text-muted-foreground text-right pr-2">
            Baixa conf.
          </div>
          {/* Unconscious Competence (correct + low conf) */}
          <QuadrantCell
            quadrant="unconscious_competence"
            results={quadrantLevels.unconscious_competence}
            index={2}
          />
          {/* Known Unknown (wrong + low conf) */}
          <QuadrantCell
            quadrant="known_unknown"
            results={quadrantLevels.known_unknown}
            index={3}
          />
        </div>
      </div>
    </div>
  )
}

function QuadrantCell({
  quadrant,
  results,
  index,
}: {
  quadrant: CalibrationQuadrant
  results: FCRLevelResult[]
  index: number
}) {
  const config = QUADRANT_CONFIG[quadrant]
  const hasResults = results.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...spring.gentle, delay: 0.3 + index * 0.1 }}
      className={`
        rounded-lg border p-3 min-h-[80px]
        ${hasResults ? `${config.bgColor} ${config.borderColor}` : 'bg-surface-2/30 border-border/50'}
      `}
    >
      <div className={`text-xs font-medium mb-1 ${hasResults ? config.color : 'text-muted-foreground/50'}`}>
        {CALIBRATION_QUADRANT_LABELS_PT[quadrant]}
      </div>
      {hasResults ? (
        <div className="space-y-0.5">
          {results.map((r) => (
            <div key={r.level} className={`text-sm ${config.color}`}>
              {r.label}
              <span className="text-xs opacity-60 ml-1">({r.confidence}/5)</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground/40">{config.description}</div>
      )}
    </motion.div>
  )
}
