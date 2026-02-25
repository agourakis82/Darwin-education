'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Puzzle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import {
  useCIPStore,
  selectGridState,
  selectTotalCells,
  selectAnsweredCount,
} from '@/lib/stores/cipStore'
import { CIPPuzzleGrid, CIPOptionsModal, CIPTimer, CIPProgress } from '../components'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card, CardContent } from '@/components/ui/Card'
import type {
  CIPPuzzle,
  CIPSection,
  CIPDiagnosis,
  CIPFinding,
  CIPCell,
  CIPDifficultySettings,
  IRTParameters,
  DifficultyLevel,
  ENAMEDArea,
} from '@darwin-education/shared'
import { calculateCIPScore, CIP_SECTION_LABELS_PT } from '@darwin-education/shared'

// Database row types (until Supabase types are generated)
interface CIPPuzzleRow {
  id: string
  title: string
  description?: string
  areas?: string[]
  difficulty?: string
  settings?: Record<string, unknown>
  diagnosis_ids?: string[]
  options_per_section?: Record<string, string[]>
  time_limit_minutes?: number
  irt_difficulty?: number
  irt_discrimination?: number
  irt_guessing?: number
  type?: string
  is_ai_generated?: boolean
  validated_by?: string
  created_by?: string
  created_at: string
}

interface CIPDiagnosisRow {
  id: string
  name_pt: string
  name_en?: string
  icd10_code: string
  icd10_codes_secondary?: string[]
  area: string
  subspecialty?: string
  difficulty_tier?: number
  keywords?: string[]
}

interface CIPFindingRow {
  id: string
  text_pt: string
  text_en?: string
  section: string
  icd10_codes?: string[]
  atc_codes?: string[]
  tags?: string[]
  is_ai_generated?: boolean
  validated_by?: string
}

interface CIPPuzzleGridRow {
  row_index: number
  section: string
  correct_finding_id: string
  irt_difficulty?: number
}

interface CIPAttemptRow {
  id: string
  puzzle_id: string
  user_id: string
  grid_state?: Record<string, string>
  time_per_cell?: Record<string, number>
  total_time_seconds?: number
  started_at?: string
  completed_at?: string
}

