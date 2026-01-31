'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { ENAMEDArea } from '@darwin-education/shared'

interface DashboardStats {
  totalStudents: number
  activeStudentsLast7Days: number
  totalExams: number
  averageScore: number
  passRate: number
  totalQuestions: number
  pendingQuestions: number
  areaPerformance: Record<ENAMEDArea, { attempts: number; avgScore: number }>
  recentActivity: {
    date: string
    examsTaken: number
    newUsers: number
  }[]
}

interface Student {
  id: string
  email: string
  full_name: string | null
  xp: number
  created_at: string
  last_exam_at: string | null
  total_exams: number
  avg_score: number | null
}

// Database row types for Supabase queries
interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  xp: number
  created_at: string
}

interface ExamAttemptRow {
  id: string
  user_id: string
  completed_at: string
  scaled_score: number | null
  passed: boolean
  area_breakdown: Record<string, { correct: number; total: number }> | null
}

interface QuestionRow {
  id: string
  status: string
}

interface RecentActivityRow {
  completed_at: string
  user_id: string
}

const AREA_NAMES: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        // TODO: Check if user is admin (for now, allow all authenticated users)
        // In production, add RLS policy or check admin role

        // Fetch dashboard data in parallel
        const [
          studentsResult,
          examsResult,
          questionsResult,
          recentActivityResult,
        ] = await Promise.all([
          // Get all students with their stats
          supabase
            .from('profiles')
            .select(`
              id,
              email,
              full_name,
              xp,
              created_at
            `)
            .order('created_at', { ascending: false }),

          // Get exam attempts
          supabase
            .from('exam_attempts')
            .select('*')
            .order('completed_at', { ascending: false }),

          // Get question counts
          supabase
            .from('questions')
            .select('id, status')
            .in('status', ['approved', 'pending_review', 'draft']),

          // Get recent activity (last 7 days)
          supabase
            .from('exam_attempts')
            .select('completed_at, user_id')
            .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ])

        // Process students
        const students = (studentsResult.data || []) as ProfileRow[]
        const exams = (examsResult.data || []) as ExamAttemptRow[]
        const questions = (questionsResult.data || []) as QuestionRow[]

        // Calculate student stats
        const studentStats = students.map((student: ProfileRow) => {
          const studentExams = exams.filter((e: ExamAttemptRow) => e.user_id === student.id)
          const lastExam = studentExams[0]
          const avgScore = studentExams.length > 0
            ? studentExams.reduce((sum: number, e: ExamAttemptRow) => sum + (e.scaled_score || 0), 0) / studentExams.length
            : null

          return {
            ...student,
            last_exam_at: lastExam?.completed_at || null,
            total_exams: studentExams.length,
            avg_score: avgScore,
          }
        })

        // Active students (exam in last 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const activeStudentIds = new Set(
          exams
            .filter((e: ExamAttemptRow) => new Date(e.completed_at).getTime() > sevenDaysAgo)
            .map((e: ExamAttemptRow) => e.user_id)
        )

        // Calculate pass rate and average score
        const completedExams = exams.filter((e: ExamAttemptRow) => e.scaled_score !== null)
        const passedExams = completedExams.filter((e: ExamAttemptRow) => e.passed)
        const avgScore = completedExams.length > 0
          ? completedExams.reduce((sum: number, e: ExamAttemptRow) => sum + (e.scaled_score || 0), 0) / completedExams.length
          : 0
        const passRate = completedExams.length > 0
          ? (passedExams.length / completedExams.length) * 100
          : 0

        // Calculate area performance
        const areaPerformance: Record<ENAMEDArea, { attempts: number; avgScore: number; totalScore: number }> = {
          clinica_medica: { attempts: 0, avgScore: 0, totalScore: 0 },
          cirurgia: { attempts: 0, avgScore: 0, totalScore: 0 },
          ginecologia_obstetricia: { attempts: 0, avgScore: 0, totalScore: 0 },
          pediatria: { attempts: 0, avgScore: 0, totalScore: 0 },
          saude_coletiva: { attempts: 0, avgScore: 0, totalScore: 0 },
        }

        completedExams.forEach((exam: ExamAttemptRow) => {
          if (exam.area_breakdown) {
            Object.entries(exam.area_breakdown).forEach(([area, data]: [string, { correct: number; total: number }]) => {
              const areaKey = area as ENAMEDArea
              if (areaPerformance[areaKey] && data.total > 0) {
                const score = (data.correct / data.total) * 100
                areaPerformance[areaKey].attempts++
                areaPerformance[areaKey].totalScore += score
              }
            })
          }
        })

        // Calculate averages
        Object.keys(areaPerformance).forEach(area => {
          const areaKey = area as ENAMEDArea
          if (areaPerformance[areaKey].attempts > 0) {
            areaPerformance[areaKey].avgScore =
              areaPerformance[areaKey].totalScore / areaPerformance[areaKey].attempts
          }
        })

        // Process recent activity by day
        const activityByDay = new Map<string, { examsTaken: number; newUsers: Set<string> }>()
        const recentActivity = (recentActivityResult.data || []) as RecentActivityRow[]

        recentActivity.forEach((exam: RecentActivityRow) => {
          const date = exam.completed_at.split('T')[0]
          if (!activityByDay.has(date)) {
            activityByDay.set(date, { examsTaken: 0, newUsers: new Set() })
          }
          const day = activityByDay.get(date)!
          day.examsTaken++
        })

        // Add new users to activity
        students.forEach((student: ProfileRow) => {
          const date = student.created_at.split('T')[0]
          if (activityByDay.has(date)) {
            activityByDay.get(date)!.newUsers.add(student.id)
          }
        })

        const recentActivityArray = Array.from(activityByDay.entries())
          .map(([date, data]) => ({
            date,
            examsTaken: data.examsTaken,
            newUsers: data.newUsers.size,
          }))
          .sort((a, b) => b.date.localeCompare(a.date))

        // Question stats
        const pendingQuestions = questions.filter((q: QuestionRow) => q.status === 'pending_review').length
        const totalQuestions = questions.filter((q: QuestionRow) => q.status === 'approved').length

        setStats({
          totalStudents: students.length,
          activeStudentsLast7Days: activeStudentIds.size,
          totalExams: exams.length,
          averageScore: Math.round(avgScore),
          passRate: Math.round(passRate),
          totalQuestions,
          pendingQuestions,
          areaPerformance: Object.fromEntries(
            Object.entries(areaPerformance).map(([k, v]) => [k, { attempts: v.attempts, avgScore: Math.round(v.avgScore) }])
          ) as Record<ENAMEDArea, { attempts: number; avgScore: number }>,
          recentActivity: recentActivityArray,
        })

        setRecentStudents(studentStats.slice(0, 10))

      } catch (err) {
        console.error('Error loading dashboard:', err)
        setError('Erro ao carregar dados do painel.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
            <p className="text-slate-400 text-sm mt-1">
              Visão geral da plataforma Darwin Education
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/students">
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Alunos
              </Button>
            </Link>
            <Link href="/admin/validacao">
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Validar Questões
              </Button>
            </Link>
            <Link href="/admin/custos">
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Custos
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total de Alunos"
            value={stats.totalStudents}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            color="text-blue-400"
            subtitle={`${stats.activeStudentsLast7Days} ativos (7d)`}
          />
          <MetricCard
            label="Simulados Realizados"
            value={stats.totalExams}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="text-purple-400"
            subtitle={`${stats.passRate}% aprovação`}
          />
          <MetricCard
            label="Pontuação Média"
            value={stats.averageScore}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color={stats.averageScore >= 600 ? 'text-emerald-400' : 'text-yellow-400'}
            subtitle={stats.averageScore >= 600 ? 'Acima do corte' : 'Abaixo do corte'}
          />
          <MetricCard
            label="Questões no Banco"
            value={stats.totalQuestions}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="text-cyan-400"
            subtitle={stats.pendingQuestions > 0 ? `${stats.pendingQuestions} pendentes` : 'Todas validadas'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Area Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Área</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.areaPerformance).map(([area, data]) => (
                  <div key={area} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{AREA_NAMES[area as ENAMEDArea]}</span>
                      <span className={data.avgScore >= 60 ? 'text-emerald-400' : 'text-red-400'}>
                        {data.avgScore}% ({data.attempts} tentativas)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${data.avgScore >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(data.avgScore, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente (7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Nenhuma atividade nos últimos 7 dias
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                    >
                      <span className="text-sm text-slate-300">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-purple-400">
                          {day.examsTaken} simulados
                        </span>
                        {day.newUsers > 0 && (
                          <span className="text-blue-400">
                            +{day.newUsers} novos
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alunos Recentes</CardTitle>
            <Link href="/admin/students">
              <Button variant="ghost" size="sm">
                Ver todos
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                Nenhum aluno cadastrado ainda
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 pr-4 text-slate-400 font-medium">Aluno</th>
                      <th className="text-center py-2 px-4 text-slate-400 font-medium">Simulados</th>
                      <th className="text-center py-2 px-4 text-slate-400 font-medium">Média</th>
                      <th className="text-center py-2 px-4 text-slate-400 font-medium">XP</th>
                      <th className="text-right py-2 pl-4 text-slate-400 font-medium">Último Acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                        <td className="py-3 pr-4">
                          <div>
                            <p className="text-white font-medium">
                              {student.full_name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {student.total_exams}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {student.avg_score !== null ? (
                            <span className={student.avg_score >= 600 ? 'text-emerald-400' : 'text-red-400'}>
                              {Math.round(student.avg_score)}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-yellow-400">
                          {student.xp || 0}
                        </td>
                        <td className="py-3 pl-4 text-right text-slate-400 text-xs">
                          {student.last_exam_at
                            ? new Date(student.last_exam_at).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/validacao">
            <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Validar Questões</h3>
                    <p className="text-sm text-slate-400">
                      {stats.pendingQuestions} questões pendentes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/students">
            <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Gerenciar Alunos</h3>
                    <p className="text-sm text-slate-400">
                      Códigos de acesso e progresso
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/custos">
            <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Monitorar Custos</h3>
                    <p className="text-sm text-slate-400">
                      Uso de IA e tokens
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`${color} opacity-60`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
