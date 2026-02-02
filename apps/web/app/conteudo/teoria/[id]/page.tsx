'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
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

  const sections = [
    { key: 'definition', label: 'Definição', icon: '📖' },
    { key: 'epidemiology', label: 'Epidemiologia', icon: '📊' },
    { key: 'pathophysiology', label: 'Fisiopatologia', icon: '🔬' },
    { key: 'clinicalPresentation', label: 'Apresentação Clínica', icon: '🏥' },
    { key: 'diagnosis', label: 'Diagnóstico', icon: '🔍' },
    { key: 'treatment', label: 'Tratamento', icon: '💊' },
    { key: 'complications', label: 'Complicações', icon: '⚠️' },
    { key: 'prognosis', label: 'Prognóstico', icon: '📈' },
  ]

  const availableSections = sections.filter(
    s => topic.sections[s.key as keyof typeof topic.sections]
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/conteudo/teoria')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{topic.title}</h1>
              <p className="text-sm text-slate-400 mt-1">Teoria Clínica - Conteúdo Educativo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <Card className="mb-6 border-violet-500/50 bg-slate-900/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Especialidade</p>
                <p className="text-lg font-semibold text-violet-400">{topic.area}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Dificuldade</p>
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
                <p className="text-xs text-slate-400 uppercase tracking-wide">Tempo de Leitura</p>
                <p className="text-lg font-semibold text-blue-400">{topic.estimatedReadTime} min</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Pontos-Chave</p>
                <p className="text-lg font-semibold text-emerald-400">{topic.keyPoints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">{topic.description}</p>

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
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <h2 className="text-lg font-semibold text-white">{section.label}</h2>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {isExpanded && (
                  <CardContent className="px-6 py-4 border-t border-slate-800">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
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
              <span>✨</span> Pontos-Chave para Memorizar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topic.keyPoints.map((point, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-slate-300 pt-0.5">{point}</span>
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
                <span>🔗</span> Conteúdo Relacionado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topic.relatedDiseases && topic.relatedDiseases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Doenças Relacionadas:</h3>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedDiseases.map((disease) => (
                      <Link
                        key={disease}
                        href={`/conteudo/doencas?q=${encodeURIComponent(disease)}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                      >
                        {disease}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {topic.relatedMedications && topic.relatedMedications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Medicamentos Relacionados:</h3>
                  <div className="flex flex-wrap gap-2">
                    {topic.relatedMedications.map((med) => (
                      <Link
                        key={med}
                        href={`/conteudo/medicamentos?q=${encodeURIComponent(med)}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
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
                <span>📚</span> Referências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {topic.references.map((ref, idx) => (
                  <li key={idx} className="text-slate-400 text-sm flex gap-2">
                    <span className="text-slate-500">{idx + 1}.</span>
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
          <Link
            href="/conteudo/teoria"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
          >
            ← Voltar para Teoria
          </Link>
          <Link
            href="/conteudo"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-sm font-medium"
          >
            Voltar para Conteúdo
          </Link>
        </div>
      </main>
    </div>
  )
}
