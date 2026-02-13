'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FeatureState } from '@/components/ui/FeatureState'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { AreaFilter } from './components/AreaFilter'
import { DifficultyFilter } from './components/DifficultyFilter'
import { QuestionCount } from './components/QuestionCount'
import { AREA_LABELS } from '@/lib/area-colors'
import { useToast } from '@/lib/hooks/useToast'
import type { ENAMEDArea, DifficultyLevel } from '@darwin-education/shared'

interface QuestionStats {
  total: number
  byArea: Record<ENAMEDArea, number>
  byDifficulty: Record<DifficultyLevel, number>
}

interface ExamReference {
  id: string
  title: string
  questionCount: number
  timeLimitMinutes: number
}

export default function MontarProvaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { error: toastError } = useToast()

  // Read presets from query params (e.g., ?count=20&time=60)
  const presetCount = searchParams.get('count')
  const presetTime = searchParams.get('time')

  const [title, setTitle] = useState(
    presetCount === '100' ? 'Simulado Completo ENAMED' :
    presetCount ? 'Simulado Rápido' : ''
  )
  const [selectedAreas, setSelectedAreas] = useState<ENAMEDArea[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([])
  const [questionCount, setQuestionCount] = useState(presetCount ? Number(presetCount) : 20)
  const [timeLimit, setTimeLimit] = useState(presetTime ? Number(presetTime) : 60)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [availableQuestions, setAvailableQuestions] = useState(0)
  const [referenceExam, setReferenceExam] = useState<ExamReference | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    void calculateAvailableQuestions()
  }, [selectedAreas, selectedDifficulties, stats])

  useEffect(() => {
    if (availableQuestions <= 0) return
    setQuestionCount((previous) => Math.min(Math.max(previous, 5), availableQuestions))
  }, [availableQuestions])

  const minutesPerQuestion = referenceExam && referenceExam.questionCount > 0
    ? referenceExam.timeLimitMinutes / referenceExam.questionCount
    : 3

  async function loadStats() {
    setStatsError(null)
    const supabase = createClient()
    try {
      const [{ data: questions, error }, { data: examsData }] = await Promise.all([
        (supabase
          .from('questions') as any)
          .select('id, area, difficulty'),
        (supabase
          .from('exams') as any)
          .select('id, title, question_count, time_limit_minutes, type, is_public')
          .eq('is_public', true)
          .gt('question_count', 0)
          .gt('time_limit_minutes', 0),
      ])

      if (error) {
        setStatsError('Não foi possível carregar o banco de questões agora.')
        setLoading(false)
        return
      }

      if (questions) {
        const statsByArea = (Object.keys(AREA_LABELS) as ENAMEDArea[]).reduce((acc, area) => {
          acc[area] = questions.filter((q: any) => q.area === area).length
          return acc
        }, {} as Record<ENAMEDArea, number>)

        const difficulties: DifficultyLevel[] = ['muito_facil', 'facil', 'medio', 'dificil', 'muito_dificil']
        const statsByDifficulty = difficulties.reduce((acc, diff) => {
          acc[diff] = questions.filter((q: any) => q.difficulty === diff).length
          return acc
        }, {} as Record<DifficultyLevel, number>)

        setStats({
          total: questions.length,
          byArea: statsByArea,
          byDifficulty: statsByDifficulty,
        })
      }

      const publicExams = (examsData || []).filter(
        (exam: any) =>
          typeof exam.question_count === 'number' &&
          exam.question_count > 0 &&
          typeof exam.time_limit_minutes === 'number' &&
          exam.time_limit_minutes > 0
      )

      if (publicExams.length > 0) {
        const sorted = [...publicExams].sort((left: any, right: any) => right.question_count - left.question_count)
        const official = sorted.find((exam: any) => exam.type === 'official_simulation')
        const selected = official || sorted[0]

        setReferenceExam({
          id: selected.id,
          title: selected.title || 'Prova de referência',
          questionCount: selected.question_count,
          timeLimitMinutes: selected.time_limit_minutes,
        })
      } else {
        setReferenceExam(null)
      }
    } catch {
      setStatsError('Erro inesperado ao carregar dados de questões.')
    } finally {
      setLoading(false)
    }
  }

  async function calculateAvailableQuestions() {
    if (!stats) return

    const supabase = createClient()
    let query = (supabase.from('questions') as any).select('id', { count: 'exact', head: true })

    if (selectedAreas.length > 0) {
      query = query.in('area', selectedAreas)
    }

    if (selectedDifficulties.length > 0) {
      query = query.in('difficulty', selectedDifficulties)
    }

    const { count, error } = await query
    if (error) {
      setAvailableQuestions(0)
      return
    }

    setAvailableQuestions(count || 0)
  }

  async function handleCreate() {
    setCreateError(null)

    if (!title.trim()) {
      const message = 'Por favor, insira um título para o simulado.'
      setCreateError(message)
      toastError(message)
      return
    }

    if (questionCount > availableQuestions) {
      const message = `Apenas ${availableQuestions} questões disponíveis com os filtros selecionados.`
      setCreateError(message)
      toastError(message)
      return
    }

    setCreating(true)

    try {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login')
        return
      }

      // Build query for questions
      let query = (supabase.from('questions') as any).select('id')

      if (selectedAreas.length > 0) {
        query = query.in('area', selectedAreas)
      }

      if (selectedDifficulties.length > 0) {
        query = query.in('difficulty', selectedDifficulties)
      }

      const { data: questions } = await query

      if (!questions || questions.length < questionCount) {
        const message = 'Não há questões suficientes com os filtros selecionados.'
        setCreateError(message)
        toastError(message)
        setCreating(false)
        return
      }

      // Randomly select questions
      const shuffled = [...questions].sort(() => Math.random() - 0.5)
      const selectedQuestions = shuffled.slice(0, questionCount).map((q: any) => q.id)

      // Create the exam
      const { data: exam, error } = await (supabase
        .from('exams') as any)
        .insert({
          title: title.trim(),
          description: `Simulado personalizado com ${questionCount} questões`,
          question_count: questionCount,
          time_limit_minutes: timeLimit,
          question_ids: selectedQuestions,
          type: 'custom',
          created_by: user.id,
          is_public: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating exam:', error)
        const message = 'Erro ao criar o simulado. Revise os filtros e tente novamente.'
        setCreateError(message)
        toastError(message)
        setCreating(false)
        return
      }

      // Navigate to the new exam
      router.push(`/simulado/${exam.id}`)
    } catch (error) {
      console.error('Error:', error)
      const message = 'Erro ao criar o simulado. Tente novamente em instantes.'
      setCreateError(message)
      toastError(message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <FeatureState
            kind="loading"
            title="Montando seu ambiente de prova"
            description="Carregando disponibilidade de questões e filtros por área/dificuldade."
          />
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-surface-0 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <FeatureState
            kind="error"
            title="Falha ao carregar questões"
            description={statsError}
            action={{ label: 'Tentar novamente', onClick: () => void loadStats(), variant: 'secondary' }}
          />
        </div>
      </div>
    )
  }

  if (stats && stats.total === 0) {
    return (
      <div className="min-h-screen bg-surface-0 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <FeatureState
            kind="empty"
            title="Ainda não há questões disponíveis"
            description="Importe o conteúdo médico e as questões para habilitar a criação de simulados personalizados."
            action={{ label: 'Atualizar disponibilidade', onClick: () => void loadStats(), variant: 'secondary' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/simulado')}
              className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Montar Prova</h1>
              <p className="text-sm text-label-secondary mt-1">
                Crie um simulado personalizado
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-6 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/montar-prova-hero-apple-v1.png"
            alt="Ambiente de preparo de simulado personalizado"
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/30" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-lg">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Monte uma prova com a sua estratégia.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Combine áreas, dificuldade e tempo para um treino sob medida.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Título do Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Ex: Revisão de Clínica Médica - Cardiologia"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Areas Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Áreas do Conhecimento</CardTitle>
              <p className="text-sm text-label-secondary">
                Selecione as áreas para incluir no simulado. Deixe vazio para incluir todas.
              </p>
            </CardHeader>
            <CardContent>
              <AreaFilter
                selected={selectedAreas}
                onChange={setSelectedAreas}
                stats={stats?.byArea}
              />
            </CardContent>
          </Card>

          {/* Difficulty Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Nível de Dificuldade</CardTitle>
              <p className="text-sm text-label-secondary">
                Escolha os níveis de dificuldade. Deixe vazio para incluir todos.
              </p>
            </CardHeader>
            <CardContent>
              <DifficultyFilter
                selected={selectedDifficulties}
                onChange={setSelectedDifficulties}
                stats={stats?.byDifficulty}
              />
            </CardContent>
          </Card>

          {/* Question Count & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Número de Questões</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionCount
                  value={questionCount}
                  onChange={setQuestionCount}
                  max={availableQuestions}
                  referenceQuestionCount={referenceExam?.questionCount || Math.max(availableQuestions, 1)}
                />
                <p className="text-sm text-label-secondary mt-2">
                  {availableQuestions} questões disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Limite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-label-secondary">minutos</span>
                </div>
                <p className="text-sm text-label-secondary mt-2">
                  Recomendado: {Math.round(questionCount * minutesPerQuestion)} min ({questionCount} x {minutesPerQuestion.toFixed(1)} min/questão)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary & Create */}
          <Card className="bg-gradient-to-r from-emerald-900/30 to-surface-1 border-emerald-800/50">
            <CardContent className="py-6">
              {createError && (
                <div className="mb-4 rounded-lg border border-red-700/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                  <p>{createError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleCreate}
                    disabled={creating || !title.trim() || questionCount > availableQuestions}
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Resumo</h3>
                  <ul className="mt-2 text-sm text-label-secondary space-y-1">
                    <li>{questionCount} questões</li>
                    <li>{timeLimit} minutos de duração</li>
                    <li>
                      {selectedAreas.length === 0
                        ? 'Todas as áreas'
                        : selectedAreas.map(a => AREA_LABELS[a]).join(', ')}
                    </li>
                    <li>
                      {selectedDifficulties.length === 0
                        ? 'Todas as dificuldades'
                        : `${selectedDifficulties.length} níveis selecionados`}
                    </li>
                  </ul>
                </div>
                <Button
                  size="lg"
                  onClick={handleCreate}
                  loading={creating}
                  disabled={!title.trim() || questionCount > availableQuestions}
                >
                  Criar e Iniciar Simulado
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ENAMED Info */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-label-secondary">
                  <p className="font-medium text-label-primary mb-1">Sobre o ENAMED</p>
                  <p>
                    {referenceExam
                      ? `Referência atual: ${referenceExam.title} com ${referenceExam.questionCount} questões em ${Math.round(referenceExam.timeLimitMinutes / 60)}h ${referenceExam.timeLimitMinutes % 60}min.`
                      : 'As referências de prova são carregadas dinamicamente da base pública de simulados.'}{' '}
                    A pontuação final continua baseada em TRI (Teoria de Resposta ao Item) e as regras de corte podem variar por edição.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
