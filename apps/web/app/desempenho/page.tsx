'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FeatureState } from '@/components/ui/FeatureState'
import { createClient } from '@/lib/supabase/client'
import { ScoreHistory } from './components/ScoreHistory'
import { AreaRadar } from './components/AreaRadar'
import { PassPrediction } from './components/PassPrediction'
import { StudyStreak } from './components/StudyStreak'
import { WeakAreas } from './components/WeakAreas'
import { ExportData } from './components/ExportData'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { ThetaTrajectory } from './components/ThetaTrajectory'
import { WrongItemsTable } from './components/WrongItemsTable'
import { AREA_LABELS } from '@/lib/area-colors'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import type { ENAMEDArea } from '@darwin-education/shared'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors'

interface ExamAttempt {
  id: string
  exam_id: string
  completed_at: string
  theta: number
  standard_error?: number
  scaled_score: number
  passed: boolean
  correct_count: number
  area_breakdown: Record<ENAMEDArea, { correct: number; total: number }>
  total_time_seconds: number
  is_adaptive?: boolean
}

interface PerformanceStats {
  totalExams: number
  averageScore: number
  passRate: number
  totalQuestions: number
  correctQuestions: number
  studyStreak: number
  lastStudyDate: string | null
  bestScore: number
  latestTheta: number
}

interface StudyActivity {
  activity_date: string
  exams_completed: number
  flashcards_reviewed: number
  questions_answered: number
}

function hasRecordedActivity(activity: StudyActivity) {
  return (
    (activity.exams_completed || 0) > 0 ||
    (activity.flashcards_reviewed || 0) > 0 ||
    (activity.questions_answered || 0) > 0
  )
}

