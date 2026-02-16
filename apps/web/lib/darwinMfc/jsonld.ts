import 'server-only'

import {
  getDarwinReferenceUrl,
  resolveDarwinReference,
  type DarwinCitation,
} from '@/lib/darwinMfc/references'
import { isBlockedCitationRefId } from '@/lib/darwinMfc/blocked-sources'

type JsonLd = Record<string, unknown>

function getPublicSiteUrl() {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').trim()
  const base = env || 'https://darwinhub.org'
  return base.replace(/\/+$/, '')
}

function isPlausibleDoi(value?: string) {
  if (!value) return false
  const doi = value.trim()
  if (!doi) return false
  const normalized = doi.toLowerCase()
  if (!normalized.startsWith('10.')) return false
  if (normalized.includes('xxxx') || normalized.includes('todo')) return false
  if (/\s/.test(doi)) return false
  return true
}

function citationToCreativeWork(citation: DarwinCitation, pageUrl: string): JsonLd {
  const refId = citation.refId.trim()
  const ref = resolveDarwinReference(refId)
  const url = ref ? getDarwinReferenceUrl(ref) : null
  const doi = ref?.doi && isPlausibleDoi(ref.doi) ? ref.doi.trim() : null
  const type = ref?.journal ? 'ScholarlyArticle' : 'CreativeWork'

  return {
    '@type': type,
    '@id': url || `${pageUrl}#ref-${encodeURIComponent(refId)}`,
    identifier: refId,
    ...(ref?.title ? { name: ref.title } : { name: refId }),
    ...(url ? { url } : {}),
    ...(doi ? { sameAs: `https://doi.org/${doi}` } : {}),
    ...(ref?.authors && ref.authors.length > 0
      ? { author: ref.authors.filter(Boolean).map((name) => ({ '@type': 'Person', name })) }
      : {}),
    ...(typeof ref?.year === 'number' ? { datePublished: String(ref.year) } : {}),
    ...(ref?.journal ? { isPartOf: { '@type': 'Periodical', name: ref.journal } } : {}),
    ...(ref?.publisher ? { publisher: { '@type': 'Organization', name: ref.publisher } } : {}),
    ...(citation.page ? { pagination: citation.page } : {}),
    ...(citation.note ? { description: citation.note } : {}),
  }
}

export function buildDiseaseJsonLd(params: {
  id: string
  title: string
  summary: string
  cid10?: string[] | null
  updatedAt?: string | null
  citations?: DarwinCitation[]
}): JsonLd {
  const baseUrl = getPublicSiteUrl()
  const pageUrl = `${baseUrl}/conteudo/doencas/${params.id}`
  const citations = (params.citations || [])
    .filter((c) => !isBlockedCitationRefId(c.refId))
    .map((c) => citationToCreativeWork(c, pageUrl))

  const cid10 = (params.cid10 || []).filter(Boolean)
  const code =
    cid10.length > 0
      ? cid10.map((codeValue) => ({
          '@type': 'MedicalCode',
          codingSystem: 'ICD-10',
          codeValue,
        }))
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: params.title,
    description: params.summary,
    inLanguage: 'pt-BR',
    ...(params.updatedAt ? { dateModified: params.updatedAt } : {}),
    mainEntity: {
      '@type': 'MedicalCondition',
      '@id': `${pageUrl}#condition`,
      identifier: params.id,
      name: params.title,
      description: params.summary,
      ...(code ? { code } : {}),
    },
    ...(citations.length > 0 ? { citation: citations } : {}),
  }
}

export function buildMedicationJsonLd(params: {
  id: string
  genericName: string
  summary: string
  brandNames?: string[] | null
  atcCode?: string | null
  drugClass: string
  subclass?: string | null
  updatedAt?: string | null
  citations?: DarwinCitation[]
}): JsonLd {
  const baseUrl = getPublicSiteUrl()
  const pageUrl = `${baseUrl}/conteudo/medicamentos/${params.id}`
  const citations = (params.citations || [])
    .filter((c) => !isBlockedCitationRefId(c.refId))
    .map((c) => citationToCreativeWork(c, pageUrl))

  const brandNames = (params.brandNames || []).filter(Boolean)
  const alternateName = brandNames.length > 0 ? brandNames : undefined
  const atc = (params.atcCode || '').trim()
  const code = atc
    ? {
        '@type': 'MedicalCode',
        codingSystem: 'ATC',
        codeValue: atc,
      }
    : undefined

  const classes = [params.drugClass, params.subclass].filter((v): v is string => Boolean(v && v.trim()))

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: params.genericName,
    description: params.summary,
    inLanguage: 'pt-BR',
    ...(params.updatedAt ? { dateModified: params.updatedAt } : {}),
    mainEntity: {
      '@type': 'Drug',
      '@id': `${pageUrl}#drug`,
      identifier: params.id,
      name: params.genericName,
      description: params.summary,
      ...(alternateName ? { alternateName } : {}),
      ...(code ? { code } : {}),
      ...(classes.length > 0 ? { drugClass: classes } : {}),
    },
    ...(citations.length > 0 ? { citation: citations } : {}),
  }
}
