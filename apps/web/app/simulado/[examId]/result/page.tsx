'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { useExamStore } from '@/lib/stores/examStore'
import { ExamResults } from '../../components/ExamResults'
import { AreaRadar } from '@/app/desempenho/components/AreaRadar'
import { ExamDDLResults } from '@/components/ddl/ExamDDLResults'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { celebrateExamResult } from '@/lib/confetti'
import { ScoreReveal } from '@/components/ui/ScoreReveal'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { NeuralScanning } from '@/components/ui/NeuralScanning'
import { PredictiveNudge } from '@/components/ui/PredictiveNudge'
import { PassProbabilityGauge } from '@/app/pesquisa/components/PassProbabilityGauge'
import { SpeedAccuracyPlot } from '@/app/pesquisa/components/SpeedAccuracyPlot'
import { MasteryHeatmap } from '@/app/pesquisa/components/MasteryHeatmap'
import { AREA_LABELS } from '@/lib/area-colors'
import type { TRIScore, ENAMEDArea, AreaPerformance, MasteryHeatmapData, SpeedAccuracyProfile } from '@darwin-education/shared'

interface AttemptResult {
  theta: number
  standardError: number
  scaledScore: number
  passed: boolean
  correctCount: number
  totalQuestions: number
  areaBreakdown: Record<ENAMEDArea, AreaPerformance>
  timeSpent: number
  isAdaptive?: boolean
  stoppingReason?: string
  thetaTrajectory?: { itemNum: number; theta: number; se: number }[]
}

