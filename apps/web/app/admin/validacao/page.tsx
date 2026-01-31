'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface PendingQuestion {
  id: string
  stem: string
  options: { letter: string; text: string; feedback?: string }[]
  correct_answer: number
  explanation: string
  area: string
  topic: string | null
  difficulty: number
  discrimination: number
  guessing: number
  ai_provider: string | null
  ai_generation_cost: number | null
  status: string
  created_at: string
  created_by: string
}

type ReviewAction = 'approved' | 'rejected' | 'needs_edit'

const areaLabels: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const areaColors: Record<string, string> = {
  clinica_medica: 'bg-blue-500/20 text-blue-400',
  cirurgia: 'bg-red-500/20 text-red-400',
  ginecologia_obstetricia: 'bg-pink-500/20 text-pink-400',
  pediatria: 'bg-green-500/20 text-green-400',
  saude_coletiva: 'bg-purple-500/20 text-purple-400',
}

const statusColors: Record<string, string> = {
  pending_review: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  needs_edit: 'bg-orange-500/20 text-orange-400',
}

const statusLabels: Record<string, string> = {
  pending_review: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  needs_edit: 'Precisa edição',
}

export default function ValidacaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<PendingQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<PendingQuestion | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('pending_review')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(4)

  const loadQuestions = useCallback(async () => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      router.push('/login?redirectTo=/admin/validacao')
      return
    }

    let query = (supabase.from('questions') as any)
      .select('*')
      .eq('question_bank', 'ai_generated')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading questions:', error)
    }

    setQuestions(data || [])
    setLoading(false)
  }, [filter, router])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleReview = useCallback(async (questionId: string, action: ReviewAction) => {
    setReviewingId(questionId)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) return

      const updates: Record<string, unknown> = {
        status: action,
        validated_at: new Date().toISOString(),
        validated_by: userData.user.id,
      }

      if (score) {
        updates.validation_score = score
      }

      if (feedback) {
        updates.validation_feedback = feedback
      }

      const { error } = await (supabase.from('questions') as any)
        .update(updates)
        .eq('id', questionId)

      if (error) {
        console.error('Error reviewing question:', error)
        return
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, status: action } : q
        )
      )

      setSelectedQuestion(null)
      setFeedback('')
      setScore(4)
    } finally {
      setReviewingId(null)
    }
  }, [feedback, score])

  const letters = ['A', 'B', 'C', 'D']
  const pendingCount = questions.filter((q) => q.status === 'pending_review').length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Validação de Questões</h1>
              <p className="text-sm text-slate-400 mt-1">
                Revise questões geradas por IA antes de publicar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                {pendingCount} pendente(s)
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'pending_review' as const, label: 'Pendentes' },
            { key: 'approved' as const, label: 'Aprovadas' },
            { key: 'rejected' as const, label: 'Rejeitadas' },
            { key: 'all' as const, label: 'Todas' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key)
                setSelectedQuestion(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question List */}
          <div className="lg:col-span-1 space-y-3">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">Nenhuma questão encontrada</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((q) => (
                <Card
                  key={q.id}
                  padding="sm"
                  hover
                  onClick={() => {
                    setSelectedQuestion(q)
                    setFeedback('')
                    setScore(4)
                  }}
                  className={selectedQuestion?.id === q.id ? 'border-emerald-600' : ''}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 line-clamp-2">{q.stem}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${areaColors[q.area] || 'bg-slate-500/20 text-slate-400'}`}>
                          {areaLabels[q.area] || q.area}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[q.status] || 'bg-slate-500/20 text-slate-400'}`}>
                          {statusLabels[q.status] || q.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Question Detail */}
          <div className="lg:col-span-2">
            {selectedQuestion ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Revisão de Questão</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs rounded-full ${areaColors[selectedQuestion.area] || ''}`}>
                        {areaLabels[selectedQuestion.area] || selectedQuestion.area}
                      </span>
                      {selectedQuestion.ai_provider && (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
                          IA: {selectedQuestion.ai_provider}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Criada em {new Date(selectedQuestion.created_at).toLocaleString('pt-BR')}
                    {selectedQuestion.topic && ` - Tópico: ${selectedQuestion.topic}`}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Stem */}
                  <div className="mb-6">
                    <p className="text-white leading-relaxed">{selectedQuestion.stem}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {selectedQuestion.options?.map((option: any, index: number) => {
                      const isCorrect = index === selectedQuestion.correct_answer
                      const letter = option.letter || letters[index]

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? 'border-emerald-600 bg-emerald-900/30'
                              : 'border-slate-700 bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {letter}
                            </span>
                            <div className="flex-1">
                              <p className={`text-sm ${isCorrect ? 'text-emerald-200' : 'text-slate-300'}`}>
                                {option.text}
                              </p>
                              {option.feedback && (
                                <p className="text-xs text-slate-500 mt-1 italic">
                                  {option.feedback}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation */}
                  {selectedQuestion.explanation && (
                    <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <h4 className="text-sm font-semibold text-emerald-400 mb-2">Explicação</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {/* IRT Parameters */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                      <p className="text-xs text-slate-500 mb-1">Dificuldade (b)</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {selectedQuestion.difficulty?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                      <p className="text-xs text-slate-500 mb-1">Discriminação (a)</p>
                      <p className="text-lg font-bold text-cyan-400">
                        {selectedQuestion.discrimination?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                      <p className="text-xs text-slate-500 mb-1">Acerto casual (c)</p>
                      <p className="text-lg font-bold text-slate-300">
                        {selectedQuestion.guessing?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Review Section */}
                  {selectedQuestion.status === 'pending_review' && (
                    <div className="border-t border-slate-800 pt-6">
                      <h4 className="text-sm font-semibold text-white mb-4">Avaliação</h4>

                      {/* Quality Score */}
                      <div className="mb-4">
                        <label className="block text-sm text-slate-400 mb-2">
                          Nota de qualidade (1-5)
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setScore(s)}
                              className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                                score === s
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="mb-4">
                        <label className="block text-sm text-slate-400 mb-2">
                          Feedback (opcional)
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Comentários sobre a qualidade, precisão ou sugestões de melhoria..."
                          rows={3}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cost info */}
                  {selectedQuestion.ai_generation_cost != null && (
                    <p className="text-xs text-slate-500 mt-4">
                      Custo de geração: R$ {selectedQuestion.ai_generation_cost.toFixed(4)}
                    </p>
                  )}
                </CardContent>

                {selectedQuestion.status === 'pending_review' && (
                  <CardFooter className="flex gap-3">
                    <Button
                      variant="primary"
                      loading={reviewingId === selectedQuestion.id}
                      onClick={() => handleReview(selectedQuestion.id, 'approved')}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="secondary"
                      loading={reviewingId === selectedQuestion.id}
                      onClick={() => handleReview(selectedQuestion.id, 'needs_edit')}
                    >
                      Precisa edição
                    </Button>
                    <Button
                      variant="danger"
                      loading={reviewingId === selectedQuestion.id}
                      onClick={() => handleReview(selectedQuestion.id, 'rejected')}
                    >
                      Rejeitar
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-slate-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    Selecione uma questão
                  </h3>
                  <p className="text-sm text-slate-500">
                    Clique em uma questão da lista para revisá-la
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
