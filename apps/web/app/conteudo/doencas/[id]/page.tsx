import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProvenanceBlock } from '@/components/content/ProvenanceBlock'
import { ReferencesBlock } from '@/components/content/ReferencesBlock'
import { collectDarwinCitations, extractDarwinLastUpdate } from '@/lib/darwinMfc/citations'
import { buildDiseaseJsonLd } from '@/lib/darwinMfc/jsonld'
import { getDiseaseById, type EnamedArea } from '@/lib/medical'

const AREA_LABELS: Record<EnamedArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  pediatria: 'Pediatria',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  saude_coletiva: 'Saúde Coletiva',
}

type DiseasePayload = {
  quickView?: {
    definicao?: string
    criteriosDiagnosticos?: string[]
    tratamentoPrimeiraLinha?: {
      naoFarmacologico?: string[]
      farmacologico?: string[]
    }
    redFlags?: string[]
  }
  fullContent?: {
    quadroClinico?: {
      sintomasPrincipais?: string[]
      sinaisExameFisico?: string[]
    }
    diagnostico?: {
      criterios?: string[]
      examesLaboratoriais?: string[]
      examesImagem?: string[]
    }
    tratamento?: {
      naoFarmacologico?: { medidas?: string[] }
      farmacologico?: {
        primeiraLinha?: Array<{ classe?: string; medicamentos?: string[]; posologia?: string }>
      }
    }
    acompanhamento?: {
      metasTerapeuticas?: string[]
    }
  }
}

function listOrFallback(items: string[] | undefined, fallback: string) {
  if (!items || items.length === 0) return [fallback]
  return items.filter(Boolean)
}

export default async function DiseaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data, error } = await getDiseaseById(id)

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 text-label-primary p-6">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="py-8 text-center text-label-secondary">
            Não foi possível carregar esta doença.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    notFound()
  }

  const payload = (data.payload || {}) as DiseasePayload
  const citations = collectDarwinCitations(payload)
  const lastUpdate = extractDarwinLastUpdate(payload)

  const summary = data.summary || payload.quickView?.definicao || 'Resumo não disponível.'
  const clinical = [
    ...(payload.fullContent?.quadroClinico?.sintomasPrincipais || []),
    ...(payload.fullContent?.quadroClinico?.sinaisExameFisico || []),
  ]
  const diagnosis = [
    ...(payload.quickView?.criteriosDiagnosticos || []),
    ...(payload.fullContent?.diagnostico?.criterios || []),
    ...((payload.fullContent?.diagnostico?.examesLaboratoriais || []).map((exam) => `Exame: ${exam}`)),
    ...((payload.fullContent?.diagnostico?.examesImagem || []).map((exam) => `Imagem: ${exam}`)),
  ]

  const treatment = [
    ...(payload.quickView?.tratamentoPrimeiraLinha?.naoFarmacologico || []).map((item) => `MEV: ${item}`),
    ...(payload.quickView?.tratamentoPrimeiraLinha?.farmacologico || []).map((item) => `Farmacológico: ${item}`),
    ...((payload.fullContent?.tratamento?.naoFarmacologico?.medidas || []).map((item) => `Medida: ${item}`)),
    ...((payload.fullContent?.tratamento?.farmacologico?.primeiraLinha || []).map(
      (item) => `${item.classe || 'Classe'}: ${(item.medicamentos || []).join(', ')}`
    )),
  ]

  const jsonLd = buildDiseaseJsonLd({
    id: data.id,
    title: data.title,
    summary,
    cid10: data.cid10,
    updatedAt: data.updated_at,
    citations,
  })

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/conteudo/doencas" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{data.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm">
                {data.cid10?.[0] && (
                  <span className="px-2 py-0.5 text-xs bg-surface-3 text-label-primary rounded">
                    {data.cid10[0]}
                  </span>
                )}
                <span className="text-emerald-400">{AREA_LABELS[data.enamed_area]}</span>
                {data.subcategoria && (
                  <>
                    <span className="text-label-quaternary">•</span>
                    <span className="text-label-secondary">{data.subcategoria}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="text-label-primary leading-relaxed">{summary}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apresentação clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-label-primary">
              {listOrFallback(clinical, 'Sem dados clínicos detalhados.').map((item) => (
                <li key={item} className="list-disc ml-5">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-label-primary">
              {listOrFallback(diagnosis, 'Sem critérios detalhados.').map((item) => (
                <li key={item} className="list-disc ml-5">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tratamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-label-primary">
              {listOrFallback(treatment, 'Sem plano terapêutico detalhado.').map((item) => (
                <li key={item} className="list-disc ml-5">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinais de Alerta e Metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Red flags</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(payload.quickView?.redFlags, 'Sem sinais de alerta registrados.').map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-label-secondary mb-2">Metas terapêuticas</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(
                  payload.fullContent?.acompanhamento?.metasTerapeuticas,
                  'Sem metas terapêuticas registradas.'
                ).map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <ProvenanceBlock lastUpdate={lastUpdate} />
          <ReferencesBlock citations={citations} />
        </div>
      </main>
    </div>
  )
}
