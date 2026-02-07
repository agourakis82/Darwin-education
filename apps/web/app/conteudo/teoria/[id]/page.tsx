'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { BookOpen, BarChart3, Microscope, Stethoscope, Search, Pill, AlertTriangle, TrendingUp, Sparkles, Link2, BookMarked, ChevronDown, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getTopicById } from '@/lib/data/theory-content'
import { QuestionGenerator } from './QuestionGenerator'
import { notFound } from 'next/navigation'

export default function TeoriaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const topic = getTopicById(params.id as string)
  const [expandedSection, setExpandedSection] = useState<string | null>('definition')

  if (!topic) {
    return notFound()
  }

  const sections: { key: string; label: string; icon: ReactNode }[] = [
    { key: 'definition', label: 'Definição', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'epidemiology', label: 'Epidemiologia', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'pathophysiology', label: 'Fisiopatologia', icon: <Microscope className="w-5 h-5" /> },
    { key: 'clinicalPresentation', label: 'Apresentação Clínica', icon: <Stethoscope className="w-5 h-5" /> },
    { key: 'diagnosis', label: 'Diagnóstico', icon: <Search className="w-5 h-5" /> },
    { key: 'treatment', label: 'Tratamento', icon: <Pill className="w-5 h-5" /> },
    { key: 'complications', label: 'Complicações', icon: <AlertTriangle className="w-5 h-5" /> },
    { key: 'prognosis', label: 'Prognóstico', icon: <TrendingUp className="w-5 h-5" /> },
  ]

  const availableSections = sections.filter(
    s => topic.sections[s.key as keyof typeof topic.sections]
  )

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/conteudo/teoria')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{topic.title}</h1>
              <p className="text-sm text-label-secondary mt-1">Teoria Clínica - Conteúdo Educativo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <Card className="mb-6 border-violet-500/50 bg-surface-1/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-label-secondary uppercase tracking-wide">Especialidade</p>
                <p className="text-lg font-semibold text-violet-400">{topic.area}</p>
              </div>
              <div>
                <p className="text-xs text-label-secondary uppercase tracking-wide">Dificuldade</p>
                <p className={`text-lg font-semibold ${
                  topic.difficulty === 'basico'
                    ? 'text-green-400'
                    : topic.difficulty === 'intermediario'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}>
                  {topic.difficulty === 'basico' ? 'Básico' : topic.difficulty === 'intermediario' ? 'Intermediário' : 'Avançado'}
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

        {/* Description */}
        <p className="text-lg text-label-primary mb-8 leading-relaxed">{topic.description}</p>

        {/* Content Sections */}
        <div className="space-y-4 mb-8">
          {availableSections.map((section) => {
            const content = topic.sections[section.key as keyof typeof topic.sections] as string | undefined
            const isExpanded = expandedSection === section.key

            if (!content) return null

            return (
              <Card key={section.key} className="overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-label-secondary">{section.icon}</span>
                    <h2 className="text-lg font-semibold text-white">{section.label}</h2>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-label-secondary transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`} />
                </button>

                {isExpanded && (
                  <CardContent className="px-6 py-4 border-t border-separator">
                    <p className="text-label-primary leading-relaxed whitespace-pre-wrap">{content}</p>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Key Points */}
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

        {/* Related Topics */}
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
                    {topic.relatedMedications.map((med) => (
                      <Link
                        key={med}
                        href={`/conteudo/medicamentos?q=${encodeURIComponent(med)}`}
                        className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm text-label-primary transition-colors"
                      >
                        {med}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* References */}
        {topic.references && topic.references.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="w-5 h-5" /> Referências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {topic.references.map((ref, idx) => (
                  <li key={idx} className="text-label-secondary text-sm flex gap-2">
                    <span className="text-label-tertiary">{idx + 1}.</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Question Generator */}
        <QuestionGenerator topic={topic} />

        {/* Navigation */}
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
