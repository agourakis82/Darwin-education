'use client'

/**
 * FCRLacunaInsights — Shows FCR-detected lacunas for cross-system integration.
 *
 * Used on the DDL page and FCR calibration dashboard to show how FCR
 * confidence-calibration patterns map to DDL lacuna types:
 *
 *   illusion_of_knowing (high conf + wrong) → LEm
 *   errors at dados/conduta levels → LE
 *   errors at padrao/hipotese levels → LIE
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import {
  Brain,
  BookOpen,
  MessageCircle,
  Link2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'

interface FCRLacunaData {
  lacunaProfile: { LE: number; LEm: number; LIE: number }
  riskAreas: Array<{
    area: string
    totalLacunas: number
    LE: number
    LEm: number
    LIE: number
    dominantType: string
  }>
  totalAttempts: number
  totalLacunas: number
}

const LACUNA_CONFIG: Record<string, {
  label: string
  color: string
  bgColor: string
  icon: typeof BookOpen
  description: string
}> = {
  LE: {
    label: 'Epistemica',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: BookOpen,
    description: 'Ausencia de conhecimento nos niveis de dados ou conduta',
  },
  LEm: {
    label: 'Emocional',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    icon: MessageCircle,
    description: 'Ilusao de saber — alta confianca + resposta incorreta',
  },
  LIE: {
    label: 'Integracao',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    icon: Link2,
    description: 'Dificuldade em conectar padrao clinico com hipotese diagnostica',
  },
}

export function FCRLacunaInsights() {
  const [data, setData] = useState<FCRLacunaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/fcr/lacunas')
        if (res.ok) {
          const result = await res.json()
          setData(result)
        }
      } catch {
        // Silently fail — this is a supplementary widget
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !data || data.totalAttempts === 0) return null

  const { lacunaProfile, riskAreas, totalLacunas } = data
  const totalDetected = lacunaProfile.LE + lacunaProfile.LEm + lacunaProfile.LIE
  if (totalDetected === 0) return null

  // Find dominant lacuna type
  const dominant = lacunaProfile.LEm >= lacunaProfile.LE && lacunaProfile.LEm >= lacunaProfile.LIE
    ? 'LEm'
    : lacunaProfile.LE >= lacunaProfile.LIE
      ? 'LE'
      : 'LIE'

  const dominantConfig = LACUNA_CONFIG[dominant]
  const DominantIcon = dominantConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
    >
      <Card className="border-violet-500/20">
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">
              Lacunas Detectadas via Raciocinio Clinico Fractal
            </h3>
          </div>

          {/* Lacuna distribution bars */}
          <div className="space-y-2 mb-4">
            {Object.entries(lacunaProfile).map(([type, count]) => {
              if (count === 0) return null
              const config = LACUNA_CONFIG[type]
              const Icon = config.icon
              const pct = totalDetected > 0 ? (count / totalDetected) * 100 : 0

              return (
                <div key={type} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {type} — {config.label}
                      </span>
                      <span className={`text-xs font-medium ${config.color}`}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${config.bgColor.replace('/10', '/40')}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dominant pattern alert */}
          <div className={`rounded-lg ${dominantConfig.bgColor} p-3 mb-4`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 ${dominantConfig.color} mt-0.5 flex-shrink-0`} />
              <div>
                <div className={`text-xs font-medium ${dominantConfig.color} mb-0.5`}>
                  Padrao dominante: {dominant} ({dominantConfig.label})
                </div>
                <p className="text-xs text-muted-foreground">
                  {dominantConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Risk areas */}
          {riskAreas.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Areas de Risco
              </div>
              <div className="flex flex-wrap gap-2">
                {riskAreas.slice(0, 5).map((ra) => {
                  const colors = AREA_COLORS[ra.area] || AREA_COLORS.clinica_medica
                  return (
                    <span
                      key={ra.area}
                      className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}
                    >
                      {AREA_LABELS[ra.area] || ra.area} ({ra.totalLacunas})
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Baseado em {data.totalAttempts} casos FCR</span>
            </div>
            <Link
              href="/fcr/calibracao"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Ver analise completa
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
