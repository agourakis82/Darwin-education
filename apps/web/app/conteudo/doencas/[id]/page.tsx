'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getDiseaseById, type DiseaseDetail } from '@/lib/adapters/medical-data'

export default function DiseaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const diseaseId = params.id as string

  const [disease, setDisease] = useState<DiseaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    // Fetch disease from @darwin-mfc/medical-data
    const diseaseData = getDiseaseById(diseaseId)
    setDisease(diseaseData)
    setLoading(false)
  }, [diseaseId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!disease) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Doença não encontrada</p>
            <Button onClick={() => router.push('/conteudo/doencas')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sections = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'clinical', label: 'Clínica' },
    { id: 'diagnosis', label: 'Diagnóstico' },
    { id: 'treatment', label: 'Tratamento' },
    { id: 'prognosis', label: 'Prognóstico' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/conteudo/doencas')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{disease.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                  {disease.icd10}
                </span>
                <span className="text-sm text-emerald-400">{disease.area}</span>
                {disease.subspecialty && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-sm text-slate-400">{disease.subspecialty}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Section Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Overview */}
          {activeSection === 'overview' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{disease.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Epidemiologia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{disease.epidemiology}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fisiopatologia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{disease.pathophysiology}</p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Clinical Presentation */}
          {activeSection === 'clinical' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Apresentação Clínica</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {disease.clinicalPresentation.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Complicações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {disease.complications.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* Diagnosis */}
          {activeSection === 'diagnosis' && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {disease.diagnosis.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Treatment */}
          {activeSection === 'treatment' && (
            <Card>
              <CardHeader>
                <CardTitle>Tratamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {disease.treatment.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Prognosis */}
          {activeSection === 'prognosis' && (
            <Card>
              <CardHeader>
                <CardTitle>Prognóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{disease.prognosis}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Flashcard
                </Button>
                <Link href={`/simulado?topic=${encodeURIComponent(disease.name)}`}>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Questões Relacionadas
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