export default function ExamResultPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [examTitle, setExamTitle] = useState('')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [history, setHistory] = useState<{ date: string; score: number }[]>([])
  const [snapshot, setSnapshot] = useState<any>(null)

  const { result: storeResult, currentExam, resetExam, attemptId: storeAttemptId } = useExamStore()

  useEffect(() => {
    async function loadResult() {
      // First check if we have result in store
      if (storeResult && currentExam) {
        setResult({
          theta: storeResult.triScore.theta,
          standardError: storeResult.triScore.standardError,
          scaledScore: storeResult.triScore.scaledScore,
          passed: storeResult.triScore.passed,
          correctCount: storeResult.triScore.correctCount,
          totalQuestions: storeResult.triScore.totalAttempted,
          areaBreakdown: storeResult.triScore.areaBreakdown,
          timeSpent: storeResult.timeSpent,
        })
        setExamTitle(currentExam.title)
        if (storeAttemptId) setAttemptId(storeAttemptId)
        setLoading(false)
        return
      }

      // Otherwise load from database
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login')
        return
      }

      interface AttemptRow {
        theta: number
        standard_error: number
        scaled_score: number
        passed: boolean
        correct_count: number
        total_time_seconds: number
        area_breakdown: Record<ENAMEDArea, AreaPerformance>
        exams: { title: string; question_count: number } | null
        is_adaptive?: boolean
        stopping_reason?: string
        theta_trajectory?: { itemNum: number; theta: number; se: number }[]
        items_administered?: string[]
      }

      interface AttemptRowWithId extends AttemptRow {
        id: string
      }

      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .select('id, *, exams(title, question_count)')
        .eq('exam_id', examId)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single() as { data: AttemptRowWithId | null; error: any }

      if (error || !attempt) {
        router.push(`/simulado/${examId}`)
        return
      }

      setAttemptId(attempt.id)
      setResult({
        theta: attempt.theta,
        standardError: attempt.standard_error,
        scaledScore: attempt.scaled_score,
        passed: attempt.passed,
        correctCount: attempt.correct_count,
        totalQuestions: attempt.is_adaptive
          ? (attempt.items_administered?.length || attempt.correct_count)
          : (attempt.exams?.question_count || 0),
        areaBreakdown: attempt.area_breakdown,
        timeSpent: attempt.total_time_seconds,
        isAdaptive: attempt.is_adaptive,
        stoppingReason: attempt.stopping_reason,
        thetaTrajectory: attempt.theta_trajectory,
      })
      setExamTitle(attempt.exams?.title || 'Simulado')
      
      // Fetch history for growth chart
      const { data: historyData } = await supabase
        .from('exam_attempts')
        .select('completed_at, scaled_score')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true })
        .limit(10)

      if (historyData) {
        setHistory((historyData as any[]).map(h => ({
          date: new Date(h.completed_at).toLocaleDateString(),
          score: h.scaled_score || 0
        })))
      }

      // Fetch latest learner model snapshot (Digital Twin)
      const { data: snapshotData } = await (supabase
        .from('learner_model_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_at', { ascending: false })
        .limit(1) as any)

      if (snapshotData && (snapshotData as any[]).length > 0) {
        setSnapshot((snapshotData as any[])[0])
      }

      setLoading(false)
    }

    loadResult()
  }, [examId, router, storeResult, currentExam, storeAttemptId])

  const handleNewExam = () => {
    resetExam()
    router.push('/simulado')
  }

  const handleReviewExam = () => {
    router.push(`/simulado/${examId}/review`)
  }

  // Transform areaBreakdown for AreaRadar
  const radarPerformance = result?.areaBreakdown 
    ? Object.entries(result.areaBreakdown).reduce((acc, [area, performance]) => {
        acc[area as ENAMEDArea] = Math.round(performance.percentage)
        return acc
      }, {} as Record<ENAMEDArea, number>)
    : {} as Record<ENAMEDArea, number>

  const shouldReduceMotion = useReducedMotion()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-label-primary mb-2">Resultado indisponível</h2>
            <p className="text-label-secondary mb-6">
              Não encontramos um resultado válido para este simulado.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push(`/simulado/${examId}`)} fullWidth>
                Voltar para o simulado
              </Button>
              <Button variant="bordered" onClick={() => router.push('/simulado')} fullWidth>
                Ver lista de simulados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <AnimatedList className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <AnimatedItem className="text-center mb-8">
          <h1 className="text-3xl font-bold text-label-primary mb-2">Resultado do Simulado</h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-label-secondary">{examTitle}</p>
            {result.isAdaptive && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sky-500/12 text-sky-200 border border-sky-400/35 shadow-inner-shine">
                Adaptativo
              </span>
            )}
          </div>
        </AnimatedItem>

        {/* Main Score Card with High-Score Celebration */}
        <AnimatedItem className="mb-8 relative">
          {result.scaledScore >= 600 && !shouldReduceMotion && (
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-emerald-500/20 rounded-[2rem] blur-2xl animate-pulse pointer-events-none z-0" />
          )}
          <Card className={`relative z-10 overflow-hidden ${result.scaledScore >= 600 ? 'border-emerald-500/40 shadow-glow-emerald/10' : ''}`}>
            {result.scaledScore >= 600 && (
              <div className="absolute top-0 right-0 p-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Nível Expert
                </div>
              </div>
            )}
            <CardContent>
              <ScoreReveal
                score={result.scaledScore}
                passed={result.passed}
                cutoffLabel="Nota de corte: 600 pontos"
                stats={[
                  { value: result.correctCount, label: 'Acertos' },
                  { value: result.totalQuestions - result.correctCount, label: 'Erros' },
                  { value: Math.round((result.correctCount / result.totalQuestions) * 100), label: 'Aproveitamento', suffix: '%' },
                  ...(result.isAdaptive ? [{ value: result.totalQuestions, label: 'Itens' }] : []),
                ]}
                onRevealComplete={() => {
                  celebrateExamResult({
                    score: result.scaledScore,
                    maxScore: 1000,
                    passThreshold: 600,
                    passed: result.passed,
                  })
                }}
              />
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Adaptive Test Info */}
        {result.isAdaptive && (
          <AnimatedItem className="mb-8">
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-label-primary mb-4">Teste Adaptativo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-label-secondary text-sm">Itens administrados</div>
                    <div className="text-xl font-semibold text-label-primary">{result.totalQuestions}</div>
                  </div>
                  <div>
                    <div className="text-label-secondary text-sm">Erro padrão</div>
                    <div className="text-xl font-semibold text-label-primary">{result.standardError.toFixed(3)}</div>
                  </div>
                  {result.stoppingReason && (
                    <div>
                      <div className="text-label-secondary text-sm">Critério de parada</div>
                      <div className="text-sm font-medium text-label-primary">
                        {result.stoppingReason === 'se_threshold'
                          ? 'Precisão atingida'
                          : 'Máximo de itens'}
                      </div>
                    </div>
                  )}
                </div>
                {/* Theta Trajectory Sparkline */}
                {result.thetaTrajectory && result.thetaTrajectory.length > 1 && (
                  <div>
                    <div className="text-label-secondary text-sm mb-2">Trajetória da habilidade (theta)</div>
                    <svg
                      viewBox={`0 0 ${result.thetaTrajectory.length * 12} 60`}
                      className="w-full h-16"
                      preserveAspectRatio="none"
                    >
                      {/* Cutoff line at theta=1.0 (score 600) */}
                      <line
                        x1="0"
                        y1={60 - ((1.0 + 4) / 8) * 60}
                        x2={result.thetaTrajectory.length * 12}
                        y2={60 - ((1.0 + 4) / 8) * 60}
                        stroke="#6B7280"
                        strokeWidth="0.5"
                        strokeDasharray="4 2"
                      />
                      <polyline
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        points={result.thetaTrajectory
                          .map((p, i) => {
                            const x = i * 12 + 6
                            const y = 60 - ((Math.max(-4, Math.min(4, p.theta)) + 4) / 8) * 60
                            return `${x},${y}`
                          })
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        )}

        {/* Area Breakdown */}
        <AnimatedItem className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-label-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Equilíbrio de Competências
              </h3>
              <div className="flex justify-center">
                <AreaRadar performance={radarPerformance} />
              </div>
            </div>
          </Card>
          <ExamResults areaBreakdown={result.areaBreakdown} />
        </AnimatedItem>

        {/* Remediation Roadmap */}
        {result.areaBreakdown && (
          <AnimatedItem className="mb-8">
            <Card className="border-emerald-500/20 bg-surface-1">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.488V5.512a2 2 0 011.553-1.956L9 1l5.447 2.724A2 2 0 0115 5.512v9.976a2 2 0 01-1.553 1.956L9 20z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20V9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5.512L9 9l6-3.488" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-label-primary">Plano de Remediação</h3>
                    <p className="text-sm text-label-secondary">Ações recomendadas com base nas suas lacunas psicométricas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(result.areaBreakdown)
                    .sort(([, a], [, b]) => a.percentage - b.percentage)
                    .slice(0, 3)
                    .map(([area, performance], i) => (
                      <div key={area} className="group flex items-start gap-4 p-4 rounded-xl bg-surface-2/50 border border-separator hover:border-emerald-500/30 transition-all">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-sm font-bold text-label-secondary group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-label-primary mb-1">
                            Reforçar {AREA_LABELS[area as ENAMEDArea]}
                          </h4>
                          <p className="text-sm text-label-secondary mb-3">
                            Detectamos um desempenho de {Math.round(performance.percentage)}% nesta área. Focar em tópicos de alta prevalência para subir sua nota.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/flashcards?area=${area}`}>
                              <Button size="sm" variant="bordered" className="h-8 text-xs">
                                Revisar Flashcards
                              </Button>
                            </Link>
                            <Link href={`/teoria?area=${area}`}>
                              <Button size="sm" variant="bordered" className="h-8 text-xs">
                                Ver Teoria
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </AnimatedItem>
        )}

        {/* Neural Psychometric Digital Twin */}
        {snapshot && (
          <AnimatedItem className="mb-8 relative">
            {!shouldReduceMotion && <NeuralScanning duration={4} />}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-glow-purple">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h6l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-label-primary tracking-tight">Gêmeo Digital Psicometria</h2>
                <p className="text-label-secondary text-sm">Análise SOTA baseada em Redes Neurais e Modelos Bayesianos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gauge & Accuracy Plot Column */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="h-full border-purple-500/10 bg-purple-500/5 backdrop-blur-sm shadow-elevation-1">
                  <div className="p-6">
                    <PassProbabilityGauge 
                      probability={snapshot.pass_probability || 0} 
                      overallCompetency={snapshot.overall_competency || 0} 
                    />
                    <div className="mt-6 pt-6 border-t border-purple-500/10">
                      <SpeedAccuracyPlot profile={{
                        theta: snapshot.rt_irt_theta || 0,
                        tau: snapshot.rt_irt_tau || 0,
                        thetaSE: 0.2,
                        tauSE: 0.15,
                        responseBehaviors: []
                      } as any} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Mastery Heatmap Column */}
              <div className="lg:col-span-2">
                <Card className="h-full border-blue-500/10 bg-blue-500/5 backdrop-blur-sm shadow-elevation-1">
                  <div className="p-6">
                    <MasteryHeatmap heatmap={{
                      areas: ['clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'],
                      kcsByArea: snapshot.bkt_mastery ? 
                        Object.entries(snapshot.bkt_mastery as Record<string, any>).reduce((acc, [id, data]) => {
                          const area = id.includes('ped') ? 'pediatria' : 
                                       id.includes('cir') ? 'cirurgia' :
                                       id.includes('go') ? 'ginecologia_obstetricia' :
                                       id.includes('sau') ? 'saude_coletiva' : 'clinica_medica'
                          if (!acc[area as ENAMEDArea]) acc[area as ENAMEDArea] = []
                          acc[area as ENAMEDArea].push({
                            kcId: id,
                            kcName: id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                            mastery: data.mastery,
                            classification: data.classification as any,
                            opportunityCount: 0
                          })
                          return acc
                        }, {} as Record<ENAMEDArea, any[]>) : {},
                      areaMastery: (snapshot.area_competency as any) || {},
                      overallMastery: snapshot.bkt_overall_mastery || 0,
                      masteredCount: Object.values(snapshot.bkt_mastery || {}).filter((v: any) => v.classification === 'mastered').length,
                      totalKCs: Object.keys(snapshot.bkt_mastery || {}).length
                    } as any} />
                  </div>
                </Card>
              </div>
            </div>

            {/* Meta-Cognitive Insights */}
            {(snapshot.strengths?.length > 0 || snapshot.weaknesses?.length > 0) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Fortalezas Identificadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {snapshot.strengths.map((s: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card className="border-rose-500/20 bg-rose-500/5">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Pontos de Atenção Crítica
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {snapshot.weaknesses.map((w: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </AnimatedItem>
        )}

        {/* Growth Analytics */}
        {history.length > 1 && (
          <AnimatedItem className="mb-8">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-label-primary mb-6">Evolução da Proficiência</h3>
                <div className="h-64 w-full relative">
                  {/* SVG Chart */}
                  <svg viewBox="0 0 1000 250" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {[0, 200, 400, 600, 800, 1000].map((val) => {
                      const y = 250 - (val / 1000) * 200 - 25
                      return (
                        <g key={val}>
                          <line x1="0" y1={y} x2="1000" y2={y} stroke="var(--separator)" strokeWidth="1" strokeDasharray="4 4" />
                          <text x="-10" y={y} dominantBaseline="middle" textAnchor="end" className="text-[20px] fill-label-tertiary">{val}</text>
                        </g>
                      )
                    })}
                    
                    {/* Pass threshold line */}
                    <line x1="0" y1={250 - (600 / 1000) * 200 - 25} x2="1000" y2={250 - (600 / 1000) * 200 - 25} stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="8 4" />

                    {/* Path */}
                    <path
                      d={history.map((h, i) => {
                        const x = (i / (history.length - 1)) * 1000
                        const y = 250 - (h.score / 1000) * 200 - 25
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="url(#growthGradient)"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    
                    {/* Points */}
                    {history.map((h, i) => {
                      const x = (i / (history.length - 1)) * 1000
                      const y = 250 - (h.score / 1000) * 200 - 25
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="8" fill="var(--surface-0)" stroke={h.score >= 600 ? 'var(--emerald-400)' : 'var(--red-400)'} strokeWidth="3" />
                          <text x={x} y={y - 15} textAnchor="middle" className="text-[18px] font-bold fill-label-primary">{h.score}</text>
                          <text x={x} y={y + 30} textAnchor="middle" className="text-[16px] fill-label-tertiary">{h.date}</text>
                        </g>
                      )
                    })}

                    <defs>
                      <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--emerald-600)" />
                        <stop offset="100%" stopColor="var(--blue-600)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </Card>
          </AnimatedItem>
        )}

        {/* DDL Analysis Results */}
        {attemptId && (
          <AnimatedItem className="mt-8">
            <ExamDDLResults examAttemptId={attemptId} />
          </AnimatedItem>
        )}

        {/* Time Stats */}
        <AnimatedItem className="mt-8">
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold text-label-primary mb-4">Estatísticas de Tempo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-label-secondary text-sm">Tempo total</div>
                  <div className="text-xl font-semibold text-label-primary">
                    {Math.floor(result.timeSpent / 3600)}h {Math.floor((result.timeSpent % 3600) / 60)}min
                  </div>
                </div>
                <div>
                  <div className="text-label-secondary text-sm">Média por questão</div>
                  <div className="text-xl font-semibold text-label-primary">
                    {Math.round(result.timeSpent / result.totalQuestions / 60)}min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Action Buttons */}
        <AnimatedItem className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button variant="bordered" onClick={handleReviewExam} fullWidth>
            Revisar Questões
          </Button>
          <Button onClick={handleNewExam} fullWidth>
            Novo Simulado
          </Button>
        </AnimatedItem>

        {/* CTA for weak areas */}
        {result.areaBreakdown && (
          <AnimatedItem className="mt-8">
            <Card className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-800/50">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-label-primary mb-1">Melhore seu desempenho</h4>
                    <p className="text-sm text-label-secondary">
                      Use os flashcards para revisar as áreas com menor desempenho e fortaleça seus pontos fracos.
                    </p>
                  </div>
                  <Link href="/flashcards">
                    <Button size="small">Ver Flashcards</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>
        )}
      </AnimatedList>

      {/* Predictive Nudge */}
      {snapshot?.pass_probability && (
        <PredictiveNudge 
          message={`SOTA+++: Você tem ${Math.round(snapshot.pass_probability * 100)}% de probabilidade de ser aprovado no ENAMED hoje. Mantendo este ritmo, você atingirá o topo do ranking em breve!`}
          delay={5}
        />
      )}
    </div>
  )
}
