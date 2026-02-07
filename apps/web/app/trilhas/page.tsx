'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { ENAMEDArea } from '@darwin-education/shared'

interface StudyPath {
  id: string
  title: string
  description: string | null
  area: ENAMEDArea
  module_count: number
  estimated_hours: number
  progress: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
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
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
}

export default function TrilhasPage() {
  const [paths, setPaths] = useState<StudyPath[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ENAMEDArea | 'all'>('all')

  useEffect(() => {
    loadPaths()
  }, [])

  async function loadPaths() {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    // Load all study paths
    const { data: pathsData } = await (supabase
      .from('study_paths') as any)
      .select(`
        id,
        title,
        description,
        area,
        difficulty,
        estimated_hours,
        created_at,
        study_modules(id)
      `)
      .eq('is_published', true)
      .order('area', { ascending: true })

    if (pathsData) {
      // Get user progress for each path
      let userProgress: Record<string, number> = {}

      if (user.user) {
        const { data: progressData } = await (supabase
          .from('user_path_progress') as any)
          .select('path_id, completed_modules')
          .eq('user_id', user.user.id)

        if (progressData) {
          userProgress = progressData.reduce((acc: Record<string, number>, p: any) => {
            acc[p.path_id] = p.completed_modules?.length || 0
            return acc
          }, {})
        }
      }

      const formattedPaths: StudyPath[] = pathsData.map((path: any) => ({
        id: path.id,
        title: path.title,
        description: path.description,
        area: path.area,
        module_count: path.study_modules?.length || 0,
        estimated_hours: path.estimated_hours || 10,
        progress: path.study_modules?.length
          ? Math.round((userProgress[path.id] || 0) / path.study_modules.length * 100)
          : 0,
        difficulty: path.difficulty || 'intermediate',
        created_at: path.created_at,
      }))
      setPaths(formattedPaths)
    }

    setLoading(false)
  }

  const filteredPaths = filter === 'all'
    ? paths
    : paths.filter(p => p.area === filter)

  const inProgressPaths = paths.filter(p => p.progress > 0 && p.progress < 100)
  const completedPaths = paths.filter(p => p.progress === 100)

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Trilhas de Estudo</h1>
              <p className="text-sm text-label-secondary mt-1">
                Roteiros estruturados para dominar cada área
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{paths.length}</p>
                  <p className="text-sm text-label-secondary">Trilhas Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressPaths.length}</p>
                  <p className="text-sm text-label-secondary">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedPaths.length}</p>
                  <p className="text-sm text-label-secondary">Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Studying */}
        {inProgressPaths.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Continue Estudando</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressPaths.slice(0, 2).map((path) => (
                <Link key={path.id} href={`/trilhas/${path.id}`}>
                  <Card className="hover:border-surface-4 transition-colors cursor-pointer bg-gradient-to-r from-surface-2 to-surface-1">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{path.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded border ${areaColors[path.area]}`}>
                          {areaLabels[path.area]}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-label-secondary mb-1">
                          <span>Progresso</span>
                          <span>{path.progress}%</span>
                        </div>
                        <div className="w-full bg-surface-3 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${path.progress}%` }}
                          />
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-2">
                        Continuar
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-surface-2 text-label-primary hover:bg-surface-3'
            }`}
          >
            Todas
          </button>
          {(Object.keys(areaLabels) as ENAMEDArea[]).map((area) => (
            <button
              key={area}
              onClick={() => setFilter(area)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === area
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-2 text-label-primary hover:bg-surface-3'
              }`}
            >
              {areaLabels[area]}
            </button>
          ))}
        </div>

        {/* Paths Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-surface-2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPaths.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-16 h-16 text-label-quaternary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">
                {filter === 'all' ? 'Nenhuma trilha disponível' : 'Nenhuma trilha nesta área'}
              </h3>
              <p className="text-label-secondary">
                Novas trilhas serão adicionadas em breve
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPaths.map((path) => (
              <Link key={path.id} href={`/trilhas/${path.id}`}>
                <Card className="h-full hover:border-surface-4 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{path.title}</CardTitle>
                      {path.progress === 100 && (
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                          Concluída
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded border ${areaColors[path.area]}`}>
                        {areaLabels[path.area]}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${difficultyColors[path.difficulty]}`}>
                        {difficultyLabels[path.difficulty]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {path.description && (
                      <p className="text-sm text-label-secondary mb-4 line-clamp-2">
                        {path.description}
                      </p>
                    )}

                    {/* Progress bar */}
                    {path.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-label-secondary mb-1">
                          <span>Progresso</span>
                          <span>{path.progress}%</span>
                        </div>
                        <div className="w-full bg-surface-3 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${path.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-label-secondary">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{path.module_count} módulos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{path.estimated_hours}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
