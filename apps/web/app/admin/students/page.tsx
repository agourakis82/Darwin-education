'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  email: string
  full_name: string | null
  xp: number
  created_at: string
  last_exam_at: string | null
  total_exams: number
  avg_score: number | null
  passed_count: number
  current_streak: number
}

interface AccessCode {
  id: string
  code: string
  created_at: string
  expires_at: string | null
  used_at: string | null
  used_by: string | null
  max_uses: number
  use_count: number
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
  user_id: string
  scaled_score: number | null
  passed: boolean
  completed_at: string
}

interface AchievementRow {
  user_id: string
  current_streak: number
}

export default function StudentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [newCodeCount, setNewCodeCount] = useState(1)
  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'exams' | 'recent'>('recent')
  const supabase = createClient()

  const loadStudents = useCallback(async () => {
    try {
      // Get all students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, xp, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get exam attempts
      const { data: exams, error: examsError } = await supabase
        .from('exam_attempts')
        .select('user_id, scaled_score, passed, completed_at')

      if (examsError) throw examsError

      // Get streaks
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('user_id, current_streak')

      // Process students with stats
      const profilesList = (profiles || []) as ProfileRow[]
      const examsList = (exams || []) as ExamAttemptRow[]
      const achievementsList = (achievements || []) as AchievementRow[]

      const studentStats = profilesList.map((profile: ProfileRow) => {
        const studentExams = examsList.filter((e: ExamAttemptRow) => e.user_id === profile.id)
        const passedExams = studentExams.filter((e: ExamAttemptRow) => e.passed)
        const sortedExams = [...studentExams].sort((a: ExamAttemptRow, b: ExamAttemptRow) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )
        const avgScore = studentExams.length > 0
          ? studentExams.reduce((sum: number, e: ExamAttemptRow) => sum + (e.scaled_score || 0), 0) / studentExams.length
          : null
        const streak = achievementsList.find((a: AchievementRow) => a.user_id === profile.id)?.current_streak || 0

        return {
          ...profile,
          last_exam_at: sortedExams[0]?.completed_at || null,
          total_exams: studentExams.length,
          avg_score: avgScore,
          passed_count: passedExams.length,
          current_streak: streak,
        }
      })

      setStudents(studentStats)
    } catch (err) {
      console.error('Error loading students:', err)
    }
  }, [supabase])

  const loadAccessCodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Table might not exist yet
        console.log('Access codes table may not exist:', error.message)
        return
      }

      setAccessCodes(data || [])
    } catch (err) {
      console.error('Error loading access codes:', err)
    }
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      await Promise.all([loadStudents(), loadAccessCodes()])
      setLoading(false)
    }

    init()
  }, [router, supabase, loadStudents, loadAccessCodes])

  const generateAccessCodes = async () => {
    setGeneratingCodes(true)
    try {
      const codes: string[] = []
      for (let i = 0; i < newCodeCount; i++) {
        // Generate a readable 8-character code
        const code = generateReadableCode()
        codes.push(code)
      }

      // Insert codes
      const { error } = await (supabase
        .from('access_codes') as any)
        .insert(codes.map(code => ({
          code,
          max_uses: 1,
          use_count: 0,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })))

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.message.includes('does not exist')) {
          alert('Tabela access_codes não existe. Execute a migração do banco de dados.')
        } else {
          throw error
        }
      } else {
        await loadAccessCodes()
        setShowCodeModal(false)
        setNewCodeCount(1)
      }
    } catch (err) {
      console.error('Error generating codes:', err)
      alert('Erro ao gerar códigos de acesso')
    } finally {
      setGeneratingCodes(false)
    }
  }

  const copyCodeToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    // Could add a toast notification here
  }

  const filteredStudents = students
    .filter(s =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '')
        case 'score':
          return (b.avg_score || 0) - (a.avg_score || 0)
        case 'exams':
          return b.total_exams - a.total_exams
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando alunos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciar Alunos</h1>
              <p className="text-slate-400 text-sm mt-1">
                {students.length} alunos cadastrados
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCodeModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Gerar Códigos de Acesso
          </Button>
        </div>

        {/* Access Codes Section */}
        {accessCodes.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Códigos de Acesso Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {accessCodes.filter(c => !c.used_at && c.use_count < c.max_uses).map((code) => (
                  <button
                    key={code.id}
                    onClick={() => copyCodeToClipboard(code.code)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-mono text-emerald-400 transition-colors flex items-center gap-2"
                    title="Clique para copiar"
                  >
                    {code.code}
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                ))}
                {accessCodes.filter(c => !c.used_at && c.use_count < c.max_uses).length === 0 && (
                  <p className="text-slate-500 text-sm">Nenhum código disponível</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'recent', label: 'Recentes' },
              { key: 'name', label: 'Nome' },
              { key: 'score', label: 'Média' },
              { key: 'exams', label: 'Simulados' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key as typeof sortBy)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  sortBy === option.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-slate-500">Nenhum aluno encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Aluno</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Simulados</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Aprovações</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Média</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">Streak</th>
                      <th className="text-center py-3 px-4 text-slate-400 font-medium">XP</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Cadastro</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4">
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
                          {student.total_exams > 0 ? (
                            <span className={student.passed_count > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                              {student.passed_count}/{student.total_exams}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {student.avg_score !== null ? (
                            <span className={`font-medium ${student.avg_score >= 600 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {Math.round(student.avg_score)}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {student.current_streak > 0 ? (
                            <span className="text-orange-400">
                              🔥 {student.current_streak}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-yellow-400">
                          {student.xp || 0}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-xs">
                          {new Date(student.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detalhes do Aluno</CardTitle>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Nome</p>
                    <p className="text-white font-medium">{selectedStudent.full_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Email</p>
                    <p className="text-white">{selectedStudent.email}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Simulados</p>
                      <p className="text-xl font-bold text-purple-400">{selectedStudent.total_exams}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Aprovações</p>
                      <p className="text-xl font-bold text-emerald-400">{selectedStudent.passed_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Média</p>
                      <p className={`text-xl font-bold ${
                        selectedStudent.avg_score !== null && selectedStudent.avg_score >= 600
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}>
                        {selectedStudent.avg_score !== null ? Math.round(selectedStudent.avg_score) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">XP Total</p>
                      <p className="text-lg font-bold text-yellow-400">{selectedStudent.xp || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Streak</p>
                      <p className="text-lg font-bold text-orange-400">
                        {selectedStudent.current_streak > 0 ? `🔥 ${selectedStudent.current_streak} dias` : '0 dias'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Cadastro</p>
                      <p className="text-sm text-slate-300">
                        {new Date(selectedStudent.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Último Simulado</p>
                      <p className="text-sm text-slate-300">
                        {selectedStudent.last_exam_at
                          ? new Date(selectedStudent.last_exam_at).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generate Codes Modal */}
        {showCodeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gerar Códigos de Acesso</CardTitle>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Quantidade de códigos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCodeCount}
                      onChange={(e) => setNewCodeCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Os códigos serão válidos por 30 dias e podem ser usados uma vez cada.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCodeModal(false)}
                      fullWidth
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={generateAccessCodes}
                      disabled={generatingCodes}
                      fullWidth
                    >
                      {generatingCodes ? 'Gerando...' : 'Gerar Códigos'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Generate a readable 8-character code (uppercase letters and numbers, no confusing chars)
function generateReadableCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed I, O, 0, 1 to avoid confusion
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
