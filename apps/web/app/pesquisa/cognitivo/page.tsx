'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Dna, ChevronLeft, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { AttributeMasteryBars } from '../components/AttributeMasteryBars'
import { LatentClassDistribution } from '../components/LatentClassDistribution'
import { CDMNextItemCard } from '../components/CDMNextItemCard'

interface CDMProfileData {
  profile: {
    latent_class: number
    eap_estimate: number[]
    map_estimate: boolean[]
    posterior_probabilities: number[]
    posterior_entropy: number
    classification_confidence: number | null
    mastered_attributes: string[]
    unmastered_attributes: string[]
    snapshot_at: string
    attributeBreakdown: Array<{
      id: string
      labelPt: string
      eap: number
      mastered: boolean
    }>
  } | null
  history: Array<{
    snapshot_at: string
    eap_estimate: number[]
    mastered_attributes: string[]
    posterior_entropy: number
  }>
  summary: {
    masteredCount: number
    unmasteredCount: number
    posteriorEntropy: number
    classificationConfidence: number | null
    snapshotAt: string
  } | null
  warning?: string
}

/**
 * CDM — Cognitive Diagnostic Model Dashboard
 *
 * DINA/G-DINA (de la Torre, 2011) with EM-MMLE estimation.
 * K=6 clinically grounded cognitive attributes, 64 latent classes.
 * Shows attribute mastery EAP posteriors and MAP classification.
 */
export default function CognitivoDiagnosticoPage() {
  const [data, setData] = useState<CDMProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [classifying, setClassifying] = useState(false)
  const [classifyMsg, setClassifyMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cdm/profile/me')
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleClassify() {
    setClassifying(true)
    setClassifyMsg(null)
    try {
      const res = await fetch('/api/cdm/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelType: 'dina' }),
      })
      const result = await res.json()
      if (res.status === 422) {
        setClassifyMsg(result.summary?.message ?? 'Dados insuficientes para classificação.')
        return
      }
      if (!res.ok) {
        setClassifyMsg(result.error ?? 'Erro na classificação.')
        return
      }
      // Reload profile after classification
      const profileRes = await fetch('/api/cdm/profile/me').then(r => r.json())
      setData(profileRes)
      setClassifyMsg('Classificação concluída com sucesso.')
    } catch (e) {
      setClassifyMsg(e instanceof Error ? e.message : 'Erro desconhecido.')
    } finally {
      setClassifying(false)
    }
  }

  const profile = data?.profile
  const summary = data?.summary

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <Link
          href="/pesquisa"
          className="inline-flex items-center gap-1 text-xs text-label-quaternary hover:text-label-secondary mb-4 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Pesquisa Psicométrica
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Dna className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-label-primary">
                Diagnóstico Cognitivo{' '}
                <span className="text-blue-400">CDM</span>
              </h1>
              <p className="text-xs text-label-quaternary mt-0.5">
                DINA / G-DINA · de la Torre (2011) · K=6 atributos · 64 classes latentes
              </p>
            </div>
          </div>

          <button
            onClick={handleClassify}
            disabled={classifying || loading}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {classifying ? 'Classificando…' : 'Classificar agora'}
          </button>
        </div>

        {classifyMsg && (
          <motion.p
            className="mt-3 text-xs text-label-secondary bg-surface-2 rounded-lg px-3 py-2 border border-separator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={spring.gentle}
          >
            {classifyMsg}
          </motion.p>
        )}
      </motion.div>

      {/* Warning / missing tables */}
      {data?.warning && (
        <motion.div
          className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={spring.gentle}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{data.warning}</span>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* No data state */}
      {!loading && !profile && !error && (
        <motion.div
          className="text-center py-12 space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-label-secondary">Classificação CDM não disponível</p>
          <p className="text-xs text-label-quaternary max-w-xs mx-auto">
            Complete pelo menos 20 questões nos simulados para gerar seu perfil de atributos cognitivos.
          </p>
          <button
            onClick={handleClassify}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/20 transition-colors"
          >
            Tentar classificar
          </button>
        </motion.div>
      )}

      {/* Main content */}
      {!loading && profile && (
        <div className="space-y-6">
          {/* Stats row */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            {[
              {
                label: 'Atributos dominados',
                value: `${summary?.masteredCount ?? 0} / 6`,
                color: 'text-emerald-400',
              },
              {
                label: 'Entropia posterior',
                value: `${(summary?.posteriorEntropy ?? 0).toFixed(2)} bits`,
                color: 'text-blue-400',
              },
              {
                label: 'Confiança classificação',
                value: summary?.classificationConfidence != null
                  ? `${(summary.classificationConfidence * 100).toFixed(0)}%`
                  : '—',
                color: 'text-purple-400',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-2 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
                <p className="text-[10px] text-label-quaternary mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Attribute mastery bars */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.05 }}
          >
            <AttributeMasteryBars
              eapEstimate={profile.eap_estimate}
              mapEstimate={profile.map_estimate}
              posteriorEntropy={profile.posterior_entropy}
              classificationConfidence={profile.classification_confidence}
            />
          </motion.div>

          {/* Two-column: latent class distribution + CDM-CAT next item */}
          <motion.div
            className="grid md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.10 }}
          >
            <LatentClassDistribution
              posteriorProbabilities={profile.posterior_probabilities}
              latentClass={profile.latent_class}
            />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
                CDM-CAT — Próxima Questão
              </h4>
              <CDMNextItemCard />

              {/* Methodology note */}
              <div className="bg-surface-2 rounded-xl p-3 space-y-1 text-[9px] text-label-quaternary">
                <p className="font-semibold text-[10px] text-label-tertiary">Metodologia</p>
                <p>
                  <span className="font-bold">DINA</span>: Deterministic Input, Noisy-And gate.
                  η_{'{'}ij{'}'} = ∏ α_{'{'}ik{'}'}^q_{'{'}jk{'}'} — 1 iff todos os atributos requeridos dominados.
                </p>
                <p>
                  <span className="font-bold">EM-MMLE</span>: E-step calcula P(α_c|X_i) via log-sum-exp;
                  M-step atualiza slip/guess e priors de classe.
                </p>
                <p>
                  <span className="font-bold">CAT</span>: Seleciona item que maximiza redução de entropia
                  de Shannon ΔH = H(anterior) − E[H(posterior)].
                </p>
              </div>
            </div>
          </motion.div>

          {/* Scientific footer */}
          <motion.div
            className="text-[9px] text-label-quaternary text-center space-y-0.5 pt-2 border-t border-separator/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring.gentle, delay: 0.2 }}
          >
            <p>
              de la Torre, J. (2011). The Generalized DINA Model Framework.{' '}
              <em>Psychometrika, 76</em>, 179–199.
            </p>
            <p>
              Junker, B. W. & Sijtsma, K. (2001). Cognitive assessment models with few assumptions.{' '}
              <em>Applied Psychological Measurement, 25(3)</em>, 258–282.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
