'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, Gauge } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { useFCRStore } from '@/lib/stores/fcrStore'
import { FCRResults } from '../../components/FCRResults'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type {
  FCRDetectedLacuna,
  FCRLevelResult,
  FCRScore,
} from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FCRAttemptRow {
  theta: number | null
  scaled_score: number | null
  calibration_score: number | null
  overconfidence_index: number | null
  level_results: unknown
  detected_lacunas: unknown
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function buildScoreFromAttempt(attempt: FCRAttemptRow): FCRScore {
  const levelResults = toArray<FCRLevelResult>(attempt.level_results)
  const totalScore = levelResults.reduce((sum, item) => {
    const weightedScore =
      typeof item?.weightedScore === 'number' ? item.weightedScore : 0
    return sum + weightedScore
  }, 0)
  const scaledScore = attempt.scaled_score || 0

  return {
    theta: attempt.theta || 0,
    standardError: 0.5,
    scaledScore,
    passed: scaledScore >= 600,
    totalScore,
    percentageCorrect: totalScore * 100,
    levelResults,
    calibrationScore: attempt.calibration_score || 0,
    overconfidenceIndex: attempt.overconfidence_index || 0,
    detectedLacunas: toArray<FCRDetectedLacuna>(attempt.detected_lacunas),
    insights: [],
  }
}

export default function FCRResultPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.caseId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedScore, setLoadedScore] = useState<FCRScore | null>(null)
  const [loadedTitle, setLoadedTitle] = useState('')
  const { result, currentCase, isSubmitted, resetCase } = useFCRStore()

  useEffect(() => {
    async function loadResult() {
      if (isSubmitted && result && currentCase?.id === caseId) {
        setLoadedScore(result)
        setLoadedTitle(currentCase.titlePt)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login?redirectTo=/fcr/' + caseId + '/result')
        return
      }

      const { data: attemptRaw, error: attemptError } = await (supabase
        .from('fcr_attempts') as any)
        .select(`
          theta,
          scaled_score,
          calibration_score,
          overconfidence_index,
          level_results,
          detected_lacunas
        `)
        .eq('case_id', caseId)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const attempt = attemptRaw as FCRAttemptRow | null
      if (attemptError || !attempt) {
        setError('Resultado não encontrado')
        setLoading(false)
        return
      }

      const { data: caseData } = await (supabase.from('fcr_cases') as any)
        .select('title_pt')
        .eq('id', caseId)
        .single()

      setLoadedTitle(caseData?.title_pt || 'Resultado FCR')
      setLoadedScore(buildScoreFromAttempt(attempt))
      setLoading(false)
    }

    void loadResult()
  }, [caseId, router, currentCase, result, isSubmitted])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando resultado...</p>
        </div>
      </div>
    )
  }

  if (error || !loadedScore) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-label-primary mb-2">Resultado indisponível</h2>
            <p className="text-label-secondary mb-6">
              {error || 'Não encontramos um resultado válido para este caso.'}
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/fcr')} fullWidth>
                Voltar para FCR
              </Button>
              <Button variant="outline" onClick={() => router.refresh()} fullWidth>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-violet-400" />
          <h1 className="text-xl font-bold text-label-primary">{loadedTitle}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Resultado do Raciocínio Clínico Fractal
        </p>

        {/* Results */}
        <FCRResults score={loadedScore} />

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              resetCase()
              router.push('/fcr')
            }}
          >
            Tentar Outro Caso
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push('/fcr')}
          >
            Ver Todos os Casos
          </Button>
        </div>

        {/* Calibration Dashboard CTA */}
        <Link
          href="/fcr/calibracao"
          className="mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 border border-border hover:border-violet-500/30 rounded-lg text-sm text-muted-foreground hover:text-violet-300 transition-colors"
        >
          <Gauge className="w-4 h-4" />
          Ver dashboard de calibração metacognitiva
        </Link>
      </div>
    </div>
  )
}
