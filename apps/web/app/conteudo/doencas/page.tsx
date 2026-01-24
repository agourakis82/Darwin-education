'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ContentSearch } from '../components/ContentSearch'

interface Disease {
  id: string
  name: string
  icd10: string
  area: string
  subspecialty: string | null
  summary: string
}

const areas = [
  'Todas',
  'Clínica Médica',
  'Cirurgia',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Saúde Coletiva',
  'Emergência',
]

// Mock data - in real app, this would come from @darwin-mfc/medical-data
const mockDiseases: Disease[] = [
  {
    id: '1',
    name: 'Insuficiência Cardíaca Congestiva',
    icd10: 'I50',
    area: 'Clínica Médica',
    subspecialty: 'Cardiologia',
    summary: 'Síndrome clínica complexa resultante de qualquer comprometimento estrutural ou funcional do enchimento ou ejeção ventricular.',
  },
  {
    id: '2',
    name: 'Diabetes Mellitus Tipo 2',
    icd10: 'E11',
    area: 'Clínica Médica',
    subspecialty: 'Endocrinologia',
    summary: 'Distúrbio metabólico caracterizado por hiperglicemia crônica com alterações no metabolismo de carboidratos, lipídios e proteínas.',
  },
  {
    id: '3',
    name: 'Pneumonia Adquirida na Comunidade',
    icd10: 'J18',
    area: 'Clínica Médica',
    subspecialty: 'Pneumologia',
    summary: 'Infecção aguda do parênquima pulmonar adquirida fora do ambiente hospitalar.',
  },
  {
    id: '4',
    name: 'Apendicite Aguda',
    icd10: 'K35',
    area: 'Cirurgia',
    subspecialty: 'Cirurgia Geral',
    summary: 'Inflamação aguda do apêndice vermiforme, sendo a causa mais comum de abdome agudo cirúrgico.',
  },
  {
    id: '5',
    name: 'Pré-eclâmpsia',
    icd10: 'O14',
    area: 'Ginecologia e Obstetrícia',
    subspecialty: 'Obstetrícia',
    summary: 'Síndrome hipertensiva específica da gestação, caracterizada por hipertensão arterial e proteinúria após 20 semanas.',
  },
  {
    id: '6',
    name: 'Bronquiolite Viral Aguda',
    icd10: 'J21',
    area: 'Pediatria',
    subspecialty: 'Pneumologia Pediátrica',
    summary: 'Infecção viral das vias aéreas inferiores, comum em lactentes menores de 2 anos.',
  },
  {
    id: '7',
    name: 'Hipertensão Arterial Sistêmica',
    icd10: 'I10',
    area: 'Clínica Médica',
    subspecialty: 'Cardiologia',
    summary: 'Condição clínica multifatorial caracterizada por elevação sustentada dos níveis pressóricos.',
  },
  {
    id: '8',
    name: 'Colecistite Aguda',
    icd10: 'K81',
    area: 'Cirurgia',
    subspecialty: 'Cirurgia Geral',
    summary: 'Inflamação aguda da vesícula biliar, geralmente associada à colelitíase.',
  },
]

function DoencasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [diseases, setDiseases] = useState<Disease[]>(mockDiseases)
  const [loading, setLoading] = useState(false)
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || 'Todas')
  const query = searchParams.get('q') || ''

  useEffect(() => {
    // Filter diseases based on search and area
    let filtered = mockDiseases

    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        d =>
          d.name.toLowerCase().includes(lowerQuery) ||
          d.icd10.toLowerCase().includes(lowerQuery) ||
          d.summary.toLowerCase().includes(lowerQuery)
      )
    }

    if (selectedArea !== 'Todas') {
      filtered = filtered.filter(d => d.area === selectedArea)
    }

    setDiseases(filtered)
  }, [query, selectedArea])

  const handleAreaChange = (area: string) => {
    setSelectedArea(area)
    const params = new URLSearchParams(searchParams.toString())
    if (area === 'Todas') {
      params.delete('area')
    } else {
      params.set('area', area)
    }
    router.push(`/conteudo/doencas?${params.toString()}`)
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
              <h1 className="text-2xl font-bold">Doenças</h1>
              <p className="text-sm text-slate-400 mt-1">
                {diseases.length} condições encontradas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <ContentSearch
            type="doencas"
            placeholder="Buscar por nome, CID-10 ou sintomas..."
          />
        </div>

        {/* Area Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => handleAreaChange(area)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedArea === area
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : diseases.length === 0 ? (
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
          <div className="space-y-4">
            {diseases.map((disease) => (
              <Link key={disease.id} href={`/conteudo/doencas/${disease.id}`}>
                <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{disease.name}</h3>
                          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                            {disease.icd10}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-emerald-400">{disease.area}</span>
                          {disease.subspecialty && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-sm text-slate-400">{disease.subspecialty}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {disease.summary}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-slate-500 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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

export default function DoencasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    }>
      <DoencasContent />
    </Suspense>
  )
}
