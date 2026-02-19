import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProvenanceBlock } from '@/components/content/ProvenanceBlock'
import { ReferencesBlock } from '@/components/content/ReferencesBlock'
import { collectDarwinCitations, extractDarwinLastUpdate } from '@/lib/darwinMfc/citations'
import { buildDiseaseJsonLd } from '@/lib/darwinMfc/jsonld'
import type { DarwinCitation } from '@/lib/darwinMfc/references'
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
    examesIniciais?: string[]
    metasTerapeuticas?: string[]
    classificacaoRisco?: Array<{
      nivel?: string
      criterios?: string[]
      conduta?: string
    }>
    tratamentoPrimeiraLinha?: {
      naoFarmacologico?: string[]
      farmacologico?: string[]
    }
    redFlags?: string[]
  }
  fullContent?: {
    epidemiologia?: {
      prevalencia?: string
      incidencia?: string
      mortalidade?: string
      faixaEtaria?: string
      fatoresRisco?: string[]
      citations?: DarwinCitation[]
    }
    fisiopatologia?: {
      texto?: string
      citations?: DarwinCitation[]
    }
    quadroClinico?: {
      sintomasPrincipais?: string[]
      sinaisExameFisico?: string[]
      formasClinicas?: string[]
      citations?: DarwinCitation[]
    }
    diagnostico?: {
      criterios?: string[]
      diagnosticoDiferencial?: string[]
      examesLaboratoriais?: string[]
      examesImagem?: string[]
      outrosExames?: string[]
      citations?: DarwinCitation[]
    }
    tratamento?: {
      objetivos?: string[]
      naoFarmacologico?: { medidas?: string[]; citations?: DarwinCitation[] }
      farmacologico?: {
        primeiraLinha?: Array<{ classe?: string; medicamentos?: string[]; posologia?: string }>
        segundaLinha?: Array<{ classe?: string; medicamentos?: string[]; posologia?: string }>
        situacoesEspeciais?: Array<{ situacao?: string; conduta?: string }>
        citations?: DarwinCitation[]
      }
      duracao?: string
    }
    acompanhamento?: {
      frequenciaConsultas?: string
      examesControle?: string[]
      metasTerapeuticas?: string[]
      criteriosEncaminhamento?: string[]
      citations?: DarwinCitation[]
    }
  }
  prevencao?: {
    primaria?: string[]
    secundaria?: string[]
    citations?: DarwinCitation[]
  }
  populacoesEspeciais?: {
    idosos?: string
    gestantes?: string
    criancas?: string
    drc?: string
    hepatopatas?: string
  }

  // Ontology/standard identifiers
  cid10?: string[]
  cid11?: string[]
  snomedCT?: string
  meshId?: string
  doid?: string
  umlsCui?: string
  ordo?: string[] | string
  loinc?: string[]
}

function listOrFallback(items: string[] | undefined, fallback: string) {
  if (!items || items.length === 0) return [fallback]
  return items.filter(Boolean)
}

function textOrFallback(value: string | undefined, fallback: string) {
  const trimmed = (value || '').trim()
  return trimmed ? trimmed : fallback
}

function compact(items: Array<string | undefined | null>) {
  return items.map((item) => (item || '').trim()).filter(Boolean)
}

function mergeLists(...lists: Array<string[] | undefined>) {
  return lists.flatMap((list) => (Array.isArray(list) ? list : [])).map((item) => item.trim()).filter(Boolean)
}

