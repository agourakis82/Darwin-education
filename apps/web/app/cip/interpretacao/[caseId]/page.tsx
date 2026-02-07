'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  useCIPImageStore,
  selectCanAdvance,
  selectIsLastStep,
  selectIsFirstStep,
} from '@/lib/stores/cipImageStore'
import {
  ImageCaseViewer,
  ImageStepIndicator,
  ImageStepContent,
} from '../../components'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type {
  CIPImageCase,
  ImageOption,
  ImageModality,
  IRTParameters,
  DifficultyLevel,
} from '@darwin-education/shared'
import {
  IMAGE_MODALITY_LABELS_PT,
  ALL_IMAGE_MODALITIES,
  calculateImageScore,
} from '@darwin-education/shared'

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

export default function ImageCasePage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.caseId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    currentCase,
    currentStep,
    selectedModality,
    selectedFindings,
    selectedDiagnosis,
    selectedNextStep,
    isSubmitted,
    startCase,
    selectModality,
    toggleFinding,
    selectDiagnosis,
    selectNextStep,
    advanceStep,
    goBackStep,
    submitCase,
    resetCase,
  } = useCIPImageStore()

  const state = useCIPImageStore()
  const canAdvance = selectCanAdvance(state)
  const isLastStep = selectIsLastStep(state)
  const isFirstStep = selectIsFirstStep(state)

  useEffect(() => {
    async function loadCase() {
      const supabase = createClient()

      // Check auth
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/cip/interpretacao/' + caseId)
        return
      }

      // Fetch case
      const { data: caseRowRaw, error: caseError } = await supabase
        .from('cip_image_cases')
        .select('*')
        .eq('id', caseId)
        .single()

      const caseRow = caseRowRaw as ImageCaseRow | null

      if (caseError || !caseRow) {
        setError('Caso não encontrado')
        setLoading(false)
        return
      }

      const imageCase = rowToCase(caseRow)

      // Check for existing attempt or create new one
      const { data: existingAttemptRaw } = await supabase
        .from('cip_image_attempts')
        .select('id')
        .eq('case_id', caseId)
        .eq('user_id', user.id)
        .is('completed_at', null)
        .single()

      const existingAttempt = existingAttemptRaw as { id: string } | null

      let attemptId: string

      if (existingAttempt) {
        attemptId = existingAttempt.id
      } else {
        const { data: newAttemptRaw, error: attemptError } = await supabase
          .from('cip_image_attempts')
          .insert([
            {
              case_id: caseId,
              user_id: user.id,
              current_step: 'modality',
            },
          ] as unknown as never[])
          .select('id')
          .single()

        const newAttempt = newAttemptRaw as { id: string } | null

        if (attemptError || !newAttempt) {
          setError('Erro ao iniciar caso')
          setLoading(false)
          return
        }

        attemptId = newAttempt.id
      }

      startCase(imageCase, attemptId)
      setLoading(false)
    }

    // Reset if navigating to a different case
    if (currentCase && currentCase.id !== caseId) {
      resetCase()
    }

    if (!currentCase || currentCase.id !== caseId) {
      loadCase()
    } else {
      setLoading(false)
    }
  }, [caseId, router, startCase, resetCase, currentCase])

  const handleSubmit = async () => {
    if (!currentCase) return

    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const storeState = useCIPImageStore.getState()

      // Build attempt for scoring
      const attempt = {
        id: storeState.attemptId || '',
        caseId: currentCase.id,
        userId: user.id,
        selectedModality: storeState.selectedModality,
        selectedFindings: storeState.selectedFindings,
        selectedDiagnosis: storeState.selectedDiagnosis,
        selectedNextStep: storeState.selectedNextStep,
        modalityCorrect: null,
        findingsCorrectCount: null,
        findingsTotalCount: null,
        diagnosisCorrect: null,
        nextStepCorrect: null,
        totalScore: null,
        scaledScore: null,
        theta: null,
        standardError: null,
        totalTimeSeconds: null,
        stepTimes: storeState.stepTimes as any,
        currentStep: 'completed' as const,
        startedAt: storeState.startedAt || new Date(),
        completedAt: new Date(),
      }

      // Calculate score
      const score = calculateImageScore(currentCase, attempt)

      // Determine per-step correctness
      const modalityCorrect =
        storeState.selectedModality === currentCase.modality
      const correctFindingIds = new Set(
        currentCase.findingsOptions.filter((o) => o.isCorrect).map((o) => o.id)
      )
      const findingsCorrectCount = storeState.selectedFindings.filter((id) =>
        correctFindingIds.has(id)
      ).length
      const diagnosisCorrect =
        storeState.selectedDiagnosis === currentCase.correctDiagnosis
      const nextStepCorrect =
        storeState.selectedNextStep === currentCase.correctNextStep

      // Save to database
      const attemptId = storeState.attemptId
      await supabase
        .from('cip_image_attempts')
        .update({
          selected_modality: storeState.selectedModality,
          selected_findings: storeState.selectedFindings,
          selected_diagnosis: storeState.selectedDiagnosis,
          selected_next_step: storeState.selectedNextStep,
          modality_correct: modalityCorrect,
          findings_correct_count: findingsCorrectCount,
          findings_total_count: correctFindingIds.size,
          diagnosis_correct: diagnosisCorrect,
          next_step_correct: nextStepCorrect,
          total_score: score.totalScore,
          scaled_score: score.scaledScore,
          theta: score.theta,
          standard_error: score.standardError,
          total_time_seconds: storeState.totalTimeSeconds,
          step_times: storeState.stepTimes,
          current_step: 'completed',
          completed_at: new Date().toISOString(),
        } as unknown as never)
        .eq('id', attemptId as unknown as {})

      submitCase(score)
      router.push(`/cip/interpretacao/${caseId}/result`)
    } catch (err) {
      console.error('Error submitting case:', err)
      setError('Erro ao enviar caso')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando caso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/cip/interpretacao')}>Voltar</Button>
        </div>
      </div>
    )
  }

  if (!currentCase) return null

  // Get current step options
  const stepOptionsMap = {
    modality: currentCase.modalityOptions.length > 0
      ? currentCase.modalityOptions
      : ALL_IMAGE_MODALITIES.map((m) => ({
          id: m,
          textPt: IMAGE_MODALITY_LABELS_PT[m],
          isCorrect: m === currentCase.modality,
        })),
    findings: currentCase.findingsOptions,
    diagnosis: currentCase.diagnosisOptions,
    next_step: currentCase.nextStepOptions,
  }

  const currentOptions =
    stepOptionsMap[currentStep as keyof typeof stepOptionsMap] || []

  const selectedValueMap: Record<string, string | null> = {
    modality: selectedModality,
    diagnosis: selectedDiagnosis,
    next_step: selectedNextStep,
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface-1 border-b border-separator">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🩻</span>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {currentCase.titlePt}
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetCase()
                router.push('/cip/interpretacao')
              }}
            >
              Sair
            </Button>
          </div>
          <ImageStepIndicator currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image Viewer */}
          <ImageCaseViewer imageCase={currentCase} />

          {/* Right: Step Content */}
          <div className="space-y-4">
            <ImageStepContent
              step={currentStep}
              options={currentOptions}
              selectedValue={selectedValueMap[currentStep] || null}
              selectedValues={currentStep === 'findings' ? selectedFindings : []}
              onSelect={(id) => {
                if (currentStep === 'modality') selectModality(id)
                else if (currentStep === 'diagnosis') selectDiagnosis(id)
                else if (currentStep === 'next_step') selectNextStep(id)
              }}
              onToggle={toggleFinding}
            />

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={goBackStep}
                  fullWidth
                >
                  Voltar
                </Button>
              )}

              {isLastStep ? (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!canAdvance || submitting}
                  loading={submitting}
                  fullWidth
                >
                  Finalizar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={advanceStep}
                  disabled={!canAdvance}
                  fullWidth
                >
                  Próximo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hint Card */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-label-primary">
                <p>
                  Leia atentamente o contexto clínico e a descrição do exame de imagem.
                  Siga a abordagem sistemática: identifique a modalidade, os achados,
                  formule o diagnóstico e proponha a conduta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
