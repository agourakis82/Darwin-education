'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { ModuleList, ModuleContent, type Module, type ModuleType } from '../../components'

interface ModuleData {
  id: string
  path_id: string | null
  title: string
  description: string | null
  type: ModuleType
  order_index: number
  estimated_minutes: number
  content: Record<string, unknown>
}

interface PathData {
  id: string
  title: string
  areas?: string[] | null
  area?: string | null
}

const MODULE_TYPE_SET = new Set<ModuleType>(['reading', 'video', 'quiz', 'flashcards', 'case_study'])

const SYSTEM_DECK_BY_AREA: Record<string, string> = {
  clinica_medica: 'a0000001-0000-0000-0000-000000000001',
  cirurgia: 'a0000001-0000-0000-0000-000000000002',
  ginecologia_obstetricia: 'a0000001-0000-0000-0000-000000000003',
  pediatria: 'a0000001-0000-0000-0000-000000000004',
  saude_coletiva: 'a0000001-0000-0000-0000-000000000005',
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

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function parseModuleContent(content: unknown): Record<string, unknown> {
  if (!content) return {}

  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (!trimmed) return {}

    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return { text: trimmed }
    }

    return {}
  }

  if (typeof content === 'object' && !Array.isArray(content)) {
    return content as Record<string, unknown>
  }

  return {}
}

export default function ModuleContentPage() {
  const params = useParams()
  const router = useRouter()
  const pathId = params.pathId as string
  const moduleId = params.moduleId as string

  const [path, setPath] = useState<PathData | null>(null)
  const [currentModule, setCurrentModule] = useState<ModuleData | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    loadModule()
  }, [pathId, moduleId])

  async function loadModule() {
    setLoading(true)

    const supabase = createClient()
    const user = await getSessionUserSummary(supabase)

    const pathAttempts: Array<{ select: string; usesAreasArray: boolean }> = [
      { select: 'id, title, areas', usesAreasArray: true },
      { select: 'id, title, area', usesAreasArray: false },
      { select: 'id, title', usesAreasArray: false },
    ]

    let pathData: PathData | null = null
    let usesAreasArray = false

    for (const attempt of pathAttempts) {
      const { data, error } = await (supabase
        .from('study_paths') as any)
        .select(attempt.select)
        .eq('id', pathId)
        .maybeSingle()

      if (!error && data) {
        pathData = data as PathData
        usesAreasArray = attempt.usesAreasArray
        break
      }
    }

    if (!pathData) {
      setLoading(false)
      router.push('/trilhas')
      return
    }
    setPath(pathData)

    const resolvedArea = usesAreasArray
      ? (Array.isArray(pathData.areas) ? (pathData.areas[0] as string | undefined) : undefined)
      : (typeof pathData.area === 'string' ? pathData.area : undefined)

    const { data: moduleData } = await (supabase
      .from('study_modules') as any)
      .select('*')
      .eq('id', moduleId)
      .maybeSingle()

    if (!moduleData || (moduleData.path_id && moduleData.path_id !== pathId)) {
      setLoading(false)
      router.push(`/trilhas/${pathId}`)
      return
    }

    const moduleType = normalizeModuleType(moduleData.type)
    const parsedContent = parseModuleContent(moduleData.content)

    if (
      moduleType === 'flashcards' &&
      typeof parsedContent.flashcard_deck_id !== 'string' &&
      resolvedArea &&
      SYSTEM_DECK_BY_AREA[resolvedArea]
    ) {
      parsedContent.flashcard_deck_id = SYSTEM_DECK_BY_AREA[resolvedArea]
    }

    setCurrentModule({
      id: moduleData.id,
      path_id: moduleData.path_id || null,
      title: moduleData.title,
      description: moduleData.description || null,
      type: moduleType,
      order_index: typeof moduleData.order_index === 'number' ? moduleData.order_index : 0,
      estimated_minutes: normalizePositiveNumber(moduleData.estimated_minutes) || 15,
      content: parsedContent,
    })

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

    setModules(formattedModules)
    setLoading(false)
  }

  async function handleComplete() {
    if (!currentModule) return

    setIsCompleting(true)

    try {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      if (!user) {
        router.push('/login')
        return
      }

      const { data: existingProgress } = await (supabase
        .from('user_path_progress') as any)
        .select('id, completed_modules')
        .eq('path_id', pathId)
        .eq('user_id', user.id)
        .maybeSingle()

      const completedModules = toStringArray(existingProgress?.completed_modules)

      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId)

        const currentIndex = modules.findIndex((module) => module.id === moduleId)
        const nextModule = modules[currentIndex + 1]
        const nextModuleId = nextModule && !nextModule.is_locked ? nextModule.id : null
        const completedAt = nextModuleId ? null : new Date().toISOString()

        if (existingProgress?.id) {
          await (supabase
            .from('user_path_progress') as any)
            .update({
              completed_modules: completedModules,
              current_module_id: nextModuleId,
              completed_at: completedAt,
            })
            .eq('id', existingProgress.id)
        } else {
          await (supabase
            .from('user_path_progress') as any)
            .insert({
              path_id: pathId,
              user_id: user.id,
              completed_modules: completedModules,
              current_module_id: nextModuleId,
              completed_at: completedAt,
            })
        }
      }

      const currentIndex = modules.findIndex((module) => module.id === moduleId)
      const nextModule = modules[currentIndex + 1]

      if (nextModule && !nextModule.is_locked) {
        router.push(`/trilhas/${pathId}/${nextModule.id}`)
      } else {
        router.push(`/trilhas/${pathId}`)
      }
    } catch (error) {
      console.error('Error completing module:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!currentModule || !path) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-label-primary mb-2">Módulo indisponível</h2>
            <p className="text-label-secondary mb-6">
              Não foi possível carregar este módulo da trilha.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push(`/trilhas/${pathId}`)} fullWidth>
                Voltar para a trilha
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

  const currentModuleInfo = modules.find((module) => module.id === moduleId)
  const currentIndex = modules.findIndex((module) => module.id === moduleId)
  const prevModule = modules[currentIndex - 1]
  const nextModule = modules[currentIndex + 1]

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/trilhas/${pathId}`)}
                className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <p className="text-sm text-label-secondary">{path.title}</p>
                <h1 className="text-lg font-bold">{currentModule.title}</h1>
              </div>
            </div>
            <div className="text-sm text-label-secondary">
              {currentIndex + 1} / {modules.length}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{currentModule.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-label-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{currentModule.estimated_minutes} min</span>
                  </div>
                </div>
                {currentModule.description && (
                  <p className="text-label-secondary text-sm mt-2">{currentModule.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <ModuleContent
                  type={currentModule.type}
                  title={currentModule.title}
                  content={currentModule.content}
                  onComplete={handleComplete}
                  isCompleting={isCompleting}
                />
              </CardContent>
            </Card>

            <div className="flex justify-between mt-6">
              {prevModule && !prevModule.is_locked ? (
                <Button
                  variant="bordered"
                  onClick={() => router.push(`/trilhas/${pathId}/${prevModule.id}`)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </Button>
              ) : (
                <div />
              )}

              {nextModule && !nextModule.is_locked && currentModuleInfo?.is_completed && (
                <Button onClick={() => router.push(`/trilhas/${pathId}/${nextModule.id}`)}>
                  Próximo
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-sm font-medium text-label-secondary mb-3">Módulos</h3>
              <ModuleList
                pathId={pathId}
                modules={modules}
                currentModuleId={moduleId}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
