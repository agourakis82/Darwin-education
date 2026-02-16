'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Scan } from 'lucide-react'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { useCIPImageStore } from '@/lib/stores/cipImageStore'
import {
  ImageCaseViewer,
  ImageCaseResults,
  AchievementToast,
  type Achievement,
} from '../../../components'
import { Button } from '@/components/ui/Button'
import type {
  CIPImageCase,
  CIPImageScore,
  ImageOption,
  ImageModality,
  IRTParameters,
  DifficultyLevel,
  ImageStepResult,
} from '@darwin-education/shared'
import { IMAGE_STEP_LABELS_PT, IMAGE_SCORING_WEIGHTS } from '@darwin-education/shared'

// Database row type
interface ImageCaseRow {
  id: string
  title_pt: string
  title_en?: string
  clinical_context_pt: string
  clinical_context_en?: string
  modality: string
  image_description_pt: string
  image_description_en?: string
  ascii_art?: string
  image_url?: string
  area: string
  subspecialty?: string
  difficulty: string
  correct_findings: string[]
  correct_diagnosis: string
  correct_next_step: string
  modality_options: ImageOption[]
  findings_options: ImageOption[]
  diagnosis_options: ImageOption[]
  next_step_options: ImageOption[]
  explanation_pt?: string
  explanation_en?: string
  image_attribution?: string
  structured_explanation?: any
  irt_difficulty: number
  irt_discrimination: number
  irt_guessing: number
  is_public: boolean
  is_ai_generated: boolean
  validated_by?: string
  times_attempted: number
  times_completed: number
  avg_score?: number
  created_at: string
  updated_at: string
}

function rowToCase(row: ImageCaseRow): CIPImageCase {
  return {
    id: row.id,
    titlePt: row.title_pt,
    titleEn: row.title_en,
    clinicalContextPt: row.clinical_context_pt,
    clinicalContextEn: row.clinical_context_en,
    modality: row.modality as ImageModality,
    imageDescriptionPt: row.image_description_pt,
    imageDescriptionEn: row.image_description_en,
    asciiArt: row.ascii_art,
    imageUrl: row.image_url,
    area: row.area as any,
    subspecialty: row.subspecialty,
    difficulty: row.difficulty as DifficultyLevel,
    correctFindings: row.correct_findings || [],
    correctDiagnosis: row.correct_diagnosis,
    correctNextStep: row.correct_next_step,
    modalityOptions: row.modality_options || [],
    findingsOptions: row.findings_options || [],
    diagnosisOptions: row.diagnosis_options || [],
    nextStepOptions: row.next_step_options || [],
    explanationPt: row.explanation_pt,
    explanationEn: row.explanation_en,
    imageAttribution: row.image_attribution,
    structuredExplanation: row.structured_explanation || undefined,
    irt: {
      difficulty: row.irt_difficulty || 0,
      discrimination: row.irt_discrimination || 1.2,
      guessing: row.irt_guessing || 0.25,
    } as IRTParameters,
    isPublic: row.is_public,
    isAIGenerated: row.is_ai_generated || false,
    validatedBy: row.validated_by as any,
    timesAttempted: row.times_attempted || 0,
    timesCompleted: row.times_completed || 0,
    avgScore: row.avg_score ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function celebrateScore(score: CIPImageScore) {
  if (score.percentageCorrect >= 90) {
    // Near-perfect
    const count = 200
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 }
    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }
    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FFD700', '#FFA500'] })
    fire(0.2, { spread: 60, colors: ['#FFD700', '#FFA500'] })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#FFD700', '#FFA500'] })
  } else if (score.passed) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      zIndex: 9999,
    })
  }
}

