import Link from 'next/link'
import { BookOpen, Stethoscope, Check, Lightbulb, ChevronRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { ContentSearch } from '../components/ContentSearch'
import { listTheoryTopics, type EnamedArea, type TheoryDifficulty } from '@/lib/medical'

const AREAS: Array<{ value: EnamedArea; label: string }> = [
  { value: 'clinica_medica', label: 'Clínica Médica' },
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'pediatria', label: 'Pediatria' },
  { value: 'ginecologia_obstetricia', label: 'Ginecologia e Obstetrícia' },
  { value: 'saude_coletiva', label: 'Saúde Coletiva' },
]

const DIFFICULTIES: Array<{ value: TheoryDifficulty; label: string }> = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

const AREA_LABEL_TO_VALUE = new Map<string, EnamedArea>(
  AREAS.map((item) => [item.label, item.value])
)
const AREA_VALUE_SET = new Set<EnamedArea>(AREAS.map((item) => item.value))
const DIFFICULTY_VALUE_SET = new Set<TheoryDifficulty>(
  DIFFICULTIES.map((item) => item.value)
)

type SearchParams = {
  q?: string
  area?: string
  difficulty?: string
}

function toPageHref({
  q,
  area,
  difficulty,
}: {
  q?: string
  area?: EnamedArea
  difficulty?: TheoryDifficulty
}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (area) params.set('area', area)
  if (difficulty) params.set('difficulty', difficulty)
  const query = params.toString()
  return query ? `/conteudo/teoria?${query}` : '/conteudo/teoria'
}

function getDifficultyBadgeClass(difficulty: TheoryDifficulty) {
  if (difficulty === 'basico') return 'bg-green-500/20 text-green-400'
  if (difficulty === 'intermediario') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-500/20 text-red-400'
}

function getDifficultyLabel(difficulty: TheoryDifficulty) {
  if (difficulty === 'basico') return 'Básico'
  if (difficulty === 'intermediario') return 'Intermediário'
  return 'Avançado'
}

export default async function TeoriaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = (params.q || '').trim()

  const selectedArea = AREA_VALUE_SET.has(params.area as EnamedArea)
    ? (params.area as EnamedArea)
    : AREA_LABEL_TO_VALUE.get(params.area || '')

  const selectedDifficulty = DIFFICULTY_VALUE_SET.has(params.difficulty as TheoryDifficulty)
    ? (params.difficulty as TheoryDifficulty)
    : undefined

  const result = await listTheoryTopics({
    q,
    area: selectedArea,
    difficulty: selectedDifficulty,
  })

  const topics = result.data

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/conteudo" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Teoria Clínica</h1>
              <p className="text-sm text-label-secondary mt-1">{topics.length} tópicos encontrados</p>
              {result.source === 'fallback' && (
                <p className="text-xs text-label-tertiary mt-1">
                  Conteúdo de backup local ativo enquanto a base dinâmica sincroniza.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <ContentSearch
            type="teoria"
            placeholder="Buscar por tópico, diagnóstico ou conceito..."
          />
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium text-label-primary mb-2">Especialidade</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Link
                href={toPageHref({ q, difficulty: selectedDifficulty })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  !selectedArea
                    ? 'bg-violet-600 text-white'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                Todas
              </Link>
              {AREAS.map((area) => (
                <Link
                  key={area.value}
                  href={toPageHref({ q, area: area.value, difficulty: selectedDifficulty })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedArea === area.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                  }`}
                >
                  {area.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-label-primary mb-2">Nível de Dificuldade</p>
            <div className="flex gap-2 pb-2">
              <Link
                href={toPageHref({ q, area: selectedArea })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  !selectedDifficulty
                    ? 'bg-violet-600 text-white'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                Todos
              </Link>
              {DIFFICULTIES.map((difficulty) => (
                <Link
                  key={difficulty.value}
                  href={toPageHref({ q, area: selectedArea, difficulty: difficulty.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedDifficulty === difficulty.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                  }`}
                >
                  {difficulty.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {topics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-16 h-16 text-label-quaternary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-label-primary mb-2">Nenhum resultado encontrado</h3>
              <p className="text-label-secondary">
                Tente usar termos diferentes ou remover filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Link key={topic.id} href={`/conteudo/teoria/${topic.id}`}>
                <Card className="hover:border-surface-4 transition-colors cursor-pointer group">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-label-primary text-lg group-hover:text-violet-400 transition-colors">
                            {topic.title}
                          </h3>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            getDifficultyBadgeClass(topic.difficulty)
                          }`}>
                            {getDifficultyLabel(topic.difficulty)}
                          </span>
                        </div>
                        <p className="text-sm text-label-secondary mb-3 line-clamp-2">
                          {topic.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-label-tertiary">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{topic.estimatedReadTime} min de leitura</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>{topic.area}</span>
                          </span>
                          {topic.keyPoints.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>{topic.keyPoints.length} pontos-chave</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-label-tertiary flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-label-secondary">
                <p className="font-medium text-label-primary mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Dica de Estudo</p>
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