function mergeCitations(...lists: Array<DarwinCitation[] | undefined>) {
  const out: DarwinCitation[] = []
  const seen = new Set<string>()

  for (const list of lists) {
    for (const citation of list || []) {
      const refId = (citation?.refId || '').trim()
      if (!refId) continue
      const key = `${refId}|${citation.page || ''}|${citation.note || ''}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ ...citation, refId })
    }
  }

  return out
}

function decodeRouteParam(value: string): string {
  // For ids containing diacritics, we can receive percent-encoded params (ex: "%C3%A9").
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function SectionReferences({ citations }: { citations?: DarwinCitation[] }) {
  const list = (citations || []).filter((citation) => Boolean(citation?.refId?.trim()))
  if (list.length === 0) return null

  return (
    <details className="mt-4 rounded-xl border border-separator bg-surface-2/30 px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-label-primary">
        Referências desta seção <span className="text-label-tertiary">({list.length})</span>
      </summary>
      <div className="mt-3">
        <ReferencesBlock citations={list} showTitle={false} />
      </div>
    </details>
  )
}

export default async function DiseaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const id = decodeRouteParam(rawId)
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

  const epidemiology = payload.fullContent?.epidemiologia
  const epidemiologyCitations = epidemiology?.citations
  const epidemiologyLines = compact([
    epidemiology?.prevalencia ? `Prevalência: ${epidemiology.prevalencia}` : null,
    epidemiology?.incidencia ? `Incidência: ${epidemiology.incidencia}` : null,
    epidemiology?.mortalidade ? `Mortalidade: ${epidemiology.mortalidade}` : null,
    epidemiology?.faixaEtaria ? `Faixa etária: ${epidemiology.faixaEtaria}` : null,
  ])

  const pathophysiologyCitations = payload.fullContent?.fisiopatologia?.citations

  const clinical = [
    ...(payload.fullContent?.quadroClinico?.sintomasPrincipais || []),
    ...(payload.fullContent?.quadroClinico?.sinaisExameFisico || []),
    ...(payload.fullContent?.quadroClinico?.formasClinicas || []).map((item) => `Forma clínica: ${item}`),
  ]
  const clinicalCitations = payload.fullContent?.quadroClinico?.citations
  const diagnosisCriteria = mergeLists(payload.quickView?.criteriosDiagnosticos, payload.fullContent?.diagnostico?.criterios)
  const differential = payload.fullContent?.diagnostico?.diagnosticoDiferencial || []
  const initialExams = payload.quickView?.examesIniciais || []
  const labExams = payload.fullContent?.diagnostico?.examesLaboratoriais || []
  const imagingExams = payload.fullContent?.diagnostico?.examesImagem || []
  const otherExams = payload.fullContent?.diagnostico?.outrosExames || []
  const diagnosisCitations = payload.fullContent?.diagnostico?.citations

  const treatment = [
    ...(payload.quickView?.tratamentoPrimeiraLinha?.naoFarmacologico || []).map((item) => `MEV: ${item}`),
    ...(payload.quickView?.tratamentoPrimeiraLinha?.farmacologico || []).map((item) => `Farmacológico: ${item}`),
    ...((payload.fullContent?.tratamento?.naoFarmacologico?.medidas || []).map((item) => `Medida: ${item}`)),
    ...((payload.fullContent?.tratamento?.farmacologico?.primeiraLinha || []).map(
      (item) => `${item.classe || 'Classe'}: ${(item.medicamentos || []).join(', ')}`
    )),
  ]

  const treatmentObjectives = payload.fullContent?.tratamento?.objetivos || []
  const treatmentFirstLine = payload.fullContent?.tratamento?.farmacologico?.primeiraLinha || []
  const treatmentSecondLine = payload.fullContent?.tratamento?.farmacologico?.segundaLinha || []
  const specialSituations = payload.fullContent?.tratamento?.farmacologico?.situacoesEspeciais || []
  const treatmentCitations = mergeCitations(
    payload.fullContent?.tratamento?.naoFarmacologico?.citations,
    payload.fullContent?.tratamento?.farmacologico?.citations
  )

  const followUp = payload.fullContent?.acompanhamento
  const followUpFrequency = followUp?.frequenciaConsultas
  const followUpExams = followUp?.examesControle || []
  const followUpGoals = followUp?.metasTerapeuticas || []
  const followUpReferral = followUp?.criteriosEncaminhamento || []
  const followUpCitations = followUp?.citations

  const prevention = payload.prevencao
  const primaryPrevention = prevention?.primaria || []
  const secondaryPrevention = prevention?.secundaria || []
  const preventionCitations = prevention?.citations

  const populations = payload.populacoesEspeciais
  const populationsLines = compact([
    populations?.idosos ? `Idosos: ${populations.idosos}` : null,
    populations?.gestantes ? `Gestantes: ${populations.gestantes}` : null,
    populations?.criancas ? `Crianças: ${populations.criancas}` : null,
    populations?.drc ? `DRC: ${populations.drc}` : null,
    populations?.hepatopatas ? `Hepatopatas: ${populations.hepatopatas}` : null,
  ])

  const riskPitfalls = (payload.quickView?.classificacaoRisco || [])
    .map((entry) => {
      const parts = compact([entry.nivel ? `Risco ${entry.nivel}:` : null, entry.conduta])
      return parts.length ? parts.join(' ') : null
    })
    .filter((item): item is string => Boolean(item))

  const specialSituationPitfalls = specialSituations
    .map((entry) => {
      const parts = compact([entry.situacao ? `${entry.situacao}:` : null, entry.conduta])
      return parts.length ? parts.join(' ') : null
    })
    .filter((item): item is string => Boolean(item))

  const pitfalls = [
    ...riskPitfalls,
    ...(payload.quickView?.redFlags || []).map((item) => `Red flag: ${item}`),
    ...(followUpReferral || []).map((item) => `Encaminhar: ${item}`),
    ...specialSituationPitfalls,
  ]

  const confusions = [
    ...differential.map((item) => `Diagnóstico diferencial: ${item}`),
    ...((payload.fullContent?.quadroClinico?.formasClinicas || []).map((item) => `Forma clínica: ${item}`)),
    ...populationsLines,
  ]

  const examNotesCitations = mergeCitations(
    diagnosisCitations,
    clinicalCitations,
    payload.fullContent?.tratamento?.farmacologico?.citations,
    followUpCitations
  )

  const alertsAndGoalsCitations = mergeCitations(
    payload.fullContent?.tratamento?.farmacologico?.citations,
    followUpCitations
  )

  const jsonLd = buildDiseaseJsonLd({
    id: data.id,
    title: data.title,
    summary,
    cid10: data.cid10,
    cid11: payload.cid11,
    snomedCT: payload.snomedCT,
    meshId: payload.meshId,
    doid: payload.doid,
    umlsCui: payload.umlsCui,
    ordo: payload.ordo,
    loinc: payload.loinc,
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
            <CardTitle>Pegadinhas e confusões em prova</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-label-secondary mb-2">Pegadinhas (atenção especial)</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(pitfalls, 'Sem pontos críticos destacados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Confusões comuns (o que costuma cair)</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(confusions, 'Sem tópicos adicionais registrados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SectionReferences citations={examNotesCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Epidemiologia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Panorama</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(epidemiologyLines, 'Sem dados epidemiológicos resumidos.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-label-secondary mb-2">Fatores de risco</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(epidemiology?.fatoresRisco, 'Sem fatores de risco registrados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SectionReferences citations={epidemiologyCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fisiopatologia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-label-primary leading-relaxed">
            <p>{textOrFallback(payload.fullContent?.fisiopatologia?.texto, 'Sem fisiopatologia detalhada registrada.')}</p>
            <SectionReferences citations={pathophysiologyCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apresentação clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-label-primary">
              {listOrFallback(clinical, 'Sem dados clínicos detalhados.').map((item) => (
                <li key={item} className="list-disc ml-5">
                  {item}
                </li>
              ))}
            </ul>
            <SectionReferences citations={clinicalCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Critérios</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(diagnosisCriteria, 'Sem critérios detalhados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Exames iniciais</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(initialExams, 'Sem exames iniciais sugeridos.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Exames laboratoriais</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(labExams, 'Sem exames laboratoriais detalhados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Exames de imagem</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(imagingExams, 'Sem exames de imagem detalhados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Outros exames</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(otherExams, 'Sem outros exames registrados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Diagnóstico diferencial</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(differential, 'Sem diagnóstico diferencial registrado.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SectionReferences citations={diagnosisCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Objetivos</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(treatmentObjectives, 'Sem objetivos terapêuticos registrados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Primeira linha (resumo)</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(treatment, 'Sem plano terapêutico detalhado.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Farmacológico — 1ª linha</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(
                  treatmentFirstLine.map((entry) => {
                    const tail = compact([entry.posologia ? `— ${entry.posologia}` : null])
                    return `${entry.classe || 'Classe'}: ${(entry.medicamentos || []).join(', ')}${tail.length ? ` ${tail.join(' ')}` : ''}`
                  }),
                  'Sem farmacoterapia de 1ª linha registrada.'
                ).map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Farmacológico — 2ª linha</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(
                  treatmentSecondLine.map((entry) => {
                    const tail = compact([entry.posologia ? `— ${entry.posologia}` : null])
                    return `${entry.classe || 'Classe'}: ${(entry.medicamentos || []).join(', ')}${tail.length ? ` ${tail.join(' ')}` : ''}`
                  }),
                  'Sem farmacoterapia de 2ª linha registrada.'
                ).map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Situações especiais</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(
                  specialSituations.map((entry) => compact([entry.situacao ? `${entry.situacao}:` : null, entry.conduta]).join(' ')).filter(Boolean),
                  'Sem situações especiais registradas.'
                ).map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Duração</p>
              <p className="text-label-primary">
                {textOrFallback(payload.fullContent?.tratamento?.duracao, 'Sem duração de tratamento registrada.')}
              </p>
            </div>

            <SectionReferences citations={treatmentCitations} />
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
                  mergeLists(payload.quickView?.metasTerapeuticas, payload.fullContent?.acompanhamento?.metasTerapeuticas),
                  'Sem metas terapêuticas registradas.'
                ).map((item) => (
                  <li key={item} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SectionReferences citations={alertsAndGoalsCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Frequência de consultas</p>
              <p className="text-label-primary">
                {textOrFallback(followUpFrequency, 'Sem frequência de acompanhamento registrada.')}
              </p>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Exames de controle</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(followUpExams, 'Sem exames de controle registrados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Metas terapêuticas</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(followUpGoals, 'Sem metas terapêuticas registradas.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-label-secondary mb-2">Critérios de encaminhamento</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(followUpReferral, 'Sem critérios de encaminhamento registrados.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SectionReferences citations={followUpCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prevenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-label-secondary mb-2">Primária</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(primaryPrevention, 'Sem prevenção primária registrada.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-label-secondary mb-2">Secundária</p>
              <ul className="space-y-2 text-label-primary">
                {listOrFallback(secondaryPrevention, 'Sem prevenção secundária registrada.').map((item, idx) => (
                  <li key={`${idx}-${item}`} className="list-disc ml-5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SectionReferences citations={preventionCitations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Populações especiais</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-label-primary">
              {listOrFallback(populationsLines, 'Sem orientações para populações especiais.').map((item, idx) => (
                <li key={`${idx}-${item}`} className="list-disc ml-5">
                  {item}
                </li>
              ))}
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
