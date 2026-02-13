'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { useExamStore } from '@/lib/stores/examStore'
import { ExamResults } from '../../components/ExamResults'
import { ExamDDLResults } from '@/components/ddl/ExamDDLResults'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { celebrateExamResult } from '@/lib/confetti'
import { ScoreReveal } from '@/components/ui/ScoreReveal'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import type { TRIScore, ENAMEDArea, AreaPerformance } from '@darwin-education/shared'

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
      setLoading(false)
    }

    loadResult()
  }, [examId, router, storeResult, currentExam])

  const handleNewExam = () => {
    resetExam()
    router.push('/simulado')
  }

  const handleReviewExam = () => {
    router.push(`/simulado/${examId}/review`)
  }

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
              <Button variant="outline" onClick={() => router.push('/simulado')} fullWidth>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-label-primary mb-2">Resultado do Simulado</h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-label-secondary">{examTitle}</p>
            {result.isAdaptive && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sky-500/12 text-sky-200 border border-sky-400/35 shadow-inner-shine">
                Adaptativo
              </span>
            )}
          </div>
        </div>

        {/* Main Score Card */}
        <Card className="mb-8">
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

        {/* Adaptive Test Info */}
        {result.isAdaptive && (
          <ScrollReveal>
            <Card className="mb-8">
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
          </ScrollReveal>
        )}

        {/* Area Breakdown */}
        <ScrollReveal>
          <ExamResults areaBreakdown={result.areaBreakdown} />
        </ScrollReveal>

        {/* DDL Analysis Results */}
        <ScrollReveal delay={0.1}>
          {attemptId && (
            <div className="mt-8">
              <ExamDDLResults examAttemptId={attemptId} />
            </div>
          )}
        </ScrollReveal>

        {/* Time Stats */}
        <ScrollReveal delay={0.2}>
          <Card className="mt-8">
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
        </ScrollReveal>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button variant="outline" onClick={handleReviewExam} fullWidth>
            Revisar Questões
          </Button>
          <Button onClick={handleNewExam} fullWidth>
            Novo Simulado
          </Button>
        </div>

        {/* CTA for weak areas */}
        {result.areaBreakdown && (
          <Card className="mt-8 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-800/50">
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
                  <Button size="sm">Ver Flashcards</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
