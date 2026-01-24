'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface MedicationDetail {
  id: string
  name: string
  genericName: string
  atcCode: string
  drugClass: string
  mechanism: string
  summary: string
  pharmacokinetics: {
    absorption: string
    distribution: string
    metabolism: string
    elimination: string
    halfLife: string
  }
  indications: string[]
  contraindications: string[]
  adverseEffects: string[]
  interactions: string[]
  dosing: {
    adult: string
    pediatric?: string
    renal?: string
    hepatic?: string
  }
  pregnancy: string
  monitoring: string[]
}

// Mock data
const mockMedicationDetail: MedicationDetail = {
  id: '1',
  name: 'Amoxicilina',
  genericName: 'Amoxicilina',
  atcCode: 'J01CA04',
  drugClass: 'Antibióticos (Penicilinas)',
  mechanism: 'A amoxicilina inibe a síntese da parede celular bacteriana ao se ligar às proteínas ligadoras de penicilina (PBPs), enzimas essenciais para a síntese de peptidoglicano. Isso resulta em lise osmótica e morte da bactéria.',
  summary: 'Antibiótico beta-lactâmico de amplo espectro, primeira escolha para infecções respiratórias comunitárias.',
  pharmacokinetics: {
    absorption: 'Bem absorvida por via oral (biodisponibilidade ~95%), não afetada por alimentos',
    distribution: 'Boa penetração em tecidos, incluindo ouvido médio, seios paranasais, amígdalas. Atravessa barreira hematoencefálica em meninges inflamadas.',
    metabolism: 'Metabolismo hepático limitado (~30%)',
    elimination: 'Principalmente renal (60-70% inalterada na urina)',
    halfLife: '1-1.5 horas (aumentada em insuficiência renal)',
  },
  indications: [
    'Infecções do trato respiratório superior: otite média, sinusite, faringite bacteriana',
    'Infecções do trato respiratório inferior: pneumonia adquirida na comunidade',
    'Infecções urinárias não complicadas',
    'Erradicação de H. pylori (em combinação)',
    'Profilaxia de endocardite bacteriana',
    'Doença de Lyme (estágios iniciais)',
  ],
  contraindications: [
    'Hipersensibilidade a penicilinas',
    'História de reação alérgica grave a cefalosporinas (contraindicação relativa)',
    'Mononucleose infecciosa (risco de rash)',
  ],
  adverseEffects: [
    'Gastrointestinais: diarreia (muito comum), náusea, vômitos',
    'Dermatológicos: rash maculopapular, urticária',
    'Hipersensibilidade: anafilaxia (raro), angioedema',
    'Colite por Clostridioides difficile',
    'Superinfecção por Candida',
  ],
  interactions: [
    'Metotrexato: redução da excreção renal do metotrexato',
    'Alopurinol: aumento do risco de rash',
    'Anticoagulantes orais: possível aumento do efeito anticoagulante',
    'Contraceptivos orais: possível redução da eficácia (controverso)',
    'Probenecida: aumento dos níveis séricos de amoxicilina',
  ],
  dosing: {
    adult: '250-500 mg a cada 8 horas ou 500-875 mg a cada 12 horas. Dose máxima: 3g/dia',
    pediatric: '25-50 mg/kg/dia divididos em 8-12 horas. Para otite média: 80-90 mg/kg/dia',
    renal: 'ClCr 10-30: intervalo de 12h. ClCr <10: intervalo de 24h',
    hepatic: 'Não requer ajuste',
  },
  pregnancy: 'Categoria B. Considerada segura na gestação. Atravessa a barreira placentária, mas não há evidência de teratogenicidade.',
  monitoring: [
    'Sinais de reação alérgica nas primeiras doses',
    'Função renal em tratamentos prolongados',
    'Sinais de superinfecção',
    'Resposta clínica após 48-72 horas',
  ],
}

export default function MedicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const medicationId = params.id as string

  const [medication, setMedication] = useState<MedicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    // In real app, fetch from API or medical-data package
    setMedication(mockMedicationDetail)
    setLoading(false)
  }, [medicationId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!medication) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Medicamento não encontrado</p>
            <Button onClick={() => router.push('/conteudo/medicamentos')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sections = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'pharmacokinetics', label: 'Farmacocinética' },
    { id: 'clinical', label: 'Uso Clínico' },
    { id: 'safety', label: 'Segurança' },
    { id: 'dosing', label: 'Dosagem' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/conteudo/medicamentos')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{medication.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                  {medication.atcCode}
                </span>
                <span className="text-sm text-blue-400">{medication.drugClass}</span>
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
                    ? 'text-blue-400 border-b-2 border-blue-400'
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
                  <p className="text-slate-300 leading-relaxed">{medication.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mecanismo de Ação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{medication.mechanism}</p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Pharmacokinetics */}
          {activeSection === 'pharmacokinetics' && (
            <Card>
              <CardHeader>
                <CardTitle>Farmacocinética</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(medication.pharmacokinetics).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      absorption: 'Absorção',
                      distribution: 'Distribuição',
                      metabolism: 'Metabolismo',
                      elimination: 'Eliminação',
                      halfLife: 'Meia-vida',
                    }
                    return (
                      <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-sm font-medium text-blue-400 mb-1">{labels[key]}</p>
                        <p className="text-slate-300">{value}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clinical Use */}
          {activeSection === 'clinical' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Indicações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {medication.indications.map((item, index) => (
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
                  <CardTitle>Contraindicações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {medication.contraindications.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* Safety */}
          {activeSection === 'safety' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Efeitos Adversos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {medication.adverseEffects.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interações Medicamentosas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {medication.interactions.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gestação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{medication.pregnancy}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monitoramento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {medication.monitoring.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* Dosing */}
          {activeSection === 'dosing' && (
            <Card>
              <CardHeader>
                <CardTitle>Posologia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm font-medium text-emerald-400 mb-2">Adultos</p>
                    <p className="text-slate-300">{medication.dosing.adult}</p>
                  </div>

                  {medication.dosing.pediatric && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm font-medium text-green-400 mb-2">Pediatria</p>
                      <p className="text-slate-300">{medication.dosing.pediatric}</p>
                    </div>
                  )}

                  {medication.dosing.renal && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-400 mb-2">Insuficiência Renal</p>
                      <p className="text-slate-300">{medication.dosing.renal}</p>
                    </div>
                  )}

                  {medication.dosing.hepatic && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm font-medium text-orange-400 mb-2">Insuficiência Hepática</p>
                      <p className="text-slate-300">{medication.dosing.hepatic}</p>
                    </div>
                  )}
                </div>
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
                <Link href={`/simulado?topic=${encodeURIComponent(medication.name)}`}>
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
