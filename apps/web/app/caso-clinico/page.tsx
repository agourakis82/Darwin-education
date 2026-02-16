'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FeatureState } from '@/components/ui/FeatureState'
import { useCaseStudy } from '@/lib/hooks/useCaseStudy'
import { CaseStudyCard } from './components/CaseStudyCard'
import type { ENAMEDArea } from '@darwin-education/shared'

const AREAS: { key: ENAMEDArea; label: string; color: string }[] = [
  { key: 'clinica_medica', label: 'Clínica Médica', color: 'border-blue-500 bg-blue-900/30 text-blue-300' },
  { key: 'cirurgia', label: 'Cirurgia', color: 'border-red-500 bg-red-900/30 text-red-300' },
  { key: 'ginecologia_obstetricia', label: 'Ginecologia e Obstetrícia', color: 'border-pink-500 bg-pink-900/30 text-pink-300' },
  { key: 'pediatria', label: 'Pediatria', color: 'border-green-500 bg-green-900/30 text-green-300' },
  { key: 'saude_coletiva', label: 'Saúde Coletiva', color: 'border-purple-500 bg-purple-900/30 text-purple-300' },
]

const DIFFICULTIES = [
  { key: 'facil', label: 'Fácil', color: 'text-green-400 border-green-700' },
  { key: 'medio', label: 'Médio', color: 'text-yellow-400 border-yellow-700' },
  { key: 'dificil', label: 'Difícil', color: 'text-red-400 border-red-700' },
]

export default function CasoClinicoPage() {
  const [selectedArea, setSelectedArea] = useState<ENAMEDArea | null>(null)
  const [difficulty, setDifficulty] = useState('medio')
  const [topic, setTopic] = useState('')
  const { caseStudy, loading, error, fetchCaseStudy, reset } = useCaseStudy()

  const handleGenerate = () => {
    if (!selectedArea) return
    fetchCaseStudy({
      area: selectedArea,
      topic: topic.trim() || undefined,
      difficulty,
    })
  }

  const handleNewCase = () => {
    reset()
  }

  const showForm = !caseStudy && !loading

  return (
    <div className="min-h-screen bg-surface-0 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-label-primary mb-2">Caso Clínico Interativo</h1>
          <p className="text-label-secondary text-sm">
            Pratique raciocínio clínico com casos gerados por IA. Selecione a área e
            dificuldade, leia o caso, formule sua resposta e compare com a conduta ideal.
          </p>
        </div>
        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/caso-clinico-hero-apple-v1.png"
            alt="Visual de caso clínico interativo"
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/30" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Cenários clínicos com profundidade realista.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Treine tomada de decisão com foco em diagnóstico e conduta.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        {showForm && (
          <div className="space-y-6">
            {/* Area Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Área Médica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AREAS.map((area) => {
                    const isSelected = selectedArea === area.key
                    return (
                      <button
                        key={area.key}
                        onClick={() => setSelectedArea(area.key)}
                        className={`
                          p-3 rounded-lg border text-sm font-medium text-left transition-all
                          ${
                            isSelected
                              ? area.color
                              : 'border-separator text-label-secondary hover:border-surface-4 hover:text-label-primary'
                          }
                        `}
                      >
                        {area.label}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty */}
            <Card>
              <CardHeader>
                <CardTitle>Dificuldade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {DIFFICULTIES.map((d) => {
                    const isSelected = difficulty === d.key
                    return (
                      <button
                        key={d.key}
                        onClick={() => setDifficulty(d.key)}
                        className={`
                          px-4 py-2 rounded-lg border text-sm font-medium transition-all
                          ${
                            isSelected
                              ? d.color + ' bg-surface-2'
                              : 'border-separator text-label-tertiary hover:border-surface-4'
                          }
                        `}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Topic (optional) */}
            <Card>
              <CardHeader>
                <CardTitle>Tópico (opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Infarto agudo do miocárdio, Dengue, Pré-eclâmpsia..."
                  className="w-full bg-surface-2 border border-separator rounded-lg px-4 py-2.5 text-sm text-label-primary placeholder:text-label-tertiary focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <FeatureState
                kind="error"
                title="Não foi possível gerar o caso"
                description={error}
                compact
              />
            )}

            {/* Generate Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedArea}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Gerar Caso Clínico
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent>
              <FeatureState
                kind="loading"
                title="Gerando caso clínico"
                description="A IA está montando um cenário personalizado com foco na sua configuração."
              />
            </CardContent>
          </Card>
        )}

        {/* Error on generate */}
        {!loading && error && caseStudy === null && !showForm && (
          <div className="space-y-4">
            <FeatureState
              kind="error"
              title="Falha na geração"
              description={error}
              action={{ label: 'Voltar', onClick: handleNewCase, variant: 'secondary' }}
            />
          </div>
        )}

        {/* Case Study Result */}
        {caseStudy?.parsed && (
          <CaseStudyCard
            data={caseStudy.parsed}
            cached={caseStudy.cached}
            remaining={caseStudy.remaining}
            onNewCase={handleNewCase}
          />
        )}

        {/* Fallback: raw text if JSON parsing failed */}
        {caseStudy && !caseStudy.parsed && (
          <div className="space-y-4">
            <Card>
              <CardContent>
                <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">
                  {caseStudy.text}
                </p>
              </CardContent>
            </Card>
            <Button variant="outline" size="sm" onClick={handleNewCase}>
              Novo Caso Clínico
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
