'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { RadarChart } from '../components/RadarChart'
import { SpeedAccuracyPlot } from '../components/SpeedAccuracyPlot'
import { DIFBarChart } from '../components/DIFBarChart'
import { ThetaEvolutionChart } from '../components/ThetaEvolutionChart'
import { SpeedDistributionHistogram } from '../components/SpeedDistributionHistogram'
import type {
  MIRTAbilityProfile,
  SpeedAccuracyProfile,
  DIFAnalysis,
} from '@darwin-education/shared'

interface MIRTResponse {
  profile: MIRTAbilityProfile | null
  summary: Record<string, any>
}

interface RTIRTResponse {
  profile: SpeedAccuracyProfile | null
  summary: Record<string, any>
}

interface DIFResponse {
  analysis: DIFAnalysis | null
  summary: Record<string, any>
}

/**
 * Psicometria Research Dashboard
 *
 * MIRT 5D profile, RT-IRT speed-accuracy, DIF analysis, theta evolution.
 * All data fetched from API routes that run research-grade algorithms.
 */
export default function PsicometriaPage() {
  const [mirt, setMirt] = useState<MIRTResponse | null>(null)
  const [rtirt, setRtirt] = useState<RTIRTResponse | null>(null)
  const [dif, setDif] = useState<DIFResponse | null>(null)
  const [thetaHistory, setThetaHistory] = useState<{ index: number; theta: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const [mirtRes, rtirtRes, difRes] = await Promise.all([
          fetch('/api/psychometrics/mirt-profile').then(r => r.json()).catch(() => null),
          fetch('/api/psychometrics/rt-irt').then(r => r.json()).catch(() => null),
          fetch('/api/psychometrics/dif').then(r => r.json()).catch(() => null),
        ])

        setMirt(mirtRes)
        setRtirt(rtirtRes)
        setDif(difRes)

        // Build theta history from MIRT dimension profiles
        if (mirtRes?.profile?.dimensionProfiles) {
          const history = mirtRes.profile.dimensionProfiles.map((d: any, i: number) => ({
            index: i,
            theta: d.theta,
          }))
          setThetaHistory(history)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <h1 className="text-3xl font-bold text-label-primary">
          Psicometria <span className="gradient-text">Avancada</span>
        </h1>
        <p className="text-label-tertiary mt-1">
          Analise multidimensional de habilidades, velocidade-precisao e equidade de itens.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-2 rounded-lg p-6 animate-pulse h-[300px]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* MIRT 5D Profile */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0 }}
          >
            {mirt?.profile ? (
              <RadarChart profile={mirt.profile} />
            ) : (
              <EmptyState
                title="Perfil MIRT 5D"
                message={mirt?.summary?.message || 'Dados insuficientes para perfil multidimensional.'}
              />
            )}
          </motion.div>

          {/* Speed-Accuracy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.1 }}
          >
            {rtirt?.profile ? (
              <SpeedAccuracyPlot profile={rtirt.profile} />
            ) : (
              <EmptyState
                title="Velocidade x Precisao"
                message={rtirt?.summary?.message || 'Dados insuficientes para analise RT-IRT.'}
              />
            )}
          </motion.div>

          {/* DIF Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.2 }}
          >
            {dif?.analysis ? (
              <DIFBarChart analysis={dif.analysis} />
            ) : (
              <EmptyState
                title="Analise DIF"
                message={dif?.summary?.message || 'Dados insuficientes para analise de funcionamento diferencial.'}
              />
            )}
          </motion.div>

          {/* Speed Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.3 }}
          >
            {rtirt?.profile ? (
              <SpeedDistributionHistogram profile={rtirt.profile} />
            ) : (
              <EmptyState
                title="Distribuicao de Velocidade"
                message="Complete mais questoes para distribuicao de tempo."
              />
            )}
          </motion.div>

          {/* Theta Evolution (full width) */}
          {thetaHistory.length >= 2 && (
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.4 }}
            >
              <ThetaEvolutionChart data={thetaHistory} />
            </motion.div>
          )}
        </div>
      )}

      {/* Methodology note */}
      <motion.div
        className="mt-8 bg-surface-2/50 rounded-lg p-4 text-[11px] text-label-quaternary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <strong>Metodologia:</strong> MIRT 5D com estimacao MAP via Newton-Raphson (Reckase, 2009).
        RT-IRT via framework hierarquico de van der Linden (2006) com EAP bidimensional.
        DIF via Mantel-Haenszel com classificacao ETS A/B/C (Holland & Thayer, 1988).
      </motion.div>
    </div>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        {title}
      </h4>
      <div className="bg-surface-2 rounded-lg p-6 text-center">
        <p className="text-label-quaternary text-sm">{message}</p>
      </div>
    </div>
  )
}
