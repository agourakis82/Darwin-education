import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronLeft,
  Link2,
  Microscope,
  Pill,
  Search,
  Sparkles,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TheoryProvenanceBlock } from '@/components/content/TheoryProvenanceBlock'
import { TheoryReferencesBlock } from '@/components/content/TheoryReferencesBlock'
import { type TheoryTopic } from '@/lib/data/theory-content'
import { getTheoryTopicById } from '@/lib/medical'
import { QuestionGenerator } from './QuestionGenerator'

const DIFFICULTY_COLORS: Record<TheoryTopic['difficulty'], string> = {
  basico: 'text-green-400',
  intermediario: 'text-yellow-400',
  avancado: 'text-red-400',
}

const DIFFICULTY_LABELS: Record<TheoryTopic['difficulty'], string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

const sections: Array<{ key: keyof TheoryTopic['sections']; label: string; icon: ReactNode }> = [
  { key: 'definition', label: 'Definição', icon: <BookOpen className="w-5 h-5" /> },
  { key: 'epidemiology', label: 'Epidemiologia', icon: <BarChart3 className="w-5 h-5" /> },
  { key: 'pathophysiology', label: 'Fisiopatologia', icon: <Microscope className="w-5 h-5" /> },
  { key: 'clinicalPresentation', label: 'Apresentação Clínica', icon: <Stethoscope className="w-5 h-5" /> },
  { key: 'diagnosis', label: 'Diagnóstico', icon: <Search className="w-5 h-5" /> },
  { key: 'treatment', label: 'Tratamento', icon: <Pill className="w-5 h-5" /> },
  { key: 'complications', label: 'Complicações', icon: <AlertTriangle className="w-5 h-5" /> },
  { key: 'prognosis', label: 'Prognóstico', icon: <TrendingUp className="w-5 h-5" /> },
]

export default async function TeoriaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getTheoryTopicById(id)
  const topic = result.data

  if (!topic) {
    notFound()
  }

  const availableSections = sections.filter((section) => {
    const content = topic.sections[section.key]
    return typeof content === 'string' && content.trim().length > 0
  })

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/conteudo/teoria">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{topic.title}</h1>
              <p className="text-sm text-label-secondary mt-1">Teoria Clínica - Conteúdo Educativo</p>
              {result.source === 'fallback' && (
                <p className="text-xs text-label-tertiary mt-1">
                  Conteúdo local de backup em uso para este tópico.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 border-violet-500/50 bg-surface-1/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-label-secondary uppercase tracking-wide">Especialidade</p>
                <p className="text-lg font-semibold text-violet-400">{topic.area}</p>
              </div>
              <div>
                <p className="text-xs text-label-secondary uppercase tracking-wide">Dificuldade</p>
                <p className={`text-lg font-semibold ${DIFFICULTY_COLORS[topic.difficulty]}`}>
                  {DIFFICULTY_LABELS[topic.difficulty]}
                </p>
              </div>
              <div>
                <p className="text-xs text-label-secondary uppercase tracking-wide">Tempo de Leitura</p>
                <p className="text-lg font-semibold text-blue-400">{topic.estimatedReadTime} min</p>
              </div>
              <div>
                <p className="text-xs text-label-secondary uppercase tracking-wide">Pontos-Chave</p>
                <p className="text-lg font-semibold text-emerald-400">{topic.keyPoints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-lg text-label-primary mb-8 leading-relaxed">{topic.description}</p>

        <div className="space-y-4 mb-8">
          {availableSections.map((section) => {
            const content = topic.sections[section.key]
            if (!content) return null

            return (
              <Card key={section.key} className="overflow-hidden">
                <details open={section.key === 'definition'} className="group">
                  <summary className="list-none cursor-pointer px-6 py-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-label-secondary">{section.icon}</span>
                      <h2 className="text-lg font-semibold text-label-primary">{section.label}</h2>
                    </div>
                    <span className="text-label-secondary text-sm group-open:hidden">Expandir</span>
                    <span className="text-label-secondary text-sm hidden group-open:inline">Recolher</span>
                  </summary>
                  <CardContent className="px-6 py-4 border-t border-separator">
                    <p className="text-label-primary leading-relaxed whitespace-pre-wrap">{content}</p>
                  </CardContent>
                </details>
              </Card>
            )
          })}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Pontos-Chave para Memorizar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topic.keyPoints.map((point, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-label-primary pt-0.5">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {((topic.relatedDiseases?.length ?? 0) > 0 || (topic.relatedMedications?.length ?? 0) > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" /> Conteúdo Relacionado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topic.relatedDiseases && topic.relatedDiseases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-label-primary mb-2">Doenças Relacionadas:</h3>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedDiseases.map((disease) => (
                      <Link
                        key={disease}
                        href={`/conteudo/doencas?q=${encodeURIComponent(disease)}`}
                        className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-label-primary transition-colors"
                      >
                        {disease}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {topic.relatedMedications && topic.relatedMedications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-label-primary mb-2">Medicamentos Relacionados:</h3>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedMedications.map((medication) => (
                      <Link
                        key={medication}
                        href={`/conteudo/medicamentos?q=${encodeURIComponent(medication)}`}
                        className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-label-primary transition-colors"
                      >
                        {medication}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <TheoryProvenanceBlock source={result.source} meta={result.meta} />
          <TheoryReferencesBlock citations={result.citations} fallbackReferences={topic.references || null} />
        </div>

        <QuestionGenerator topic={topic} />

        <div className="mt-8 flex gap-4">
          <Button variant="secondary" asChild>
            <Link href="/conteudo/teoria">
              <ChevronLeft className="w-4 h-4" /> Voltar para Teoria
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/conteudo">
              Voltar para Conteúdo
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
