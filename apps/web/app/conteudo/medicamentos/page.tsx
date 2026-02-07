'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { ContentSearch } from '../components/ContentSearch'
import { medications as allMedications, getAllDrugClasses, type MedicationItem } from '@/lib/adapters/medical-data'

const drugClasses = ['Todas', ...getAllDrugClasses()]

function MedicamentosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [medications, setMedications] = useState<MedicationItem[]>(allMedications)
  const [loading, setLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState(searchParams.get('classe') || 'Todas')
  const query = searchParams.get('q') || ''

  useEffect(() => {
    // Filter medications based on search and class
    let filtered = allMedications

    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(
        m =>
          m.name.toLowerCase().includes(lowerQuery) ||
          m.genericName.toLowerCase().includes(lowerQuery) ||
          m.atcCode.toLowerCase().includes(lowerQuery) ||
          m.mechanism.toLowerCase().includes(lowerQuery)
      )
    }

    if (selectedClass !== 'Todas') {
      filtered = filtered.filter(m => m.drugClass === selectedClass)
    }

    setMedications(filtered)
  }, [query, selectedClass])

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls)
    const params = new URLSearchParams(searchParams.toString())
    if (cls === 'Todas') {
      params.delete('classe')
    } else {
      params.set('classe', cls)
    }
    router.push(`/conteudo/medicamentos?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/conteudo')}
              className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Medicamentos</h1>
              <p className="text-sm text-label-secondary mt-1">
                {medications.length} medicamentos encontrados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <ContentSearch
            type="medicamentos"
            placeholder="Buscar por nome, classe ou mecanismo..."
          />
        </div>

        {/* Class Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {drugClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => handleClassChange(cls)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedClass === cls
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-2 text-label-primary hover:bg-surface-3'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-surface-2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : medications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="w-16 h-16 text-label-quaternary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Nenhum resultado encontrado</h3>
              <p className="text-label-secondary">
                Tente usar termos diferentes ou remover filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {medications.map((med) => (
              <Link key={med.id} href={`/conteudo/medicamentos/${med.id}`}>
                <Card className="hover:border-surface-4 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{med.name}</h3>
                          <span className="px-2 py-0.5 text-xs bg-surface-3 text-label-primary rounded">
                            {med.atcCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-blue-400">{med.drugClass}</span>
                          <span className="text-label-quaternary">•</span>
                          <span className="text-sm text-label-secondary">{med.genericName}</span>
                        </div>
                        <p className="text-sm text-label-secondary line-clamp-2">
                          {med.summary}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-label-tertiary flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function MedicamentosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    }>
      <MedicamentosContent />
    </Suspense>
  )
}
