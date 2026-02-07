'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { ModuleList, ModuleContent, type Module, type ModuleType } from '../../components'

interface ModuleData {
  id: string
  path_id: string
  title: string
  description: string | null
  type: ModuleType
  order_index: number
  estimated_minutes: number
  content: any
}

interface PathData {
  id: string
  title: string
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
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    // Load path info
    const { data: pathData } = await (supabase
      .from('study_paths') as any)
      .select('id, title')
      .eq('id', pathId)
      .single()

    if (!pathData) {
      router.push('/trilhas')
      return
    }
    setPath(pathData)

    // Load current module
    const { data: moduleData } = await (supabase
      .from('study_modules') as any)
      .select('*')
      .eq('id', moduleId)
      .single()

    if (!moduleData) {
      router.push(`/trilhas/${pathId}`)
      return
    }
    setCurrentModule(moduleData)

    // Load all modules for sidebar navigation
    const { data: modulesData } = await (supabase
      .from('study_modules') as any)
      .select('*')
      .eq('path_id', pathId)
      .order('order_index', { ascending: true })

    // Get user progress
    let completedModules: string[] = []
    if (user.user) {
      const { data: progressData } = await (supabase
        .from('user_path_progress') as any)
        .select('completed_modules')
        .eq('path_id', pathId)
        .eq('user_id', user.user.id)
        .single()

      if (progressData) {
        completedModules = progressData.completed_modules || []
      }
    }

    if (modulesData) {
      const formattedModules: Module[] = modulesData.map((m: any, index: number) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        order_index: m.order_index,
        estimated_minutes: m.estimated_minutes || 15,
        is_completed: completedModules.includes(m.id),
        is_locked: index > 0 && !completedModules.includes(modulesData[index - 1].id),
      }))
      setModules(formattedModules)
    }

    setLoading(false)
  }

  async function handleComplete() {
    if (!currentModule) return

    setIsCompleting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get current progress
      const { data: existingProgress } = await (supabase
        .from('user_path_progress') as any)
        .select('*')
        .eq('path_id', pathId)
        .eq('user_id', user.id)
        .single()

      const completedModules = existingProgress?.completed_modules || []

      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId)

        if (existingProgress) {
          // Update existing progress
          await (supabase
            .from('user_path_progress') as any)
            .update({
              completed_modules: completedModules,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProgress.id)
        } else {
          // Create new progress record
          await (supabase
            .from('user_path_progress') as any)
            .insert({
              path_id: pathId,
              user_id: user.id,
              completed_modules: completedModules,
            })
        }
      }

      // Find next module
      const currentIndex = modules.findIndex(m => m.id === moduleId)
      const nextModule = modules[currentIndex + 1]

      if (nextModule && !nextModule.is_locked) {
        router.push(`/trilhas/${pathId}/${nextModule.id}`)
      } else {
        // All done, go back to path overview
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
    return null
  }

  const currentModuleInfo = modules.find(m => m.id === moduleId)
  const currentIndex = modules.findIndex(m => m.id === moduleId)
  const prevModule = modules[currentIndex - 1]
  const nextModule = modules[currentIndex + 1]

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
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
          {/* Main Content */}
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
                  content={currentModule.content || {}}
                  onComplete={handleComplete}
                  isCompleting={isCompleting}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              {prevModule && !prevModule.is_locked ? (
                <Button
                  variant="outline"
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

          {/* Sidebar - Module Navigation */}
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
