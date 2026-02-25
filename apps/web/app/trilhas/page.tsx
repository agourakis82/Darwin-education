'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FeatureState } from '@/components/ui/FeatureState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'
import { getSessionUserSummary } from '@/lib/auth/session'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import { BibliographyBlock } from '@/components/content/BibliographyBlock'
import { STUDY_METHODS_BIBLIOGRAPHY } from '@/lib/references/bibliography'
import type { ENAMEDArea } from '@darwin-education/shared'

interface StudyPath {
  id: string
  title: string
  description: string | null
  area: ENAMEDArea
  module_count: number
  estimated_hours: number
  progress: number
  difficulty:
    | 'beginner'
    | 'intermediate'
    | 'advanced'
    | 'muito_facil'
    | 'facil'
    | 'medio'
    | 'dificil'
    | 'muito_dificil'
  created_at: string
}


const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
  muito_facil: 'bg-emerald-500/20 text-emerald-300',
  facil: 'bg-green-500/20 text-green-400',
  medio: 'bg-yellow-500/20 text-yellow-400',
  dificil: 'bg-orange-500/20 text-orange-400',
  muito_dificil: 'bg-red-500/20 text-red-400',
}

export default function TrilhasPage() {
  const router = useRouter()
  const [paths, setPaths] = useState<StudyPath[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ENAMEDArea | 'all'>('all')

  useEffect(() => {
    loadPaths()
  }, [])

  async function loadPaths() {
    setLoading(true)
    setLoadError(null)

    try {
      const supabase = createClient()
      const user = await getSessionUserSummary(supabase)

      // Load all study paths (compat with schema variations in local beta)
      const queryAttempts: Array<{
        select: string
        usesAreasArray: boolean
        filterPublished: boolean
        publishedColumn?: 'is_public' | 'is_published'
        orderBy: string
        ascending: boolean
      }> = [
        {
          select: `
            id,
            title,
            description,
            areas,
            difficulty,
            estimated_hours,
            created_at,
            is_public
          `,
          usesAreasArray: true,
          filterPublished: true,
          publishedColumn: 'is_public',
          orderBy: 'created_at',
          ascending: false,
        },
        {
          select: `
            id,
            title,
            description,
            area,
            difficulty,
            estimated_hours,
            created_at,
            is_published
          `,
          usesAreasArray: false,
          filterPublished: true,
          publishedColumn: 'is_published',
          orderBy: 'area',
          ascending: true,
        },
        {
          select: `
            id,
            title,
            description,
            area,
            difficulty,
            estimated_hours,
            created_at
          `,
          usesAreasArray: false,
          filterPublished: false,
          orderBy: 'created_at',
          ascending: false,
        },
        {
          select: `
            id,
            title,
            description,
            areas,
            difficulty,
            estimated_hours,
            created_at
          `,
          usesAreasArray: true,
          filterPublished: false,
          orderBy: 'created_at',
          ascending: false,
        },
      ]

      let pathsData: any[] | null = null
      let pathsError: any = null
      let usesAreasArray = false

      for (const attempt of queryAttempts) {
        let query = (supabase
          .from('study_paths') as any)
          .select(attempt.select)

        if (attempt.filterPublished && attempt.publishedColumn) {
          query = query.eq(attempt.publishedColumn, true)
        }

        const { data, error } = await query.order(attempt.orderBy, { ascending: attempt.ascending })
        if (!error) {
          pathsData = data as any[] | null
          pathsError = null
          usesAreasArray = attempt.usesAreasArray
          break
        }

        pathsError = error
      }

      if (pathsError) {
        console.error('Erro ao carregar trilhas:', pathsError)
        setPaths([])
        setLoadError('Não foi possível carregar as trilhas agora. Verifique sua conexão e tente novamente.')
        return
      }

      if (pathsData) {
        const pathIds = pathsData.map((path: any) => path.id).filter(Boolean)
        let moduleCountByPath: Record<string, number> = {}

        if (pathIds.length > 0) {
          const { data: modulesData } = await (supabase
            .from('study_modules') as any)
            .select('id, path_id')
            .in('path_id', pathIds)

          if (modulesData) {
            moduleCountByPath = modulesData.reduce((acc: Record<string, number>, module: any) => {
              const pathId = module.path_id as string
              acc[pathId] = (acc[pathId] || 0) + 1
              return acc
            }, {})
          }
        }

        // Get user progress for each path
        let userProgress: Record<string, number> = {}

        if (user) {
          const { data: progressData } = await (supabase
            .from('user_path_progress') as any)
            .select('path_id, completed_modules')
            .eq('user_id', user.id)

          if (progressData) {
            userProgress = progressData.reduce((acc: Record<string, number>, p: any) => {
              acc[p.path_id] = p.completed_modules?.length || 0
              return acc
            }, {})
          }
        }

        const formattedPaths: StudyPath[] = pathsData.map((path: any) => {
          const moduleCount = moduleCountByPath[path.id] || 0
          const resolvedArea = usesAreasArray
            ? ((path.areas?.[0] as ENAMEDArea) || 'clinica_medica')
            : ((path.area as ENAMEDArea) || 'clinica_medica')
          const estimatedHours =
            typeof path.estimated_hours === 'number' && path.estimated_hours > 0
              ? path.estimated_hours
              : moduleCount > 0
                ? Number((moduleCount * 0.75).toFixed(1))
                : 0

          return {
            id: path.id,
            title: path.title,
            description: path.description,
            area: resolvedArea,
            module_count: moduleCount,
            estimated_hours: estimatedHours,
            progress: moduleCount
              ? Math.round((userProgress[path.id] || 0) / moduleCount * 100)
              : 0,
            difficulty: path.difficulty || 'medio',
            created_at: path.created_at,
          }
        })
        setPaths(formattedPaths)
      }
    } catch (error) {
      console.error('Erro ao carregar trilhas:', error)
      setPaths([])
      setLoadError('Falha ao carregar as trilhas. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  const filteredPaths = filter === 'all'
    ? paths
    : paths.filter(p => p.area === filter)

  const inProgressPaths = paths.filter(p => p.progress > 0 && p.progress < 100)
  const completedPaths = paths.filter(p => p.progress === 100)

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-label-primary mb-2">Trilhas de estudo</h1>
          <p className="text-label-secondary">Roteiros estruturados para dominar cada área</p>
        </div>

        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/trilhas-cover-photo-01.png"
            alt="Banner das trilhas de estudo"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/35" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Trilhas guiadas para evolução por área.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Organize seus estudos em módulos progressivos e acompanhe cada etapa.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <FeatureState
              kind="loading"
              title="Carregando trilhas"
              description="Buscando trilhas publicadas e progresso para montar sua visão de estudo."
            />
            <SkeletonGrid items={6} columns={3} />
          </div>
        ) : loadError ? (
          <FeatureState
            kind="error"
            title="Não foi possível carregar as trilhas"
            description={loadError}
            action={{ label: 'Tentar novamente', onClick: () => void loadPaths(), variant: 'secondary' }}
            className="mb-8"
          />
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-emerald-500/20 p-3">
                      <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{paths.length}</p>
                      <p className="text-sm text-label-secondary">Trilhas disponíveis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-500/20 p-3">
                      <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{inProgressPaths.length}</p>
                      <p className="text-sm text-label-secondary">Em andamento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-yellow-500/20 p-3">
                      <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div>
                <h2 className="mb-4 text-lg font-semibold text-label-primary">Continue estudando</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {inProgressPaths.slice(0, 2).map((path) => (
                    <Link key={path.id} href={`/trilhas/${path.id}`}>
                      <Card className="cursor-pointer bg-gradient-to-r from-surface-2 to-surface-1 transition-colors hover:border-surface-4">
                        <CardContent className="py-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-semibold text-label-primary">{path.title}</h3>
                            <span className={`rounded border px-2 py-1 text-xs ${AREA_COLORS[path.area]?.badge}`}>
                              {AREA_LABELS[path.area]}
                            </span>
                          </div>
                          <div className="mb-2">
                            <div className="mb-1 flex justify-between text-sm text-label-secondary">
                              <span>Progresso</span>
                              <span>{path.progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-surface-3">
                              <div
                                className="h-2 rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${path.progress}%` }}
                              />
                            </div>
                          </div>
                          <Button size="small" className="mt-2 w-full">
                            Continuar
                            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`darwin-focus-ring whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                Todas
              </button>
              {(Object.keys(AREA_LABELS) as ENAMEDArea[]).map((area) => (
                <button
                  key={area}
                  onClick={() => setFilter(area)}
                  className={`darwin-focus-ring whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === area
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                  }`}
                >
                  {AREA_LABELS[area]}
                </button>
              ))}
            </div>

            {/* Paths Grid */}
            {filteredPaths.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <svg className="mx-auto mb-4 h-16 w-16 text-label-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <h3 className="mb-2 text-lg font-medium text-label-primary">
                    {filter === 'all' ? 'Nenhuma trilha disponível' : 'Nenhuma trilha nesta área'}
                  </h3>
                  <p className="mb-6 text-label-secondary">Ainda não há trilhas publicadas para este filtro.</p>
                  <div className="mx-auto max-w-xs space-y-2">
                    <Button onClick={() => setFilter('all')} fullWidth>
                      Ver todas as áreas
                    </Button>
                    <Button variant="bordered" onClick={() => router.push('/conteudo')} fullWidth>
                      Estudar no conteúdo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPaths.map((path) => (
                  <Link key={path.id} href={`/trilhas/${path.id}`}>
                    <Card className="h-full cursor-pointer transition-colors hover:border-surface-4">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{path.title}</CardTitle>
                          {path.progress === 100 && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
                              Concluída
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className={`rounded border px-2 py-1 text-xs ${AREA_COLORS[path.area]?.badge}`}>
                            {AREA_LABELS[path.area]}
                          </span>
                          <span className={`rounded px-2 py-1 text-xs ${difficultyColors[path.difficulty]}`}>
                            {difficultyLabels[path.difficulty]}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {path.description && (
                          <p className="mb-4 line-clamp-2 text-sm text-label-secondary">{path.description}</p>
                        )}

                        {/* Progress bar */}
                        {path.progress > 0 && (
                          <div className="mb-4">
                            <div className="mb-1 flex justify-between text-sm text-label-secondary">
                              <span>Progresso</span>
                              <span>{path.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-surface-3">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${path.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-label-secondary">
                          <div className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>{path.module_count} módulos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{path.estimated_hours > 0 ? `${path.estimated_hours}h` : 'A definir'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <BibliographyBlock
            title="Referências (método de estudo)"
            entries={[...STUDY_METHODS_BIBLIOGRAPHY.active_recall, ...STUDY_METHODS_BIBLIOGRAPHY.spaced_repetition]}
          />
        </div>
      </div>
    </div>
  )
}