export default function CIPPuzzlePage() {
  const params = useParams()
  const router = useRouter()
  const puzzleId = params.puzzleId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    currentPuzzle,
    activeCell,
    isSubmitted,
    startPuzzle,
    selectCell,
    submitPuzzle,
    resetPuzzle,
  } = useCIPStore()

  const state = useCIPStore()
  const gridState = selectGridState(state)
  const answeredCount = selectAnsweredCount(state)
  const totalCells = selectTotalCells(state)

  useEffect(() => {
    async function loadPuzzle() {
      const supabase = createClient()

      // Check user auth
      const user = await getSessionUserSummary(supabase)
      if (!user) {
        router.push('/login?redirectTo=/cip/' + puzzleId)
        return
      }

      // Fetch puzzle
      const { data: puzzleDataRaw, error: puzzleError } = await supabase
        .from('cip_puzzles')
        .select('*')
        .eq('id', puzzleId)
        .maybeSingle()

      const puzzleData = puzzleDataRaw as CIPPuzzleRow | null

      if (puzzleError || !puzzleData) {
        setError('Puzzle não encontrado')
        setLoading(false)
        return
      }

      // Fetch diagnoses for this puzzle
      const { data: diagnosesRaw, error: diagError } = await supabase
        .from('cip_diagnoses')
        .select('*')
        .in('id', puzzleData.diagnosis_ids || [])

      const diagnoses = diagnosesRaw as CIPDiagnosisRow[] | null

      if (diagError) {
        setError('Erro ao carregar diagnósticos')
        setLoading(false)
        return
      }

      // Fetch findings for all sections
      const sections = (puzzleData.settings as any)?.sections || [
        'medical_history',
        'physical_exam',
        'laboratory',
        'treatment',
      ]

      // Get all finding IDs from options_per_section
      const allFindingIds: string[] = []
      const optionsPerSection = puzzleData.options_per_section as Record<string, string[]>
      for (const section of sections) {
        if (optionsPerSection[section]) {
          allFindingIds.push(...optionsPerSection[section])
        }
      }

      const { data: findingsRaw, error: findingsError } = await supabase
        .from('cip_findings')
        .select('*')
        .in('id', allFindingIds)

      const findings = findingsRaw as CIPFindingRow[] | null

      if (findingsError) {
        setError('Erro ao carregar achados clínicos')
        setLoading(false)
        return
      }

      // Fetch grid (correct answers)
      const { data: gridDataRaw, error: gridError } = await supabase
        .from('cip_puzzle_grid')
        .select('*')
        .eq('puzzle_id', puzzleId)
        .order('row_index')

      const gridData = gridDataRaw as CIPPuzzleGridRow[] | null

      if (gridError) {
        setError('Erro ao carregar grade do puzzle')
        setLoading(false)
        return
      }

      // Transform database data to CIPPuzzle format
      const diagnosesMap = new Map(diagnoses?.map((d) => [d.id, d]) || [])
      const findingsMap = new Map(findings?.map((f) => [f.id, f]) || [])

      // Order diagnoses by puzzle order
      const orderedDiagnoses: CIPDiagnosis[] = (puzzleData.diagnosis_ids || [])
        .map((id: string) => diagnosesMap.get(id))
        .filter((d): d is CIPDiagnosisRow => Boolean(d))
        .map(
          (d): CIPDiagnosis => ({
            id: d.id,
            namePt: d.name_pt,
            nameEn: d.name_en,
            icd10Code: d.icd10_code,
            icd10CodesSecondary: d.icd10_codes_secondary || [],
            area: d.area as ENAMEDArea,
            subspecialty: d.subspecialty || '',
            findings: {} as Record<CIPSection, CIPFinding[]>,
            difficultyTier: (d.difficulty_tier || 3) as 1 | 2 | 3 | 4 | 5,
            keywords: d.keywords || [],
          })
        )

      // Build options per section with full finding data
      const optionsPerSectionFull: Record<CIPSection, CIPFinding[]> = {} as Record<
        CIPSection,
        CIPFinding[]
      >
      for (const section of sections) {
        const sectionFindingIds = optionsPerSection[section] || []
        optionsPerSectionFull[section as CIPSection] = sectionFindingIds
          .map((id: string) => findingsMap.get(id))
          .filter((f): f is CIPFindingRow => Boolean(f))
          .map(
            (f): CIPFinding => ({
              id: f.id,
              textPt: f.text_pt,
              textEn: f.text_en,
              section: f.section as CIPSection,
              icd10Codes: f.icd10_codes || [],
              atcCodes: f.atc_codes || [],
              tags: f.tags || [],
              isAIGenerated: f.is_ai_generated || false,
              validatedBy: f.validated_by as 'community' | 'expert' | 'both' | undefined,
            })
          )
      }

      // Build grid
      const grid: CIPCell[][] = []
      for (let i = 0; i < orderedDiagnoses.length; i++) {
        grid[i] = []
      }

      for (const cell of gridData || []) {
        const rowIndex = cell.row_index
        if (!grid[rowIndex]) grid[rowIndex] = []

        grid[rowIndex].push({
          row: rowIndex,
          column: cell.section as CIPSection,
          correctFindingId: cell.correct_finding_id,
          selectedFindingId: null,
          irt: cell.irt_difficulty
            ? { difficulty: cell.irt_difficulty, discrimination: 1.2, guessing: 0.1 }
            : undefined,
        })
      }

      // Sort each row by section order
      const sectionOrder = sections as CIPSection[]
      for (const row of grid) {
        row.sort(
          (a, b) => sectionOrder.indexOf(a.column) - sectionOrder.indexOf(b.column)
        )
      }

      const puzzle: CIPPuzzle = {
        id: puzzleData.id,
        title: puzzleData.title,
        description: puzzleData.description || '',
        areas: (puzzleData.areas || []) as ENAMEDArea[],
        difficulty: puzzleData.difficulty as DifficultyLevel,
        settings: (puzzleData.settings as unknown as CIPDifficultySettings) || {
          diagnosisCount: Math.min(7, Math.max(4, orderedDiagnoses.length)) as 4 | 5 | 6 | 7,
          sections: sections as CIPSection[],
          distractorCount: 3,
          allowReuse: false,
          minDistractorSimilarity: 0.3,
          maxDistractorSimilarity: 0.7,
        },
        diagnoses: orderedDiagnoses,
        grid,
        optionsPerSection: optionsPerSectionFull,
        timeLimitMinutes: puzzleData.time_limit_minutes || 30,
        irt: {
          difficulty: puzzleData.irt_difficulty || 0,
          discrimination: puzzleData.irt_discrimination || 1.2,
          guessing: puzzleData.irt_guessing || 0.1,
        } as IRTParameters,
        type: (puzzleData.type || 'practice') as 'practice' | 'exam' | 'custom',
        isAIGenerated: puzzleData.is_ai_generated || false,
        validatedBy: puzzleData.validated_by as 'community' | 'expert' | 'both' | undefined,
        createdBy: puzzleData.created_by || 'system',
        createdAt: new Date(puzzleData.created_at),
      }

      // Check for existing attempt or create new one
      const { data: existingAttemptRaw } = await supabase
        .from('cip_attempts')
        .select('*')
        .eq('puzzle_id', puzzleId)
        .eq('user_id', user.id)
        .is('completed_at', null)
        .maybeSingle()

      const existingAttempt = existingAttemptRaw as CIPAttemptRow | null

      let attemptId: string

      if (existingAttempt) {
        attemptId = existingAttempt.id
      } else {
        // Create new attempt
        const { data: newAttemptRaw, error: attemptError } = await supabase
          .from('cip_attempts')
          .insert([{
            puzzle_id: puzzleId,
            user_id: user.id,
            grid_state: {},
            time_per_cell: {},
          }] as unknown as never[])
          .select()
          .single()

        const newAttempt = newAttemptRaw as CIPAttemptRow | null

        if (attemptError || !newAttempt) {
          setError('Erro ao iniciar puzzle')
          setLoading(false)
          return
        }

        attemptId = newAttempt.id
      }

      // Initialize store
      const remainingTime =
        existingAttempt?.total_time_seconds != null
          ? Math.max(0, puzzle.timeLimitMinutes * 60 - existingAttempt.total_time_seconds)
          : puzzle.timeLimitMinutes * 60

      startPuzzle(
        puzzle,
        attemptId,
        existingAttempt
          ? {
              gridState: existingAttempt.grid_state || {},
              timePerCell: existingAttempt.time_per_cell || {},
              remainingTime,
              startedAt: existingAttempt.started_at || null,
            }
          : undefined
      )
      setLoading(false)
    }

    // Reset if navigating to a different puzzle
    if (currentPuzzle && currentPuzzle.id !== puzzleId) {
      resetPuzzle()
    }

    // Only load if not already loaded
    if (!currentPuzzle || currentPuzzle.id !== puzzleId) {
      loadPuzzle()
    } else {
      setLoading(false)
    }
  }, [puzzleId, router, startPuzzle, resetPuzzle, currentPuzzle])

  const handleCellClick = useCallback(
    (row: number, section: CIPSection) => {
      selectCell(row, section)
    },
    [selectCell]
  )

  const handleCloseModal = useCallback(() => {
    selectCell(-1, 'medical_history') // Clear active cell
  }, [selectCell])

  const handleSubmit = async () => {
    if (!currentPuzzle) return

    setSubmitting(true)

    try {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login')
        return
      }

      // Build attempt data
      const attempt = {
        id: useCIPStore.getState().attemptId || '',
        puzzleId: currentPuzzle.id,
        userId: user.id,
        gridState,
        timePerCell: Object.fromEntries(
          Object.entries(useCIPStore.getState().cellStates).map(([key, cell]) => [
            key,
            cell.timeSpent,
          ])
        ),
        totalTimeSeconds:
          currentPuzzle.timeLimitMinutes * 60 - useCIPStore.getState().remainingTime,
        startedAt: useCIPStore.getState().startedAt || new Date(),
        completedAt: new Date(),
      }

      // Calculate score
      const score = calculateCIPScore(currentPuzzle, attempt)

      // Update attempt in database
      const attemptId = useCIPStore.getState().attemptId
      await (supabase as any)
        .from('cip_attempts')
        .update({
          grid_state: gridState,
          time_per_cell: attempt.timePerCell,
          total_time_seconds: attempt.totalTimeSeconds,
          completed_at: new Date().toISOString(),
          theta: score.theta,
          standard_error: score.standardError,
          scaled_score: score.scaledScore,
          passed: score.passed,
          correct_count: score.correctCount,
          total_cells: score.totalCells,
          section_breakdown: score.sectionBreakdown,
          diagnosis_breakdown: score.diagnosisBreakdown,
        })
        .eq('id', attemptId)

      // Update store
      submitPuzzle(score)

      // Navigate to results
      router.push(`/cip/${puzzleId}/result`)
    } catch (err) {
      console.error('Error submitting puzzle:', err)
      setError('Erro ao enviar puzzle')
    } finally {
      setSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  const handleTimeUp = () => {
    setShowSubmitModal(true)
    handleSubmit()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando puzzle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/cip')}>Voltar</Button>
        </div>
      </div>
    )
  }

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-label-primary mb-2">Puzzle indisponível</h2>
            <p className="text-label-secondary mb-6">
              Não foi possível preparar seu puzzle neste momento.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/cip')} fullWidth>
                Voltar para CIP
              </Button>
              <Button variant="bordered" onClick={() => router.refresh()} fullWidth>
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
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface-1 border-b border-separator">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Puzzle className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-lg font-semibold text-label-primary">{currentPuzzle.title}</h1>
                <span className="text-sm text-label-secondary">
                  {answeredCount}/{totalCells} preenchidas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <CIPTimer onTimeUp={handleTimeUp} />
              <Button
                variant="bordered"
                size="small"
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitted}
              >
                Finalizar
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <CIPProgress />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Instructions Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5"
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
                  Clique em cada célula para associar o achado clínico correto ao diagnóstico.
                  Complete todas as células e clique em "Finalizar" para ver seu resultado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Puzzle Grid */}
        <Card>
          <CardContent className="p-4">
            <CIPPuzzleGrid puzzle={currentPuzzle} onCellClick={handleCellClick} />
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-label-secondary">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-surface-2/50 border border-separator" />
            <span>Vazia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-900/30 border border-emerald-700/50" />
            <span>Preenchida</span>
          </div>
        </div>
      </div>

      {/* Options Modal */}
      {activeCell && activeCell.row >= 0 && (
        <CIPOptionsModal
          isOpen={true}
          onClose={handleCloseModal}
          puzzle={currentPuzzle}
          row={activeCell.row}
          section={activeCell.section}
        />
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        title="Finalizar Puzzle"
      >
        <div className="text-label-primary">
          <p className="mb-4">
            Você preencheu <strong>{answeredCount}</strong> de <strong>{totalCells}</strong>{' '}
            células.
          </p>

          {answeredCount < totalCells && (
            <p className="text-yellow-400 mb-4">
              Atenção: {totalCells - answeredCount} células não foram preenchidas e serão
              consideradas erradas.
            </p>
          )}

          <p>Deseja realmente finalizar o puzzle?</p>

          <div className="flex gap-3 mt-6">
            <Button
              variant="bordered"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
              fullWidth
            >
              Continuar
            </Button>
            <Button variant="filled" onClick={handleSubmit} loading={submitting} fullWidth>
              Finalizar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
