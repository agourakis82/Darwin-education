'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ContentSearch } from '../components/ContentSearch'
import { theoryTopics } from '@/lib/data/theory-content'

const areas = [
  'Todas',
  'Clínica Médica',
  'Cirurgia',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Saúde Coletiva',
]

const difficulties = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

export default function TeoriaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || 'Todas')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    searchParams.get('difficulty') || null
  )
  const query = searchParams.get('q') || ''

  const filteredTopics = useMemo(() => {
    let topics = theoryTopics

    if (query) {
      const lowerQuery = query.toLowerCase()
      topics = topics.filter(
        t =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.keyPoints.some(p => p.toLowerCase().includes(lowerQuery))
      )
    }

    if (selectedArea !== 'Todas') {
      topics = topics.filter(t => t.area === selectedArea)
    }

    if (selectedDifficulty) {
      topics = topics.filter(t => t.difficulty === selectedDifficulty)
    }

    return topics
  }, [query, selectedArea, selectedDifficulty])

  const handleAreaChange = (area: string) => {
    setSelectedArea(area)
    const params = new URLSearchParams(searchParams.toString())
    if (area === 'Todas') {
      params.delete('area')
    } else {
      params.set('area', area)
    }
    router.push(`/conteudo/teoria?${params.toString()}`)
  }

  const handleDifficultyChange = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty)
    const params = new URLSearchParams(searchParams.toString())
    if (difficulty) {
      params.set('difficulty', difficulty)
    } else {
      params.delete('difficulty')
    }
    router.push(`/conteudo/teoria?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/conteudo')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Teoria Clínica</h1>
              <p className="text-sm text-slate-400 mt-1">
                {filteredTopics.length} tópicos encontrados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <ContentSearch
            type="teoria"
            placeholder="Buscar por tópico, diagnóstico ou conceito..."
          />
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Area Filter */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Especialidade</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => handleAreaChange(area)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedArea === area
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Nível de Dificuldade</p>
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => handleDifficultyChange(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedDifficulty === null
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todos
              </button>
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => handleDifficultyChange(diff.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedDifficulty === diff.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredTopics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum resultado encontrado</h3>
              <p className="text-slate-400">
                Tente usar termos diferentes ou remover filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTopics.map((topic) => (
              <Link key={topic.id} href={`/conteudo/teoria/${topic.id}`}>
                <Card className="hover:border-slate-600 transition-colors cursor-pointer group">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-lg group-hover:text-violet-400 transition-colors">
                            {topic.title}
                          </h3>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            topic.difficulty === 'basico'
                              ? 'bg-green-500/20 text-green-400'
                              : topic.difficulty === 'intermediario'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {topic.difficulty === 'basico' ? 'Básico' : topic.difficulty === 'intermediario' ? 'Intermediário' : 'Avançado'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {topic.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span>📚</span>
                            <span>{topic.estimatedReadTime} min de leitura</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🏥</span>
                            <span>{topic.area}</span>
                          </span>
                          {topic.keyPoints.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>✓</span>
                              <span>{topic.keyPoints.length} pontos-chave</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-500 flex-shrink-0 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Learning Tip */}
        <Card className="mt-8">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">💡 Dica de Estudo</p>
                <p>
                  Leia o conteúdo teórico relacionado ANTES de fazer questões sobre um novo tópico.
                  Entender a fisiopatologia ajuda a resolver problemas clínicos com mais confiança e acelera o aprendizado.
                  Após resolver questões, volte ao conteúdo teórico para consolidar o aprendizado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
