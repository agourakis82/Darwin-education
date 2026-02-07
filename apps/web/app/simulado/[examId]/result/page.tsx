'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
      const { data: { user } } = await supabase.auth.getUser()

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
        totalQuestions: attempt.exams?.question_count || 0,
        areaBreakdown: attempt.area_breakdown,
        timeSpent: attempt.total_time_seconds,
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
    // TODO: Implement review mode
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
    return null
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Resultado do Simulado</h1>
          <p className="text-label-secondary">{examTitle}</p>
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
              <h3 className="text-lg font-semibold text-white mb-4">Estatísticas de Tempo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-label-secondary text-sm">Tempo total</div>
                  <div className="text-xl font-semibold text-white">
                    {Math.floor(result.timeSpent / 3600)}h {Math.floor((result.timeSpent % 3600) / 60)}min
                  </div>
                </div>
                <div>
                  <div className="text-label-secondary text-sm">Média por questão</div>
                  <div className="text-xl font-semibold text-white">
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
                  <h4 className="font-semibold text-white mb-1">Melhore seu desempenho</h4>
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
