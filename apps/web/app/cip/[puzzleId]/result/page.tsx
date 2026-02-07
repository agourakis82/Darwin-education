'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Puzzle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { useCIPStore } from '@/lib/stores/cipStore'
import { CIPResults, CIPPuzzleGrid, AchievementToast, type Achievement } from '../../components'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { CIPScore, CIPSection, CIPPuzzle, CIPDiagnosis, CIPFinding, CIPCell, CIPDifficultySettings, IRTParameters, DifficultyLevel, ENAMEDArea, CIPDiagnosisPerformance } from '@darwin-education/shared'

// Database row types (until Supabase types are generated)
interface CIPAttemptResultRow {
  id: string
  puzzle_id: string
  user_id: string
  grid_state?: Record<string, string>
  completed_at?: string
  theta?: number
  standard_error?: number
  scaled_score?: number
  passed?: boolean
  correct_count?: number
  total_cells?: number
  total_time_seconds?: number
  section_breakdown?: Record<string, { correct: number; total: number; percentage: number }>
  diagnosis_breakdown?: CIPDiagnosisPerformance[]
}

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

/**
 * Triggers confetti celebration based on score
 */
function celebrateScore(score: CIPScore) {
  const isPerfect = score.percentageCorrect === 100
  const isHighScore = score.scaledScore >= 800
  const isPassing = score.passed

  if (isPerfect) {
    // Perfect score - golden confetti shower
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    // Golden confetti burst
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
    })
    fire(0.2, {
      spread: 60,
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
    })
  } else if (isHighScore) {
    // High score - purple/pink confetti
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6'],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#ec4899', '#8b5cf6'],
      })
    }, 250)
  } else if (isPassing) {
    // Passing score - simple confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      zIndex: 9999,
    })
  }
}

