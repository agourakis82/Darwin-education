'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { ModuleList, type Module, type ModuleType } from '../components'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea } from '@darwin-education/shared'

type PathDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'muito_facil'
  | 'facil'
  | 'medio'
  | 'dificil'
  | 'muito_dificil'

interface PathData {
  id: string
  title: string
  description: string | null
  area: ENAMEDArea
  difficulty: PathDifficulty
  estimated_hours: number
  objectives: string[]
  prerequisites: string[]
}

const difficultyLabels: Record<PathDifficulty, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
}

const difficultyColors: Record<PathDifficulty, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
  muito_facil: 'text-emerald-300',
  facil: 'text-green-400',
  medio: 'text-yellow-400',
  dificil: 'text-orange-400',
  muito_dificil: 'text-red-400',
}

const AREA_SET = new Set<ENAMEDArea>(Object.keys(AREA_LABELS) as ENAMEDArea[])
const MODULE_TYPE_SET = new Set<ModuleType>(['reading', 'video', 'quiz', 'flashcards', 'case_study'])
const PATH_DIFFICULTY_SET = new Set<PathDifficulty>([
  'beginner',
  'intermediate',
  'advanced',
  'muito_facil',
  'facil',
  'medio',
  'dificil',
  'muito_dificil',
])

function normalizePathArea(pathData: any): ENAMEDArea {
  const areaCandidate = typeof pathData?.area === 'string'
    ? pathData.area
    : Array.isArray(pathData?.areas)
      ? pathData.areas[0]
      : null

  if (typeof areaCandidate === 'string' && AREA_SET.has(areaCandidate as ENAMEDArea)) {
    return areaCandidate as ENAMEDArea
  }

  return 'clinica_medica'
}

function normalizePathDifficulty(value: unknown): PathDifficulty {
  if (typeof value === 'string' && PATH_DIFFICULTY_SET.has(value as PathDifficulty)) {
    return value as PathDifficulty
  }

  const aliases: Record<string, PathDifficulty> = {
    basico: 'facil',
    intermediario: 'medio',
    avancado: 'dificil',
  }

  if (typeof value === 'string') {
    return aliases[value] || 'medio'
  }

  return 'medio'
}

function normalizeModuleType(value: unknown): ModuleType {
  if (typeof value === 'string' && MODULE_TYPE_SET.has(value as ModuleType)) {
    return value as ModuleType
  }
  return 'reading'
}

function normalizePositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function normalizeEstimatedHours(rawValue: unknown, moduleCount: number) {
  const parsed = normalizePositiveNumber(rawValue)
  if (parsed !== null) return parsed
  if (moduleCount <= 0) return 0
  return Number((moduleCount * 0.75).toFixed(1))
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

export default function PathOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const pathId = params.pathId as string

  const [path, setPath] = useState<PathData | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    loadPath()
  }, [pathId])

  async function loadPath() {
    setLoading(true)

    const supabase = createClient()
    const user = await getSessionUserSummary(supabase)

    const { data: pathData } = await (supabase
      .from('study_paths') as any)
      .select('*')
      .eq('id', pathId)
      .maybeSingle()

    if (!pathData) {
      setLoading(false)
      router.push('/trilhas')
      return
    }

    const { data: modulesData } = await (supabase
      .from('study_modules') as any)
      .select('*')
      .eq('path_id', pathId)
      .order('order_index', { ascending: true })

    let completedModules: string[] = []
    if (user) {
      const { data: progressData } = await (supabase
        .from('user_path_progress') as any)
        .select('completed_modules')
        .eq('path_id', pathId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (progressData?.completed_modules) {
        completedModules = toStringArray(progressData.completed_modules)
      }
    }

    const formattedModules: Module[] = (modulesData || []).map((module: any, index: number) => ({
      id: module.id,
      title: module.title,
      description: module.description || null,
      type: normalizeModuleType(module.type),
      order_index: typeof module.order_index === 'number' ? module.order_index : index,
      estimated_minutes: normalizePositiveNumber(module.estimated_minutes) || 15,
      is_completed: completedModules.includes(module.id),
      is_locked: index > 0 && !completedModules.includes(modulesData[index - 1].id),
    }))

    const completedCount = formattedModules.filter((module) => module.is_completed).length
    const progressPercent = formattedModules.length
      ? Math.round((completedCount / formattedModules.length) * 100)
      : 0

    setPath({
      id: pathData.id,
      title: pathData.title,
      description: pathData.description,
      area: normalizePathArea(pathData),
      difficulty: normalizePathDifficulty(pathData.difficulty),
      estimated_hours: normalizeEstimatedHours(pathData.estimated_hours, formattedModules.length),
      objectives: toStringArray(pathData.objectives),
      prerequisites: toStringArray(pathData.prerequisites),
    })

    setModules(formattedModules)
    setProgress(progressPercent)
    setLoading(false)
  }

  const nextModule = modules.find((module) => !module.is_completed && !module.is_locked)

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-label-primary mb-2">Trilha indisponível</h2>
            <p className="text-label-secondary mb-6">
              Não foi possível carregar os dados desta trilha.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/trilhas')} fullWidth>
                Voltar para Trilhas
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
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/trilhas')}
              className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">{path.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded border ${AREA_COLORS[path.area]?.badge}`}>
                  {AREA_LABELS[path.area]}
                </span>
                <span className={`text-xs ${difficultyColors[path.difficulty]}`}>
                  {difficultyLabels[path.difficulty]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {path.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre esta Trilha</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-label-primary leading-relaxed">{path.description}</p>
                </CardContent>
              </Card>
            )}

            {path.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos de Aprendizagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {path.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-label-primary">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">Módulos ({modules.length})</h2>
              <ModuleList pathId={pathId} modules={modules} />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-surface-3"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 * (1 - progress / 100)}
                        className="text-emerald-500 transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{progress}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-label-secondary mt-2">
                    {modules.filter((module) => module.is_completed).length} de {modules.length} módulos concluídos
                  </p>
                </div>

                {nextModule && (
                  <Link href={`/trilhas/${pathId}/${nextModule.id}`}>
                    <Button className="w-full">
                      {progress === 0 ? 'Começar' : 'Continuar'}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                )}

                {progress === 100 && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-emerald-400 font-medium">Trilha Concluída!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-2 rounded-lg">
                    <svg className="w-5 h-5 text-label-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-label-secondary">Duração Estimada</p>
                    <p className="font-medium">{path.estimated_hours} horas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-2 rounded-lg">
                    <svg className="w-5 h-5 text-label-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-label-secondary">Módulos</p>
                    <p className="font-medium">{modules.length} módulos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-2 rounded-lg">
                    <svg className="w-5 h-5 text-label-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-label-secondary">Nível</p>
                    <p className={`font-medium ${difficultyColors[path.difficulty]}`}>
                      {difficultyLabels[path.difficulty]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {path.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pré-requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {path.prerequisites.map((prerequisite, index) => (
                      <li key={index} className="flex items-start gap-2 text-label-secondary">
                        <svg className="w-4 h-4 text-label-tertiary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {prerequisite}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
