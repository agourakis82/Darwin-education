'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { ModuleList, type Module } from '../components'
import type { ENAMEDArea } from '@darwin-education/shared'

interface PathData {
  id: string
  title: string
  description: string | null
  area: ENAMEDArea
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_hours: number
  objectives: string[]
  prerequisites: string[]
}

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const areaColors: Record<ENAMEDArea, string> = {
  clinica_medica: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cirurgia: 'bg-red-500/20 text-red-400 border-red-500/30',
  ginecologia_obstetricia: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  pediatria: 'bg-green-500/20 text-green-400 border-green-500/30',
  saude_coletiva: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

const difficultyColors = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
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
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    // Load path details
    const { data: pathData } = await (supabase
      .from('study_paths') as any)
      .select('*')
      .eq('id', pathId)
      .single()

    if (!pathData) {
      router.push('/trilhas')
      return
    }

    setPath({
      id: pathData.id,
      title: pathData.title,
      description: pathData.description,
      area: pathData.area,
      difficulty: pathData.difficulty || 'intermediate',
      estimated_hours: pathData.estimated_hours || 10,
      objectives: pathData.objectives || [],
      prerequisites: pathData.prerequisites || [],
    })

    // Load modules
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

      const completedCount = formattedModules.filter(m => m.is_completed).length
      setProgress(Math.round((completedCount / formattedModules.length) * 100) || 0)
    }

    setLoading(false)
  }

  const nextModule = modules.find(m => !m.is_completed && !m.is_locked)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!path) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/trilhas')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">{path.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded border ${areaColors[path.area]}`}>
                  {areaLabels[path.area]}
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {path.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre esta Trilha</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{path.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Objectives */}
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
                        <span className="text-slate-300">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Modules */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Módulos ({modules.length})</h2>
              <ModuleList pathId={pathId} modules={modules} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Progress Card */}
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
                        className="text-slate-700"
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
                  <p className="text-sm text-slate-400 mt-2">
                    {modules.filter(m => m.is_completed).length} de {modules.length} módulos concluídos
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

            {/* Info Card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Duração Estimada</p>
                    <p className="font-medium">{path.estimated_hours} horas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Módulos</p>
                    <p className="font-medium">{modules.length} módulos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Nível</p>
                    <p className={`font-medium ${difficultyColors[path.difficulty]}`}>
                      {difficultyLabels[path.difficulty]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {path.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pré-requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {path.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-400">
                        <svg className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {prereq}
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
