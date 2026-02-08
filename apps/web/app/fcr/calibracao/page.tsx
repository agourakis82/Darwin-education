'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import {
  Brain,
  ArrowLeft,
  Activity,
  Target,
  BarChart3,
  Gauge,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import { ReliabilityDiagram } from '../components/ReliabilityDiagram'
import { DunningKrugerDetector } from '../components/DunningKrugerDetector'
import { CascadeFlowChart } from '../components/CascadeFlowChart'
import { CalibrationTrendChart } from '../components/CalibrationTrendChart'
import type {
  FCRCalibrationDiagnostics,
  FCRCascadeAnalysis,
  DunningKrugerZone,
  FCRReasoningProfile,
} from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DiagnosticsData {
  calibration: FCRCalibrationDiagnostics | null
  cascade: FCRCascadeAnalysis | null
  timeline: {
    timeline: any[]
    byArea: Record<string, { area: string; avgCalibration: number; avgOverconfidence: number; attempts: number }>
  }
  summary: {
    totalAttempts: number
    currentTheta?: number
    avgCalibrationScore?: number
    totalIllusionsOfKnowing?: number
    dunningKrugerZone?: DunningKrugerZone
    reasoningProfile?: FCRReasoningProfile
    calibrationTrending?: 'improving' | 'stable' | 'degrading'
    minAttemptsRequired?: number
    message?: string
  }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

export default function CalibracaoPage() {
  const router = useRouter()
  const [data, setData] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/fcr/calibracao')
        return
      }

      try {
        const response = await fetch('/api/fcr/diagnostics')
        if (!response.ok) throw new Error('Failed to load diagnostics')
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Analisando calibracao...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-label-secondary">{error || 'Erro ao carregar diagnosticos'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { calibration, cascade, timeline, summary } = data
  const needsMore = summary.totalAttempts < (summary.minAttemptsRequired || 3)

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/fcr" className="text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Brain className="w-7 h-7 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Calibracao Metacognitiva</h1>
        </div>
        <p className="text-label-secondary mb-8 ml-8">
          Analise SOTA de calibracao de confianca, Dunning-Kruger e cascata de erros.
        </p>

        {needsMore ? (
          /* Not enough data */
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-violet-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Dados Insuficientes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {summary.message || `Complete pelo menos 3 casos FCR para ativar a analise de calibracao.`}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Voce completou <strong className="text-violet-400">{summary.totalAttempts}</strong> de 3 casos necessarios.
              </p>
              <Link
                href="/fcr"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Praticar Casos FCR
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Full diagnostics dashboard */
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Summary Stats Row */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Target className="w-5 h-5 text-violet-400" />}
                label="Casos Completos"
                value={summary.totalAttempts.toString()}
              />
              <StatCard
                icon={<Gauge className="w-5 h-5 text-emerald-400" />}
                label="Calibracao Media"
                value={`${summary.avgCalibrationScore?.toFixed(0) ?? '–'}`}
                suffix="/100"
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5 text-amber-400" />}
                label="ECE"
                value={calibration?.ece?.toFixed(3) ?? '–'}
                tooltip="Expected Calibration Error (menor = melhor)"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                label="Ilusoes de Saber"
                value={summary.totalIllusionsOfKnowing?.toString() ?? '0'}
                alert={!!summary.totalIllusionsOfKnowing && summary.totalIllusionsOfKnowing > 2}
              />
            </motion.div>

            {/* Main visualizations grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Reliability Diagram */}
              {calibration && (
                <motion.div variants={item}>
                  <ReliabilityDiagram
                    reliabilityData={calibration.reliabilityDiagram}
                    bins={calibration.confidenceBins}
                  />
                </motion.div>
              )}

              {/* Dunning-Kruger Detector */}
              {calibration && (
                <motion.div variants={item}>
                  <DunningKrugerDetector
                    zone={calibration.dunningKrugerZone}
                    index={calibration.dunningKrugerIndex}
                    currentTheta={summary.currentTheta ?? 0}
                    avgOverconfidence={summary.avgCalibrationScore
                      ? (summary.totalAttempts > 0
                          ? timeline.timeline.reduce((s: number, t: any) => s + t.rollingOverconfidence, 0) / timeline.timeline.length
                          : 0)
                      : 0
                    }
                  />
                </motion.div>
              )}
            </div>

            {/* Cascade Analysis */}
            {cascade && (
              <motion.div variants={item}>
                <CascadeFlowChart cascade={cascade} />
              </motion.div>
            )}

            {/* Calibration Trend */}
            {timeline.timeline.length >= 2 && (
              <motion.div variants={item}>
                <CalibrationTrendChart
                  timeline={timeline.timeline.map((t: any) => ({
                    ...t,
                    date: new Date(t.date),
                  }))}
                  trending={summary.calibrationTrending ?? 'stable'}
                />
              </motion.div>
            )}

            {/* Area Breakdown */}
            {Object.keys(timeline.byArea).length > 0 && (
              <motion.div variants={item} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Calibracao por Area
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(timeline.byArea).map((areaData: any) => {
                    const colors = AREA_COLORS[areaData.area] || AREA_COLORS.clinica_medica
                    const label = AREA_LABELS[areaData.area] || areaData.area
                    const isOverconfident = areaData.avgOverconfidence > 0.15

                    return (
                      <div
                        key={areaData.area}
                        className={`rounded-lg border p-3 ${colors.badge.replace('text-', 'border-').split(' ')[0]} bg-surface-2`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {areaData.attempts} caso{areaData.attempts !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <div className="text-lg font-bold text-white">
                              {areaData.avgCalibration.toFixed(0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Calibracao</div>
                          </div>
                          <div>
                            <div className={`text-lg font-bold ${isOverconfident ? 'text-red-400' : 'text-emerald-400'}`}>
                              {areaData.avgOverconfidence > 0 ? '+' : ''}
                              {areaData.avgOverconfidence.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Exc. Conf.</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Adaptive recommendation CTA */}
            <motion.div variants={item}>
              <Card className="border-violet-500/30">
                <CardContent className="py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-violet-400" />
                      <div>
                        <div className="font-medium text-white">Proximo Caso Adaptativo</div>
                        <p className="text-xs text-muted-foreground">
                          O algoritmo selecionara o caso ideal para seu perfil de calibracao.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/fcr"
                      className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-500 transition-colors"
                    >
                      Praticar
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  tooltip,
  alert,
}: {
  icon: React.ReactNode
  label: string
  value: string
  suffix?: string
  tooltip?: string
  alert?: boolean
}) {
  return (
    <motion.div
      className={`bg-surface-2 rounded-lg p-4 border ${alert ? 'border-red-700/50' : 'border-border'}`}
      title={tooltip}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-white">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </motion.div>
  )
}
