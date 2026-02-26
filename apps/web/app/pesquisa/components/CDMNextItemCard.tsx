'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { CDM_ATTRIBUTE_LABELS_PT } from '@darwin-education/shared'
import type { CognitiveAttribute } from '@darwin-education/shared'

interface CDMNextItemCardProps {
  administeredIds?: string[]
}

interface NextItemResponse {
  nextItem: {
    itemId: string
    expectedEntropyReduction: number
    targetAttributes: CognitiveAttribute[]
  } | null
  currentEntropy?: number
  candidatesConsidered?: number
}

/**
 * CDM-CAT Next Item Card
 *
 * Fetches and displays the next adaptive question recommended by
 * the Shannon-entropy CDM-CAT algorithm. Shows which cognitive
 * attributes the item targets and the expected entropy reduction.
 */
export function CDMNextItemCard({ administeredIds = [] }: CDMNextItemCardProps) {
  const [data, setData] = useState<NextItemResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const excludeParam = administeredIds.length > 0
      ? `?excludeIds=${administeredIds.join(',')}`
      : ''

    fetch(`/api/cdm/next-item${excludeParam}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [administeredIds.join(',')])

  if (loading) {
    return (
      <div className="bg-surface-2 rounded-xl p-4 animate-pulse h-28" />
    )
  }

  if (!data?.nextItem) {
    return (
      <div className="bg-surface-2 rounded-xl p-4 text-xs text-label-quaternary text-center">
        Questão CDM-CAT indisponível — complete mais questões primeiro.
      </div>
    )
  }

  const { nextItem, currentEntropy } = data
  const maxEntropy = Math.log2(64)
  const reductionPct = ((nextItem.expectedEntropyReduction / maxEntropy) * 100).toFixed(1)

  return (
    <motion.div
      className="bg-surface-2 rounded-xl p-4 border border-blue-500/20 space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-label-primary">Próxima questão CDM-CAT</p>
            <p className="text-[9px] text-label-quaternary">
              Seleção por redução de entropia de Shannon
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-blue-400 font-bold">−{reductionPct}% H</p>
          <p className="text-[8px] text-label-quaternary">redução esperada</p>
        </div>
      </div>

      {/* Target attributes */}
      {nextItem.targetAttributes.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] text-label-quaternary uppercase tracking-wider font-semibold">
            Atributos-alvo
          </p>
          <div className="flex flex-wrap gap-1">
            {nextItem.targetAttributes.map(attr => (
              <span
                key={attr}
                className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
              >
                {CDM_ATTRIBUTE_LABELS_PT[attr]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Entropy gauge */}
      {currentEntropy !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-label-quaternary">
            <span>Entropia atual</span>
            <span className="font-mono">{currentEntropy.toFixed(2)} / 6.00 bits</span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentEntropy / maxEntropy) * 100}%` }}
              transition={spring.snappy}
            />
          </div>
        </div>
      )}

      <Link
        href={`/simulado/adaptive?questionId=${nextItem.itemId}&cdm=1`}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-xs text-blue-300 font-medium group"
      >
        <span>Responder esta questão</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </motion.div>
  )
}