export default function ImageResultPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.caseId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedScore, setLoadedScore] = useState<CIPImageScore | null>(null)
  const [loadedCase, setLoadedCase] = useState<CIPImageCase | null>(null)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  const { currentCase, result, isSubmitted, resetCase } = useCIPImageStore()

  useEffect(() => {
    async function loadResult() {
      // Use store result if available
      if (isSubmitted && result && currentCase?.id === caseId) {
        setLoadedScore(result)
        setLoadedCase(currentCase)
        setLoading(false)
        setTimeout(() => celebrateScore(result), 500)
        return
      }

      // Otherwise load from database
      const supabase = createClient()

      const user = await getSessionUserSummary(supabase)
      if (!user) {
        router.push('/login?redirectTo=/cip/interpretacao/' + caseId + '/result')
        return
      }

      // Fetch most recent completed attempt
      const { data: attemptRaw, error: attemptError } = await supabase
        .from('cip_image_attempts')
        .select('*')
        .eq('case_id', caseId)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const attempt = attemptRaw as any

      if (attemptError || !attempt) {
        setError('Resultado não encontrado')
        setLoading(false)
        return
      }

      // Fetch case data
      const { data: caseRowRaw, error: caseError } = await supabase
        .from('cip_image_cases')
        .select('*')
        .eq('id', caseId)
        .maybeSingle()

      const caseRow = caseRowRaw as ImageCaseRow | null

      if (caseError || !caseRow) {
        setError('Caso não encontrado')
        setLoading(false)
        return
      }

      const imageCase = rowToCase(caseRow)

      // Build score from attempt data
      const stepResults: ImageStepResult[] = [
        {
          step: 'modality',
          label: IMAGE_STEP_LABELS_PT.modality,
          correct: attempt.modality_correct || false,
          selectedAnswer: attempt.selected_modality || '',
          correctAnswer: imageCase.modality,
          weight: IMAGE_SCORING_WEIGHTS.modality,
          weightedScore: attempt.modality_correct
            ? IMAGE_SCORING_WEIGHTS.modality
            : 0,
        },
        {
          step: 'findings',
          label: IMAGE_STEP_LABELS_PT.findings,
          correct:
            (attempt.findings_correct_count || 0) ===
            (attempt.findings_total_count || 0),
          partialCredit:
            (attempt.findings_total_count || 0) > 0
              ? (attempt.findings_correct_count || 0) /
                (attempt.findings_total_count || 1)
              : 0,
          selectedAnswer: attempt.selected_findings || [],
          correctAnswer: imageCase.correctFindings,
          weight: IMAGE_SCORING_WEIGHTS.findings,
          weightedScore:
            ((attempt.findings_total_count || 0) > 0
              ? (attempt.findings_correct_count || 0) /
                (attempt.findings_total_count || 1)
              : 0) * IMAGE_SCORING_WEIGHTS.findings,
        },
        {
          step: 'diagnosis',
          label: IMAGE_STEP_LABELS_PT.diagnosis,
          correct: attempt.diagnosis_correct || false,
          selectedAnswer: attempt.selected_diagnosis || '',
          correctAnswer: imageCase.correctDiagnosis,
          weight: IMAGE_SCORING_WEIGHTS.diagnosis,
          weightedScore: attempt.diagnosis_correct
            ? IMAGE_SCORING_WEIGHTS.diagnosis
            : 0,
        },
        {
          step: 'next_step',
          label: IMAGE_STEP_LABELS_PT.next_step,
          correct: attempt.next_step_correct || false,
          selectedAnswer: attempt.selected_next_step || '',
          correctAnswer: imageCase.correctNextStep,
          weight: IMAGE_SCORING_WEIGHTS.next_step,
          weightedScore: attempt.next_step_correct
            ? IMAGE_SCORING_WEIGHTS.next_step
            : 0,
        },
      ]

      const totalScore = stepResults.reduce(
        (sum, r) => sum + r.weightedScore,
        0
      )

      const score: CIPImageScore = {
        theta: attempt.theta || 0,
        standardError: attempt.standard_error || 0.5,
        scaledScore: attempt.scaled_score || 0,
        passThreshold: 600,
        passed: (attempt.scaled_score || 0) >= 600,
        totalScore,
        percentageCorrect: totalScore * 100,
        stepResults,
        insights: [],
      }

      setLoadedScore(score)
      setLoadedCase(imageCase)

      // Check for achievements
      try {
        const { data: newAchievementsData } = await supabase
          .from('user_cip_achievements')
          .select(`
            achievement_id,
            unlocked_at,
            cip_achievements (
              id,
              title_pt,
              description_pt,
              icon,
              tier,
              xp_reward
            )
          `)
          .eq('user_id', user.id)
          .eq('related_attempt_id', attempt.id)
          .order('unlocked_at', { ascending: true })

        if (newAchievementsData && newAchievementsData.length > 0) {
          const achievements: Achievement[] = newAchievementsData
            .filter((ua: any) => ua.cip_achievements)
            .map((ua: any) => ({
              id: ua.cip_achievements.id,
              title_pt: ua.cip_achievements.title_pt,
              description_pt: ua.cip_achievements.description_pt,
              icon: ua.cip_achievements.icon,
              tier: ua.cip_achievements.tier,
              xp_reward: ua.cip_achievements.xp_reward,
              is_unlocked: true,
              unlocked_at: ua.unlocked_at,
            }))

          setNewAchievements(achievements)
        }
      } catch (err) {
        console.error('Error checking achievements:', err)
      }

      setLoading(false)
      setTimeout(() => celebrateScore(score), 500)
    }

    loadResult()
  }, [caseId, router, currentCase, result, isSubmitted])

  const handleRetry = () => {
    resetCase()
    router.push(`/cip/interpretacao/${caseId}`)
  }

  const handleBackToList = () => {
    resetCase()
    router.push('/cip/interpretacao')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando resultado...</p>
        </div>
      </div>
    )
  }

  if (error || !loadedScore) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Resultado não encontrado'}</p>
          <Button onClick={() => router.push('/cip/interpretacao')}>Voltar</Button>
        </div>
      </div>
    )
  }

  const displayCase = loadedCase || currentCase

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Scan className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-label-primary">Resultado</h1>
          </div>
          {displayCase && (
            <p className="text-label-secondary">{displayCase.titlePt}</p>
          )}
        </div>

        {/* Image Review */}
        {displayCase && (
          <ImageCaseViewer imageCase={displayCase} showDescription={true} />
        )}

        {/* Results */}
        {displayCase && (
          <ImageCaseResults score={loadedScore} imageCase={displayCase} />
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={handleBackToList} fullWidth>
            Voltar à Lista
          </Button>
          <Button variant="primary" onClick={handleRetry} fullWidth>
            Tentar Novamente
          </Button>
        </div>
      </div>

      {/* Achievement Toast */}
      {newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onClose={() => setNewAchievements([])}
        />
      )}
    </div>
  )
}
