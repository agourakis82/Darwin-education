'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { AreaFilter } from './components/AreaFilter'
import { DifficultyFilter } from './components/DifficultyFilter'
import { QuestionCount } from './components/QuestionCount'
import { AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea, DifficultyLevel } from '@darwin-education/shared'

interface QuestionStats {
  total: number
  byArea: Record<ENAMEDArea, number>
  byDifficulty: Record<DifficultyLevel, number>
}

export default function MontarProvaPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [selectedAreas, setSelectedAreas] = useState<ENAMEDArea[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([])
  const [questionCount, setQuestionCount] = useState(20)
  const [timeLimit, setTimeLimit] = useState(60)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [availableQuestions, setAvailableQuestions] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    calculateAvailableQuestions()
  }, [selectedAreas, selectedDifficulties, stats])

  async function loadStats() {
    const supabase = createClient()

    const { data: questions } = await (supabase
      .from('questions') as any)
      .select('id, area, difficulty')

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

    setLoading(false)
  }

  function calculateAvailableQuestions() {
    if (!stats) return

    const supabase = createClient()

    // Calculate based on filters
    // If no filters selected, all questions are available
    if (selectedAreas.length === 0 && selectedDifficulties.length === 0) {
      setAvailableQuestions(stats.total)
      return
    }

    // This is a simplified calculation
    // In reality, we'd need to query the intersection
    let available = stats.total

    if (selectedAreas.length > 0) {
      available = selectedAreas.reduce((sum, area) => sum + stats.byArea[area], 0)
    }

    // Rough estimate for difficulty filter
    if (selectedDifficulties.length > 0 && selectedAreas.length === 0) {
      available = selectedDifficulties.reduce((sum, diff) => sum + stats.byDifficulty[diff], 0)
    }

    setAvailableQuestions(available)
  }

  async function handleCreate() {
    if (!title.trim()) {
      alert('Por favor, insira um título para o simulado')
      return
    }

    if (questionCount > availableQuestions) {
      alert(`Apenas ${availableQuestions} questões disponíveis com os filtros selecionados`)
      return
    }

    setCreating(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

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
        alert('Não há questões suficientes com os filtros selecionados')
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
        alert('Erro ao criar o simulado')
        setCreating(false)
        return
      }

      // Navigate to the new exam
      router.push(`/simulado/${exam.id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Erro ao criar o simulado')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white">
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
                  max={Math.min(availableQuestions, 180)}
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
                  Recomendado: {Math.round(questionCount * 3)} min ({questionCount} x 3 min/questão)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary & Create */}
          <Card className="bg-gradient-to-r from-emerald-900/30 to-surface-1 border-emerald-800/50">
            <CardContent className="py-6">
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
                    O Exame Nacional de Medicina (ENAMED) possui 180 questões, distribuídas em 5 áreas
                    com tempo total de 5 horas. O ponto de corte para aprovação é calculado usando TRI
                    (Teoria de Resposta ao Item) e geralmente corresponde a uma pontuação normalizada
                    de 600 ou mais em uma escala de 0-1000.
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
