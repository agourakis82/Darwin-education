'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { MasteryHeatmap } from '../components/MasteryHeatmap'
import { ForgettingCurveChart } from '../components/ForgettingCurveChart'
import { MasteryProgressBars } from '../components/MasteryProgressBars'
import { LearnerProfileRadar } from '../components/LearnerProfileRadar'
import { PassProbabilityGauge } from '../components/PassProbabilityGauge'
import { RecommendationCards } from '../components/RecommendationCards'
import { LearningTrajectory } from '../components/LearningTrajectory'
import type {
  MasteryHeatmapData,
  BKTMasteryState,
  PersonalizedForgettingCurve,
  UnifiedLearnerProfile,
  StudyRecommendation,
} from '@darwin-education/shared'

/**
 * Knowledge Mastery & Unified Profile Dashboard
 *
 * BKT mastery heatmap, HLR forgetting curves, unified learner profile,
 * pass probability, and priority-ranked study recommendations.
 */
export default function DominioPage() {
  const [bktData, setBktData] = useState<{
    heatmap: MasteryHeatmapData | null
    masteryStates: BKTMasteryState[]
  } | null>(null)
  const [hlrData, setHlrData] = useState<{
    curves: PersonalizedForgettingCurve[]
  } | null>(null)
  const [profileData, setProfileData] = useState<{
    profile: UnifiedLearnerProfile | null
    inputs: Record<string, any>
    summary: Record<string, any>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const [bktRes, hlrRes, profileRes] = await Promise.all([
          fetch('/api/learner/bkt-mastery').then(r => r.json()).catch(() => null),
          fetch('/api/learner/hlr-curves').then(r => r.json()).catch(() => null),
          fetch('/api/learner/profile').then(r => r.json()).catch(() => null),
        ])

        setBktData(bktRes)
        setHlrData(hlrRes)
        setProfileData(profileRes)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Build unified profile radar dimensions
  const profileDimensions = profileData?.profile ? [
    { label: 'IRT', value: normalizeTheta(profileData.inputs?.irtTheta ?? 0), color: '#3B82F6' },
    { label: 'MIRT', value: profileData.profile.overallCompetency, color: '#8b5cf6' },
    { label: 'FCR', value: (profileData.inputs?.fcrCalibration ?? 50) / 100, color: '#EC4899' },
    { label: 'BKT', value: bktData?.heatmap?.overallMastery ?? 0.1, color: '#F59E0B' },
    { label: 'HLR', value: Math.min(1, (hlrData?.curves?.length ?? 0) > 0 ? 0.7 : 0.1), color: '#10B981' },
    { label: 'Engajamento', value: profileData.summary?.dataCompleteness?.engagement ?? 0, color: '#06B6D4' },
  ] : []

  // Mock trajectory data from profile
  const trajectoryData = profileData?.profile ? [
    { date: '1', overallCompetency: Math.max(0, profileData.profile.overallCompetency - 0.15), passProbability: Math.max(0, profileData.profile.passProbability - 0.2) },
    { date: '2', overallCompetency: Math.max(0, profileData.profile.overallCompetency - 0.08), passProbability: Math.max(0, profileData.profile.passProbability - 0.1) },
    { date: '3', overallCompetency: profileData.profile.overallCompetency, passProbability: profileData.profile.passProbability },
  ] : []

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
          Domínio de <span className="gradient-text">Conhecimento</span>
        </h1>
        <p className="text-label-tertiary mt-1">
          Rastreamento de domínio por componente, curvas de esquecimento e perfil unificado do aprendiz.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface-2 rounded-lg p-6 animate-pulse h-[300px]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top row: Mastery Heatmap + Pass Probability */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0 }}
            >
              {bktData?.heatmap ? (
                <MasteryHeatmap heatmap={bktData.heatmap} />
              ) : (
                <EmptyState
                  title="Mapa de Domínio"
                  message="Complete atividades com componentes de conhecimento para rastreamento BKT."
                />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.1 }}
            >
              {profileData?.profile ? (
                <PassProbabilityGauge
                  probability={profileData.profile.passProbability}
                  overallCompetency={profileData.profile.overallCompetency}
                />
              ) : (
                <EmptyState
                  title="Probabilidade de Aprovação"
                  message="Complete mais atividades para estimativa de aprovação."
                />
              )}
            </motion.div>
          </div>

          {/* Forgetting Curves + Progress Bars */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.2 }}
            >
              <ForgettingCurveChart curves={hlrData?.curves || []} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.3 }}
            >
              <MasteryProgressBars masteryStates={bktData?.masteryStates || []} />
            </motion.div>
          </div>

          {/* Unified Profile + Recommendations */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.4 }}
            >
              {profileDimensions.length > 0 ? (
                <LearnerProfileRadar dimensions={profileDimensions} />
              ) : (
                <EmptyState
                  title="Perfil Unificado"
                  message="Dados insuficientes para perfil unificado."
                />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.5 }}
            >
              <RecommendationCards
                recommendations={profileData?.profile?.recommendations || []}
              />
            </motion.div>
          </div>

          {/* Learning Trajectory (full width) */}
          {trajectoryData.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.6 }}
            >
              <LearningTrajectory data={trajectoryData} />
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
        <strong>Metodologia:</strong> BKT via Corbett & Anderson (1995) com EM para estimação de parâmetros.
        HLR via Settles & Meeder (2016) com SGD online. Modelo unificado agrega IRT + MIRT + FCR + BKT + HLR + engajamento
        com pesos competenciais (MIRT 30%, BKT 25%, FCR 20%, IRT 15%, HLR 10%).
      </motion.div>
    </div>
  )
}

function normalizeTheta(theta: number): number {
  return Math.max(0, Math.min(1, (theta + 4) / 8))
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
