'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Brain, Filter, Clock, Target, TrendingUp, Gauge, Sparkles, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FCRCaseRow {
  id: string
  title_pt: string
  area: string
  difficulty: string
  times_attempted: number
  avg_score: number | null
}

interface UserAttemptRow {
  id: string
  case_id: string
  scaled_score: number | null
  calibration_score: number | null
  completed_at: string | null
}

interface AdaptiveRecommendation {
  recommendation: {
    caseId: string
    selectionReason: string
    expectedInformationGain: number
    targetLevels: string[]
    difficultyMatch: number
    confidence: number
  } | null
  currentTheta: number
  totalAttempts: number
}

const SELECTION_REASON_LABELS: Record<string, string> = {
  max_information: 'Maximo ganho de informacao',
  calibration_probe: 'Testar calibracao de confianca',
  cascade_probe: 'Testar cadeia de raciocinio',
  area_coverage: 'Cobrir area pouco praticada',
  dunning_kruger_probe: 'Testar zona Dunning-Kruger',
  difficulty_ladder: 'Proximo nivel de dificuldade',
}

const AREAS: ENAMEDArea[] = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
]

const DIFFICULTY_LABELS: Record<string, string> = {
  muito_facil: 'Muito Facil',
  facil: 'Facil',
  medio: 'Medio',
  dificil: 'Dificil',
  muito_dificil: 'Muito Dificil',
}

export default function FCRHubPage() {
  const router = useRouter()
  const [cases, setCases] = useState<FCRCaseRow[]>([])
  const [userAttempts, setUserAttempts] = useState<UserAttemptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState<ENAMEDArea | null>(null)
  const [adaptive, setAdaptive] = useState<AdaptiveRecommendation | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/fcr')
        return
      }

      const params = new URLSearchParams()
      if (selectedArea) params.set('area', selectedArea)

      const [casesRes, adaptiveRes] = await Promise.all([
        fetch(`/api/fcr/cases?${params.toString()}`),
        fetch('/api/fcr/next-case').catch(() => null),
      ])

      if (casesRes.ok) {
        const data = await casesRes.json()
        setCases(data.cases || [])
        setUserAttempts(data.userAttempts || [])
      }

      if (adaptiveRes?.ok) {
        const data = await adaptiveRes.json()
        setAdaptive(data)
      }

      setLoading(false)
    }

    load()
  }, [router, selectedArea])

  const getAttemptForCase = (caseId: string) =>
    userAttempts.find((a) => a.case_id === caseId)

  const handleStartCase = async (caseId: string) => {
    const response = await fetch('/api/fcr/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    })

    if (response.ok) {
      router.push(`/fcr/${caseId}`)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Raciocinio Clinico Fractal</h1>
        </div>
        <p className="text-label-secondary mb-8">
          Avalie seu raciocinio clinico em 4 niveis de abstracao com calibracao de confianca.
        </p>

        {/* How it works */}
        <Card className="mb-8">
          <CardContent className="py-5">
            <h3 className="font-semibold text-white mb-3">Como Funciona</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: 1, label: 'Dados', desc: 'Identifique achados-chave', weight: '15%' },
                { num: 2, label: 'Padrao', desc: 'Reconheca a sindrome', weight: '25%' },
                { num: 3, label: 'Hipotese', desc: 'Diagnostico diferencial', weight: '35%' },
                { num: 4, label: 'Conduta', desc: 'Manejo adequado', weight: '25%' },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center mx-auto mb-2">
                    {step.num}
                  </div>
                  <div className="text-sm font-medium text-white">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                  <div className="text-xs text-violet-400 mt-1">Peso: {step.weight}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Em cada nivel, voce tambem avalia sua confianca (1-5). O cruzamento confianca x acerto gera uma
              <strong className="text-violet-400"> matriz metacognitiva 2x2</strong> que identifica ilusoes de saber.
            </p>
          </CardContent>
        </Card>

        {/* SOTA: Adaptive Recommendation + Calibration Dashboard */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Adaptive Next Case */}
          {adaptive?.recommendation ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.gentle}
              className="bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-lg p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white text-sm">Caso Recomendado pelo Algoritmo</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {SELECTION_REASON_LABELS[adaptive.recommendation.selectionReason] || 'Selecionado adaptativamente'}
                {' — '}ganho esperado: {(adaptive.recommendation.expectedInformationGain * 100).toFixed(0)}%
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStartCase(adaptive.recommendation!.caseId)}
                className="w-full"
              >
                <Brain className="w-4 h-4 mr-2" />
                Iniciar Caso Adaptativo
              </Button>
            </motion.div>
          ) : adaptive && adaptive.totalAttempts > 0 ? (
            <div className="bg-surface-2 border border-border rounded-lg p-5 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-6 h-6 text-violet-400/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Complete mais casos para ativar recomendacoes adaptativas.
                </p>
              </div>
            </div>
          ) : null}

          {/* Calibration Dashboard Link */}
          {adaptive && adaptive.totalAttempts >= 2 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.1 }}
            >
              <Link
                href="/fcr/calibracao"
                className="block h-full bg-surface-2 border border-border hover:border-violet-500/30 rounded-lg p-5 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors">
                    Dashboard de Calibracao
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Analise SOTA: ECE, Dunning-Kruger, cascata de erros e tendencias de calibracao.
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-violet-400">{adaptive.totalAttempts} casos</span>
                  <span className="text-emerald-400">θ = {adaptive.currentTheta.toFixed(2)}</span>
                </div>
              </Link>
            </motion.div>
          ) : null}
        </div>

        {/* Area Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setSelectedArea(null)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              !selectedArea
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
            }`}
          >
            Todas
          </button>
          {AREAS.map((area) => {
            const colors = AREA_COLORS[area]
            const isActive = selectedArea === area
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(isActive ? null : area)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  isActive
                    ? `${colors.badge} border`
                    : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                }`}
              >
                {AREA_LABELS[area]}
              </button>
            )
          })}
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-label-secondary">Carregando casos...</p>
          </div>
        ) : cases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-label-secondary mb-2">Nenhum caso disponivel</p>
              <p className="text-sm text-muted-foreground">
                Casos de raciocinio clinico fractal serao adicionados em breve.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cases.map((fcrCase) => {
              const colors = AREA_COLORS[fcrCase.area] || AREA_COLORS.clinica_medica
              const attempt = getAttemptForCase(fcrCase.id)
              const diffLabel = DIFFICULTY_LABELS[fcrCase.difficulty] || fcrCase.difficulty

              return (
                <Card
                  key={fcrCase.id}
                  className="hover:border-violet-500/30 transition-colors cursor-pointer"
                  onClick={() => handleStartCase(fcrCase.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge}`}>
                            {AREA_LABELS[fcrCase.area] || fcrCase.area}
                          </span>
                          <span className="text-xs text-muted-foreground">{diffLabel}</span>
                        </div>
                        <h3 className="font-medium text-white truncate">{fcrCase.title_pt}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {fcrCase.times_attempted} tentativas
                          </span>
                          {fcrCase.avg_score && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Media: {Math.round(fcrCase.avg_score)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        {attempt ? (
                          <div className="text-right">
                            <div className="text-sm font-bold text-violet-400">
                              {attempt.scaled_score}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Cal: {attempt.calibration_score}%
                            </div>
                          </div>
                        ) : (
                          <Button variant="primary" size="sm">
                            Iniciar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
