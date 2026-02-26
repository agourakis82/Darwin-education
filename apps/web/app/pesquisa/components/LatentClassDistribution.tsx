'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { CDM_ATTRIBUTE_LABELS_PT, CDM_ATTRIBUTES } from '@darwin-education/shared'

interface LatentClassDistributionProps {
  posteriorProbabilities: number[]
  latentClass: number
}

/**
 * Latent Class Distribution
 *
 * Shows the top-N most probable latent classes from the CDM posterior.
 * Each class is decoded to its binary attribute vector (which of the
 * K=6 cognitive attributes are mastered in that class).
 */
export function LatentClassDistribution({
  posteriorProbabilities,
  latentClass,
}: LatentClassDistributionProps) {
  // Get top 8 classes
  const ranked = posteriorProbabilities
    .map((prob, c) => ({ c, prob }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 8)

  const maxProb = ranked[0]?.prob ?? 1

  function decodeClass(c: number): boolean[] {
    return CDM_ATTRIBUTES.map((_, k) => !!((c >> k) & 1))
  }

  // Short attribute abbreviations
  const SHORT_LABELS = ['DG', 'DR', 'CJ', 'TD', 'PM', 'EM']

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Distribuição Posterior — Classes Latentes (top 8 / 64)
      </h4>

      <div className="bg-surface-2 rounded-xl p-4 space-y-2">
        {/* Attribute header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-16 shrink-0" />
          <div className="flex gap-1 flex-1">
            {SHORT_LABELS.map((label, k) => (
              <div
                key={k}
                className="flex-1 text-center text-[9px] font-bold text-label-quaternary uppercase"
                title={CDM_ATTRIBUTE_LABELS_PT[CDM_ATTRIBUTES[k]]}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="w-14 shrink-0" />
        </div>

        {ranked.map(({ c, prob }) => {
          const alpha = decodeClass(c)
          const isMap = c === latentClass
          const pct = (prob * 100).toFixed(1)
          const barWidth = `${(prob / maxProb) * 100}%`

          return (
            <motion.div
              key={c}
              className={`flex items-center gap-2 rounded-lg p-1.5 ${isMap ? 'bg-blue-500/10 border border-blue-500/20' : ''}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={spring.gentle}
            >
              {/* Class index + bar */}
              <div className="w-16 shrink-0">
                <div className="flex items-center gap-1">
                  {isMap && (
                    <span className="text-[8px] text-blue-400 font-bold uppercase">MAP</span>
                  )}
                  <span className="text-[9px] text-label-quaternary font-mono">c={c}</span>
                </div>
                <div className="h-1 bg-surface-3 rounded-full overflow-hidden mt-0.5">
                  <motion.div
                    className={`h-full rounded-full ${isMap ? 'bg-blue-400' : 'bg-label-quaternary/40'}`}
                    initial={{ width: 0 }}
                    animate={{ width: barWidth }}
                    transition={spring.gentle}
                  />
                </div>
              </div>

              {/* Binary attribute vector */}
              <div className="flex gap-1 flex-1">
                {alpha.map((mastered, k) => (
                  <div
                    key={k}
                    className="flex-1 flex items-center justify-center"
                    title={`${CDM_ATTRIBUTE_LABELS_PT[CDM_ATTRIBUTES[k]]}: ${mastered ? '✓' : '✗'}`}
                  >
                    <div
                      className="w-4 h-4 rounded-sm text-[8px] flex items-center justify-center font-bold"
                      style={{
                        backgroundColor: mastered ? '#10B98133' : '#37415133',
                        color: mastered ? '#10B981' : '#6B7280',
                      }}
                    >
                      {mastered ? '1' : '0'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Probability */}
              <div className="w-14 shrink-0 text-right">
                <span className={`text-xs font-mono ${isMap ? 'text-blue-400 font-bold' : 'text-label-quaternary'}`}>
                  {pct}%
                </span>
              </div>
            </motion.div>
          )
        })}

        {/* Legend */}
        <div className="pt-2 border-t border-separator/50 text-[9px] text-label-quaternary">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {CDM_ATTRIBUTES.map((attr, k) => (
              <span key={attr}>
                <span className="font-bold">{SHORT_LABELS[k]}</span>
                {' = '}
                {CDM_ATTRIBUTE_LABELS_PT[attr]}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[8px]">
            1 = domínio MAP estimado · 0 = não dominado · MAP = classe de maior probabilidade posterior
          </p>
        </div>
      </div>
    </div>
  )
}