export default function CIPResultPage() {
  const params = useParams()
  const router = useRouter()
  const puzzleId = params.puzzleId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [loadedScore, setLoadedScore] = useState<CIPScore | null>(null)
  const [loadedPuzzle, setLoadedPuzzle] = useState<CIPPuzzle | null>(null)
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number | undefined>(undefined)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  const { currentPuzzle, result, isSubmitted, resetPuzzle } = useCIPStore()

  useEffect(() => {
    async function loadResult() {
      // If we have result in store, use it
      if (isSubmitted && result && currentPuzzle?.id === puzzleId) {
        setLoadedScore(result)
        setLoadedPuzzle(currentPuzzle)
        // Calculate time from puzzle time limit and remaining time in store
        const remainingTime = useCIPStore.getState().remainingTime
        const totalTime = currentPuzzle.timeLimitMinutes * 60 - remainingTime
        setTotalTimeSeconds(totalTime)
        setLoading(false)

        // Celebrate the result!
        setTimeout(() => celebrateScore(result), 500)
        return
      }

      // Otherwise, load from database
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/cip/' + puzzleId + '/result')
        return
      }

      // Fetch the most recent completed attempt for this puzzle
      const { data: attemptRaw, error: attemptError } = await supabase
        .from('cip_attempts')
        .select('*')
        .eq('puzzle_id', puzzleId)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      const attempt = attemptRaw as CIPAttemptResultRow | null

      if (attemptError || !attempt) {
        setError('Resultado não encontrado')
        setLoading(false)
        return
      }

      // Load puzzle data for the grid
      const { data: puzzleDataRaw, error: puzzleError } = await supabase
        .from('cip_puzzles')
        .select('*')
        .eq('id', puzzleId)
        .single()

      const puzzleData = puzzleDataRaw as CIPPuzzleRow | null

      if (puzzleError || !puzzleData) {
        setError('Puzzle não encontrado')
        setLoading(false)
        return
      }

      // Fetch diagnoses
      const { data: diagnosesRaw } = await supabase
        .from('cip_diagnoses')
        .select('*')
        .in('id', puzzleData.diagnosis_ids || [])

      const diagnoses = diagnosesRaw as CIPDiagnosisRow[] | null

      // Fetch findings
      const sections = ((puzzleData.settings as Record<string, unknown>)?.sections as string[]) || ['medical_history', 'physical_exam', 'laboratory', 'treatment']
      const allFindingIds: string[] = []
      const optionsPerSection = puzzleData.options_per_section || {}
      for (const section of sections) {
        if (optionsPerSection[section]) {
          allFindingIds.push(...optionsPerSection[section])
        }
      }

      const { data: findingsRaw } = await supabase
        .from('cip_findings')
        .select('*')
        .in('id', allFindingIds)

      const findings = findingsRaw as CIPFindingRow[] | null

      // Fetch grid
      const { data: gridDataRaw } = await supabase
        .from('cip_puzzle_grid')
        .select('*')
        .eq('puzzle_id', puzzleId)
        .order('row_index')

      const gridData = gridDataRaw as CIPPuzzleGridRow[] | null

      // Transform data
      const diagnosesMap = new Map(diagnoses?.map((d) => [d.id, d]) || [])
      const findingsMap = new Map(findings?.map((f) => [f.id, f]) || [])

      const orderedDiagnoses: CIPDiagnosis[] = (puzzleData.diagnosis_ids || [])
        .map((id: string) => diagnosesMap.get(id))
        .filter((d): d is CIPDiagnosisRow => Boolean(d))
        .map((d): CIPDiagnosis => ({
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
        }))

      const optionsPerSectionFull: Record<CIPSection, CIPFinding[]> = {} as Record<CIPSection, CIPFinding[]>
      for (const section of sections) {
        const sectionFindingIds = optionsPerSection[section] || []
        optionsPerSectionFull[section as CIPSection] = sectionFindingIds
          .map((id: string) => findingsMap.get(id))
          .filter((f): f is CIPFindingRow => Boolean(f))
          .map((f): CIPFinding => ({
            id: f.id,
            textPt: f.text_pt,
            textEn: f.text_en,
            section: f.section as CIPSection,
            icd10Codes: f.icd10_codes || [],
            atcCodes: f.atc_codes || [],
            tags: f.tags || [],
            isAIGenerated: f.is_ai_generated || false,
            validatedBy: f.validated_by as 'community' | 'expert' | 'both' | undefined,
          }))
      }

      const grid: CIPCell[][] = []
      for (let i = 0; i < orderedDiagnoses.length; i++) {
        grid[i] = []
      }

      for (const cell of gridData || []) {
        const rowIndex = cell.row_index
        if (!grid[rowIndex]) grid[rowIndex] = []

        // Get user's answer for this cell
        const cellKey = `${rowIndex}_${cell.section}`
        const selectedFindingId = (attempt.grid_state as Record<string, string>)?.[cellKey] || null

        grid[rowIndex].push({
          row: rowIndex,
          column: cell.section as CIPSection,
          correctFindingId: cell.correct_finding_id,
          selectedFindingId,
          irt: cell.irt_difficulty ? { difficulty: cell.irt_difficulty, discrimination: 1.2, guessing: 0.1 } : undefined,
        })
      }

      // Sort grid rows
      const sectionOrder = sections as CIPSection[]
      for (const row of grid) {
        row.sort((a, b) => sectionOrder.indexOf(a.column) - sectionOrder.indexOf(b.column))
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

      // Build score from attempt
      const score: CIPScore = {
        theta: attempt.theta || 0,
        standardError: attempt.standard_error || 0.5,
        scaledScore: attempt.scaled_score || 0,
        passThreshold: 600,
        passed: attempt.passed || false,
        correctCount: attempt.correct_count || 0,
        totalCells: attempt.total_cells || 0,
        percentageCorrect: (attempt.total_cells ?? 0) > 0 ? ((attempt.correct_count ?? 0) / (attempt.total_cells ?? 1)) * 100 : 0,
        sectionBreakdown: (attempt.section_breakdown as Record<CIPSection, { correct: number; total: number; percentage: number }>) || {},
        diagnosisBreakdown: attempt.diagnosis_breakdown || [],
      }

      setLoadedScore(score)
      setLoadedPuzzle(puzzle)
      setTotalTimeSeconds(attempt.total_time_seconds)

      // Check for newly unlocked achievements
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
      } catch (error) {
        console.error('Error checking achievements:', error)
      }

      setLoading(false)

      // Celebrate the result!
      setTimeout(() => celebrateScore(score), 500)
    }

    loadResult()
  }, [puzzleId, router, currentPuzzle, result, isSubmitted])

  const handleRetry = () => {
    resetPuzzle()
    router.push(`/cip/${puzzleId}`)
  }

  const handleBackToList = () => {
    resetPuzzle()
    router.push('/cip')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          <Button onClick={() => router.push('/cip')}>Voltar</Button>
        </div>
      </div>
    )
  }

  const displayPuzzle = loadedPuzzle || currentPuzzle

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Puzzle className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Resultado do Puzzle</h1>
          </div>
          {displayPuzzle && (
            <p className="text-label-secondary">{displayPuzzle.title}</p>
          )}
        </div>

        {/* Results Component */}
        <CIPResults
          score={loadedScore}
          totalTimeSeconds={totalTimeSeconds}
          onRetry={handleRetry}
          onBackToList={handleBackToList}
        />

        {/* Toggle Grid View */}
        {displayPuzzle && (
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => setShowGrid(!showGrid)}
              fullWidth
            >
              {showGrid ? 'Ocultar Grade' : 'Ver Grade com Respostas'}
            </Button>

            {showGrid && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Grade de Respostas</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-600/30 border border-emerald-500" />
                      <span className="text-label-secondary">Correta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-600/30 border border-red-500" />
                      <span className="text-label-secondary">Incorreta</span>
                    </div>
                  </div>
                  <CIPPuzzleGrid
                    puzzle={displayPuzzle}
                    onCellClick={() => {}} // No-op in results view
                    showResults={true}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
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
