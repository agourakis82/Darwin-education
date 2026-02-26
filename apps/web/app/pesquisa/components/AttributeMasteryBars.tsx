'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import {
  CDM_ATTRIBUTES,
  CDM_ATTRIBUTE_LABELS_PT,
  CDM_ATTRIBUTE_DESCRIPTIONS_PT,
} from '@darwin-education/shared'

interface AttributeMasteryBarsProps {
  eapEstimate: number[]
  mapEstimate: boolean[]
  posteriorEntropy: number
  classificationConfidence?: number | null
}

const FCR_LEVEL_COLORS: Record<string, string> = {
  dados: '#3B82F6',
  padrao: '#8B5CF6',
  hipotese: '#F59E0B',
  conduta: '#10B981',
}

const CDM_ATTRIBUTE_FCR: string[] = [
  'dados', 'padrao', 'hipotese', 'conduta', 'conduta', 'conduta',
]

/**
 * CDM Attribute Mastery Bars
 *
 * Shows EAP marginal posteriors (P(mastered) per attribute) as
 * horizontal progress bars, color-coded by FCR reasoning level.
 * Also shows MAP binary classification (mastered/unmastered) as a badge.
 */
export function AttributeMasteryBars({
  eapEstimate,
  mapEstimate,
  posteriorEntropy,
  classificationConfidence,
}: AttributeMasteryBarsProps) {
  const maxEntropy = Math.log2(64) // 6 bits
  const entropyPct = ((posteriorEntropy / maxEntropy) * 100).toFixed(0)
  const confPct = classificationConfidence != null
    ? (classificationConfidence * 100).toFixed(0)
    : ((1 - posteriorEntropy / maxEntropy) * 100).toFixed(0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
          Domínio de Atributos Cognitivos (CDM)
        </h4>
        <div className="flex items-center gap-3 text-xs text-label-quaternary font-mono">
          <span title="Entropia da distribuição posterior sobre 64 classes">
            H = {posteriorEntropy.toFixed(2)} bits ({entropyPct}% max)
          </span>
          <span className={`font-semibold ${parseFloat(confPct) >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {confPct}% confiança
          </span>
        </div>
      </div>

      <div className="bg-surface-2 rounded-xl p-4 space-y-3">
        {CDM_ATTRIBUTES.map((attr, k) => {
          const eap = eapEstimate[k] ?? 0
          const mastered = mapEstimate[k] ?? false
          const fcrLevel = CDM_ATTRIBUTE_FCR[k]
          const color = FCR_LEVEL_COLORS[fcrLevel] ?? '#6B7280'

          return (
            <div key={attr} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: color + '22', color }}
                  >
                    A{k + 1}
                  </span>
                  <span className="text-xs font-medium text-label-secondary">
                    {CDM_ATTRIBUTE_LABELS_PT[attr]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-label-tertiary">
                    {(eap * 100).toFixed(1)}%
                  </span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: mastered ? '#10B98122' : '#6B728022',
                      color: mastered ? '#10B981' : '#9CA3AF',
                    }}
                  >
                    {mastered ? 'Dominado' : 'Em progresso'}
                  </span>
                </div>
              </div>

              {/* EAP bar */}
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${eap * 100}%` }}
                  transition={{ ...spring.gentle, delay: k * 0.06 }}
                />
              </div>

              {/* Description tooltip row */}
              <p className="text-[9px] text-label-quaternary">
                {CDM_ATTRIBUTE_DESCRIPTIONS_PT[attr]}
              </p>
            </div>
          )
        })}
      </div>

      {/* Latent class interpretation */}
      <p className="text-[10px] text-label-quaternary text-center">
        MAP: classe latente com maior probabilidade posterior ·
        EAP: probabilidade marginal de domínio por atributo · CDM K=6 (de la Torre, 2011)
      </p>
    </div>
  )
}
