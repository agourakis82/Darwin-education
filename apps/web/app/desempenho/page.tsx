'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { ScoreHistory } from './components/ScoreHistory'
import { AreaRadar } from './components/AreaRadar'
import { PassPrediction } from './components/PassPrediction'
import { StudyStreak } from './components/StudyStreak'
import { WeakAreas } from './components/WeakAreas'
import { ExportData } from './components/ExportData'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import type { ENAMEDArea } from '@darwin-education/shared'

interface ExamAttempt {
  id: string
  exam_id: string
  completed_at: string
  theta: number
  scaled_score: number
  passed: boolean
  correct_count: number
  area_breakdown: Record<ENAMEDArea, { correct: number; total: number }>
  total_time_seconds: number
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

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

type TimePeriod = '7days' | '30days' | 'all'

export default function DesempenhoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login?redirectTo=/desempenho')
      return
    }

    // Load exam attempts
    const { data: attemptsData } = await (supabase
      .from('exam_attempts') as any)
      .select('*')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (attemptsData && attemptsData.length > 0) {
      setAttempts(attemptsData)
      setFilteredAttempts(attemptsData)

      // Calculate stats
      const totalExams = attemptsData.length
      const passedExams = attemptsData.filter((a: ExamAttempt) => a.passed).length
      const totalQuestions = attemptsData.reduce((sum: number, a: ExamAttempt) => {
        const breakdown = a.area_breakdown || {}
        return sum + Object.values(breakdown).reduce((s, area) => s + (area?.total || 0), 0)
      }, 0)
      const correctQuestions = attemptsData.reduce((sum: number, a: ExamAttempt) => sum + (a.correct_count || 0), 0)
      const averageScore = attemptsData.reduce((sum: number, a: ExamAttempt) => sum + (a.scaled_score || 0), 0) / totalExams
      const bestScore = Math.max(...attemptsData.map((a: ExamAttempt) => a.scaled_score || 0))
      const latestTheta = attemptsData[0]?.theta || 0

      // Calculate study streak
      const { data: streakData } = await (supabase
        .from('user_achievements') as any)
        .select('current_streak, last_activity_date')
        .eq('user_id', user.id)
        .single()

      // Fetch study activity for last 7 days (for calendar view)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: activityData } = await (supabase
        .from('study_activity') as any)
        .select('activity_date, exams_completed, flashcards_reviewed, questions_answered')
        .eq('user_id', user.id)
        .gte('activity_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('activity_date', { ascending: false })

      if (activityData) {
        setStudyActivity(activityData)
      }

      setStats({
        totalExams,
        averageScore: Math.round(averageScore),
        passRate: Math.round((passedExams / totalExams) * 100),
        totalQuestions,
        correctQuestions,
        studyStreak: streakData?.current_streak || 0,
        lastStudyDate: streakData?.last_activity_date || attemptsData[0]?.completed_at,
        bestScore: Math.round(bestScore),
        latestTheta,
      })

      // Calculate area performance (aggregate across all attempts)
      const areaStats: Record<ENAMEDArea, { correct: number; total: number }> = {} as any
      for (const area of Object.keys(areaLabels) as ENAMEDArea[]) {
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

      const areaPerf = {} as Record<ENAMEDArea, number>
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
        studyStreak: 0,
        lastStudyDate: null,
        bestScore: 0,
        latestTheta: 0,
      })
    }

    setLoading(false)
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Desempenho</h1>
            <p className="text-sm text-slate-400 mt-1">
              Acompanhe seu progresso e identifique áreas para melhorar
            </p>
          </div>
          {stats && stats.totalExams > 0 && <ExportData attempts={attempts} stats={stats} />}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && stats.totalExams === 0 ? (
          // Empty state
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum dado de desempenho</h3>
              <p className="text-slate-400 mb-6">
                Complete pelo menos um simulado para ver suas estatísticas
              </p>
              <a
                href="/simulado"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                Iniciar um Simulado
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-400">{stats?.averageScore}</p>
                    <p className="text-sm text-slate-400 mt-1">Pontuação Média</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400">{stats?.passRate}%</p>
                    <p className="text-sm text-slate-400 mt-1">Taxa de Aprovação</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-400">{stats?.totalExams}</p>
                    <p className="text-sm text-slate-400 mt-1">Simulados</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">{stats?.bestScore}</p>
                    <p className="text-sm text-slate-400 mt-1">Melhor Pontuação</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Score History Chart with Time Period Filter */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>Histórico de Pontuação</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTimePeriod('7days')}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          timePeriod === '7days'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        7 dias
                      </button>
                      <button
                        onClick={() => setTimePeriod('30days')}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          timePeriod === '30days'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        30 dias
                      </button>
                      <button
                        onClick={() => setTimePeriod('all')}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          timePeriod === 'all'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        Tudo
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredAttempts.length > 0 ? (
                      <ScoreHistory attempts={filteredAttempts} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400">
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

            {/* Recent Attempts Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {timePeriod === '7days' ? 'Últimos 7 dias' : timePeriod === '30days' ? 'Últimos 30 dias' : 'Todos os simulados'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAttempts.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    Nenhum simulado neste período
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
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
                            <tr key={attempt.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 text-slate-300">
                                {new Date(attempt.completed_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3">
                                <span className={`font-medium ${attempt.passed ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {Math.round(attempt.scaled_score)}
                                </span>
                              </td>
                              <td className="py-3 text-slate-300">
                                {attempt.correct_count}/{totalQuestions}
                              </td>
                              <td className="py-3 text-slate-400">
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
          </div>
        )}
      </main>
    </div>
  )
}
