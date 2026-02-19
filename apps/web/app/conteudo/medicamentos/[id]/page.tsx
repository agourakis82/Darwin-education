import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProvenanceBlock } from '@/components/content/ProvenanceBlock'
import { ReferencesBlock } from '@/components/content/ReferencesBlock'
import { collectDarwinCitations, extractDarwinLastUpdate } from '@/lib/darwinMfc/citations'
import { buildMedicationJsonLd } from '@/lib/darwinMfc/jsonld'
import { getMedicationById } from '@/lib/medical'

type MedicationPayload = {
  mecanismoAcao?: string
  indicacoes?: string[]
  contraindicacoes?: string[]
  efeitosAdversos?: {
    comuns?: string[]
    graves?: string[]
  }
  interacoes?: Array<{ medicamento?: string; efeito?: string; conduta?: string }>
  monitorizacao?: string[]
  gestacao?: string
  posologias?: Array<{
    indicacao?: string
    adultos?: string | { dose?: string; frequencia?: string; via?: string; duracao?: string; doseMaxima?: string; observacoes?: string }
    pediatria?: string | { dose?: string; frequencia?: string; via?: string; duracao?: string; doseMaxima?: string; observacoes?: string }
    pediatrico?: string | { dose?: string; frequencia?: string; via?: string; duracao?: string; doseMaxima?: string; observacoes?: string }
  }>
  snomedCT?: string | string[]
  rxNormCui?: string
  drugBankId?: string
  loinc?: string[]
}

function formatClassLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(' ')
}

function listOrFallback(items: string[] | undefined, fallback: string) {
  if (!items || items.length === 0) return [fallback]
  return items.filter(Boolean)
}

function formatDoseValue(
  value:
    | string
    | {
        dose?: string
        frequencia?: string
        via?: string
        duracao?: string
        doseMaxima?: string
        observacoes?: string
      }
    | undefined
) {
  if (!value) return ''
  if (typeof value === 'string') return value

  const primaryParts = [value.dose, value.frequencia, value.via, value.duracao].filter(Boolean)
  const secondaryParts = [value.doseMaxima ? `Dose máxima: ${value.doseMaxima}` : undefined, value.observacoes].filter(Boolean)

  const primary = primaryParts.join(' • ')
  const secondary = secondaryParts.join(' • ')
  return [primary, secondary].filter(Boolean).join(' — ')
}

export default async function MedicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data, error } = await getMedicationById(id)

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 text-label-primary p-6">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="py-8 text-center text-label-secondary">
            Não foi possível carregar este medicamento.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    notFound()
  }

  const payload = (data.payload || {}) as MedicationPayload
  const citations = collectDarwinCitations(payload)
  const lastUpdate = extractDarwinLastUpdate(payload)

  const interactions = (payload.interacoes || []).map((item) => {
    const drug = item.medicamento || 'Interação relevante'
    const effect = item.efeito || item.conduta || ''
    return effect ? `${drug}: ${effect}` : drug
  })

  const jsonLd = buildMedicationJsonLd({
    id: data.id,
    genericName: data.generic_name,
    summary: data.summary || 'Resumo não disponível.',
    brandNames: data.brand_names,
    atcCode: data.atc_code,
    snomedCT: payload.snomedCT,
    rxNormCui: payload.rxNormCui,
    drugBankId: payload.drugBankId,
    loinc: payload.loinc,
    drugClass: data.drug_class,
    subclass: data.subclass,
    updatedAt: data.updated_at,
    citations,
  })

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/conteudo/medicamentos" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{data.generic_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {data.atc_code && (
                  <span className="px-2 py-0.5 text-xs bg-surface-3 text-label-primary rounded">
                    {data.atc_code}
                  </span>
                )}
                <span className="text-sm text-blue-400">{formatClassLabel(data.drug_class)}</span>
                {data.subclass && (
                  <>
                    <span className="text-label-quaternary">•</span>
                    <span className="text-sm text-label-secondary">{formatClassLabel(data.subclass)}</span>
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
          <CardContent className="text-label-primary leading-relaxed">
            {data.summary || 'Resumo não disponível.'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mecanismo e Indicações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-label-primary leading-relaxed">
              {payload.mecanismoAcao || 'Mecanismo de ação não informado.'}
            </p>
            <ul className="space-y-2 text-label-primary">
              {listOrFallback(payload.indicacoes, 'Sem indicações detalhadas.').map((item) => (
                <li key={item} className="list-disc ml-5">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Contraindicações</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(payload.contraindicacoes, 'Sem contraindicações detalhadas.').map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-label-secondary mb-2">Efeitos adversos</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(payload.efeitosAdversos?.comuns, 'Sem efeitos adversos detalhados.').map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-label-secondary">
              Gestação: <span className="text-label-primary">{payload.gestacao || 'Não informado'}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interações e Monitoramento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Interações relevantes</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(interactions, 'Sem interações registradas.').map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-label-secondary mb-2">Monitoramento</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(payload.monitorizacao, 'Sem orientações de monitoramento.').map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posologia</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-label-primary">
              {(payload.posologias || []).length === 0 ? (
                <li className="list-disc ml-5">Sem posologia estruturada no payload.</li>
              ) : (
                (payload.posologias || []).slice(0, 8).map((item, index) => (
                  <li key={`${item.indicacao || 'posologia'}-${index}`} className="list-disc ml-5">
                    <div className="space-y-1">
                      <div className="font-medium">{item.indicacao || 'Indicação'}</div>
                      {item.adultos && (
                        <div className="text-sm text-label-secondary">
                          Adultos:{' '}
                          <span className="text-label-primary">
                            {formatDoseValue(item.adultos) || 'Consultar referência completa'}
                          </span>
                        </div>
                      )}
                      {(item.pediatria || item.pediatrico) && (
                        <div className="text-sm text-label-secondary">
                          Pediátrico:{' '}
                          <span className="text-label-primary">
                            {formatDoseValue(item.pediatria || item.pediatrico) || 'Consultar referência completa'}
                          </span>
                        </div>
                      )}
                      {!item.adultos && !item.pediatria && !item.pediatrico && (
                        <div className="text-sm text-label-secondary">Consultar referência completa.</div>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
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