function calculateStudyStreakFromActivity(activityData: StudyActivity[]) {
  const activeDates = new Set(activityData.filter(hasRecordedActivity).map((activity) => activity.activity_date))

  if (activeDates.size === 0) {
    return 0
  }

  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  const today = currentDate.toISOString().split('T')[0]
  if (!activeDates.has(today)) {
    currentDate.setDate(currentDate.getDate() - 1)
    const yesterday = currentDate.toISOString().split('T')[0]
    if (!activeDates.has(yesterday)) {
      return 0
    }
  }

  let streak = 0
  while (activeDates.has(currentDate.toISOString().split('T')[0])) {
    streak += 1
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

function getLastStudyDateFromActivity(activityData: StudyActivity[]) {
  const latest = activityData.find(hasRecordedActivity)
  return latest?.activity_date || null
}


type TimePeriod = '7days' | '30days' | 'all'

export default function DesempenhoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [filteredAttempts, setFilteredAttempts] = useState<ExamAttempt[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [areaPerformance, setAreaPerformance] = useState<Record<ENAMEDArea, number>>({} as Record<ENAMEDArea, number>)
  const [studyActivity, setStudyActivity] = useState<StudyActivity[]>([])
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')

  useEffect(() => {
    loadPerformanceData()
  }, [])

  // Filter attempts based on time period
  useEffect(() => {
    const now = new Date()
    let filtered = attempts

    if (timePeriod === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = attempts.filter(a => new Date(a.completed_at) >= sevenDaysAgo)
    } else if (timePeriod === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = attempts.filter(a => new Date(a.completed_at) >= thirtyDaysAgo)
    }

    setFilteredAttempts(filtered)
  }, [timePeriod, attempts])

  async function loadPerformanceData() {
    setLoading(true)
    setLoadError(null)

    try {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login?redirectTo=/desempenho')
        return
      }

      const attemptsResult = await (supabase
        .from('exam_attempts') as any)
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })

      const attemptsError = attemptsResult.error as any
      const attemptsData = (attemptsResult.data || []) as ExamAttempt[]

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        { data: profileData, error: profileError },
        { data: activityData, error: activityError },
      ] = await Promise.all([
        (supabase.from('profiles') as any)
          .select('streak_days, last_activity_at')
          .eq('id', user.id)
          .maybeSingle(),
        (supabase as any).from('study_activity')
          .select('activity_date, exams_completed, flashcards_reviewed, questions_answered')
          .eq('user_id', user.id)
          .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('activity_date', { ascending: false }),
      ])

      const activity = (activityData || []) as StudyActivity[]
      setStudyActivity(activity)

      const streakFromProfile = profileData?.streak_days || 0
      const streakFromActivity = calculateStudyStreakFromActivity(activity)
      const resolvedStudyStreak = streakFromProfile > 0 ? streakFromProfile : streakFromActivity
      const resolvedLastStudyDate =
        getLastStudyDateFromActivity(activity) ||
        profileData?.last_activity_at ||
        attemptsData?.[0]?.completed_at ||
        null

      if (attemptsError) {
        if (isMissingTableError(attemptsError) || isSchemaDriftError(attemptsError)) {
          setLoadError('Dados de desempenho indisponíveis neste ambiente (schema em migração).')
        } else {
          setLoadError('Não foi possível carregar seus dados de desempenho agora. Tente novamente.')
        }
      } else if (profileError || activityError) {
        // Non-blocking: allow the page to render with partial data.
        const shouldWarn = Boolean(profileError || activityError)
        if (shouldWarn) {
          console.warn('Dados de desempenho parciais:', { profileError, activityError })
        }
      }

      setAttempts(attemptsData)
      setFilteredAttempts(attemptsData)

      const baseAreaPerf = {} as Record<ENAMEDArea, number>
      for (const area of Object.keys(AREA_LABELS) as ENAMEDArea[]) {
        baseAreaPerf[area] = 0
      }

      if (attemptsData.length > 0) {
        // Calculate stats
        const totalExams = attemptsData.length
        const passedExams = attemptsData.filter((a: ExamAttempt) => a.passed).length
        const totalQuestions = attemptsData.reduce((sum: number, a: ExamAttempt) => {
          const breakdown = a.area_breakdown || {}
          return sum + Object.values(breakdown).reduce((s, area) => s + (area?.total || 0), 0)
        }, 0)
        const correctQuestions = attemptsData.reduce((sum: number, a: ExamAttempt) => sum + (a.correct_count || 0), 0)
        const averageScore =
          attemptsData.reduce((sum: number, a: ExamAttempt) => sum + (a.scaled_score || 0), 0) /
          totalExams
        const bestScore = Math.max(...attemptsData.map((a: ExamAttempt) => a.scaled_score || 0))
        const latestTheta = attemptsData[0]?.theta || 0

        setStats({
          totalExams,
          averageScore: Math.round(averageScore),
          passRate: Math.round((passedExams / totalExams) * 100),
          totalQuestions,
          correctQuestions,
          studyStreak: resolvedStudyStreak,
          lastStudyDate: resolvedLastStudyDate,
          bestScore: Math.round(bestScore),
          latestTheta,
        })

        // Calculate area performance (aggregate across all attempts)
        const areaStats: Record<ENAMEDArea, { correct: number; total: number }> = {} as any
        for (const area of Object.keys(AREA_LABELS) as ENAMEDArea[]) {
          areaStats[area] = { correct: 0, total: 0 }
        }

        for (const attempt of attemptsData) {
          if (attempt.area_breakdown) {
            for (const [area, data] of Object.entries(attempt.area_breakdown)) {
              if (areaStats[area as ENAMEDArea]) {
                areaStats[area as ENAMEDArea].correct += (data as any)?.correct || 0
                areaStats[area as ENAMEDArea].total += (data as any)?.total || 0
              }
            }
          }
        }

        const areaPerf = { ...baseAreaPerf }
        for (const [area, data] of Object.entries(areaStats)) {
          areaPerf[area as ENAMEDArea] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
        }
        setAreaPerformance(areaPerf)
      } else {
        // No attempts yet
        setStats({
          totalExams: 0,
          averageScore: 0,
          passRate: 0,
          totalQuestions: 0,
          correctQuestions: 0,
          studyStreak: resolvedStudyStreak,
          lastStudyDate: resolvedLastStudyDate,
          bestScore: 0,
          latestTheta: 0,
        })
        setAreaPerformance(baseAreaPerf)
      }
    } catch (error) {
      console.error('Falha ao carregar desempenho:', error)
      setAttempts([])
      setFilteredAttempts([])
      setStats(null)
      setAreaPerformance({} as Record<ENAMEDArea, number>)
      setStudyActivity([])
      setLoadError('Falha ao carregar seu desempenho no momento. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-label-primary mb-2">Desempenho</h1>
            <p className="text-label-secondary">
              Acompanhe seu progresso e identifique áreas para melhorar
            </p>
          </div>
          {stats && stats.totalExams > 0 ? <ExportData attempts={attempts} stats={stats} /> : null}
        </div>

        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/dashboard-bg-v2.png"
            alt="Banner do painel de desempenho"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/35" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Analise seu desempenho com clareza.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Visualize evolução, pontos fracos e progresso de aprovação em um único painel.
              </p>
            </div>
          </div>
        </div>

        {loadError ? (
          <FeatureState
            kind="error"
            title="Não foi possível carregar seu desempenho"
            description={loadError}
            action={{ label: 'Tentar novamente', onClick: () => void loadPerformanceData(), variant: 'secondary' }}
            className="mb-6"
          />
        ) : !stats ? (
          <FeatureState
            kind="error"
            title="Dados indisponíveis"
            description="Não foi possível montar o painel agora. Tente novamente em instantes."
            action={{ label: 'Recarregar', onClick: () => void loadPerformanceData(), variant: 'secondary' }}
          />
        ) : stats.totalExams === 0 ? (
          <FeatureState
            kind="empty"
            title="Sem dados de desempenho"
            description="Complete pelo menos um simulado para ver suas estatísticas e previsões."
            action={{ label: 'Iniciar simulado', onClick: () => router.push('/simulado'), variant: 'primary' }}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Stats */}
            <AnimatedList className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-400"><AnimatedCounter value={stats?.averageScore || 0} /></p>
                      <p className="text-sm text-label-secondary mt-1">Pontuação Média</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>

              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-400"><AnimatedCounter value={stats?.passRate || 0} suffix="%" /></p>
                      <p className="text-sm text-label-secondary mt-1">Taxa de Aprovação</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>

              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-400"><AnimatedCounter value={stats?.totalExams || 0} /></p>
                      <p className="text-sm text-label-secondary mt-1">Simulados</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>

              <AnimatedItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-400"><AnimatedCounter value={stats?.bestScore || 0} /></p>
                      <p className="text-sm text-label-secondary mt-1">Melhor Pontuação</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>
            </AnimatedList>

            {/* Main Content Grid */}
            <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Score History Chart with Time Period Filter */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>Histórico de Pontuação</CardTitle>
                    <div className="flex gap-2">
                      {(['7days', '30days', 'all'] as TimePeriod[]).map((period) => (
                        <Button
                          key={period}
                          variant={timePeriod === period ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setTimePeriod(period)}
                          className={timePeriod === period ? 'bg-emerald-500/20 text-emerald-400' : ''}
                        >
                          {period === '7days' ? '7 dias' : period === '30days' ? '30 dias' : 'Tudo'}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredAttempts.length > 0 ? (
                      <ScoreHistory attempts={filteredAttempts} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-label-secondary">
                        Nenhum simulado neste período
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Area Performance Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Desempenho por Área</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AreaRadar performance={areaPerformance} />
                  </CardContent>
                </Card>

                {/* Theta Trajectory (adaptive exams only) */}
                {attempts.some((a) => typeof a.theta === 'number') && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Trajetória de Habilidade (θ)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ThetaTrajectory attempts={[...attempts].reverse()} />
                    </CardContent>
                  </Card>
                )}

                {/* Wrong items from latest adaptive attempt */}
                <WrongItemsTable
                  attemptId={attempts.find((a) => a.is_adaptive)?.id ?? null}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Pass Prediction with Timeline */}
                <PassPrediction
                  theta={stats?.latestTheta || 0}
                  totalQuestions={stats?.totalQuestions || 0}
                  attempts={attempts}
                />

                {/* Study Streak */}
                <StudyStreak
                  streak={stats?.studyStreak || 0}
                  lastDate={stats?.lastStudyDate || null}
                  activityData={studyActivity}
                />

                {/* Weak Areas */}
                <WeakAreas performance={areaPerformance} />
              </div>
            </div>
            </ScrollReveal>

            {/* Recent Attempts Table */}
            <ScrollReveal delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {timePeriod === '7days' ? 'Últimos 7 dias' : timePeriod === '30days' ? 'Últimos 30 dias' : 'Todos os simulados'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAttempts.length === 0 ? (
                  <div className="py-8 text-center text-label-secondary">
                    Nenhum simulado neste período
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-label-secondary border-b border-separator">
                          <th className="pb-3 font-medium">Data</th>
                          <th className="pb-3 font-medium">Pontuação</th>
                          <th className="pb-3 font-medium">Acertos</th>
                          <th className="pb-3 font-medium">Tempo</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filteredAttempts.slice(0, 10).map((attempt) => {
                          const totalQuestions = attempt.area_breakdown
                            ? Object.values(attempt.area_breakdown).reduce((s, a) => s + (a?.total || 0), 0)
                            : 0

                          return (
                            <tr key={attempt.id} className="border-b border-separator/50 hover:bg-surface-2/30 transition-colors">
                              <td className="py-3 text-label-primary">
                                {new Date(attempt.completed_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3">
                                <span className={`font-medium ${attempt.passed ? 'text-emerald-400' : 'text-label-primary'}`}>
                                  {Math.round(attempt.scaled_score)}
                                </span>
                              </td>
                              <td className="py-3 text-label-primary">
                                {attempt.correct_count}/{totalQuestions}
                              </td>
                              <td className="py-3 text-label-secondary">
                                {Math.floor(attempt.total_time_seconds / 60)}min
                              </td>
                              <td className="py-3">
                                {attempt.passed ? (
                                  <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                                    Aprovado
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                                    Reprovado
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            </ScrollReveal>
          </div>
        )}
      </div>
    </div>
  )
}
