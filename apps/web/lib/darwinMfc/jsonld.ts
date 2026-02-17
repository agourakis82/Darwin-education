import {
  getDarwinReferenceUrl,
  resolveDarwinReference,
  type DarwinCitation,
} from './references'
import type { Reference } from './types'
import { isBlockedCitationRefId } from './blocked-sources'

type JsonLd = Record<string, unknown>

type OntologyCodeLike = {
  codingSystem: string
  codeValue: string
  sameAs?: string
}

type OntologyVocabulary = {
  key: string
  iriTemplate?: (codeValue: string) => string | undefined
}

const ONTOLOGY_VOCABULARIES: Record<string, OntologyVocabulary> = {
  'icd-10': {
    key: 'ICD-10',
    iriTemplate: (codeValue) =>
      codeValue ? `https://icd.who.int/browse10/2019/en#/${encodeURIComponent(normalizeMaybeUri(codeValue))}` : undefined,
  },
  icd10: {
    key: 'ICD-10',
    iriTemplate: (codeValue) =>
      codeValue ? `https://icd.who.int/browse10/2019/en#/${encodeURIComponent(normalizeMaybeUri(codeValue))}` : undefined,
  },
  'icd-11': {
    key: 'ICD-11',
    iriTemplate: (codeValue) =>
      codeValue
        ? `https://icd.who.int/browse11/l-m/en#/http://id.who.int/icd/entity/${encodeURIComponent(normalizeMaybeUri(codeValue))}`
        : undefined,
  },
  icd11: {
    key: 'ICD-11',
    iriTemplate: (codeValue) =>
      codeValue
        ? `https://icd.who.int/browse11/l-m/en#/http://id.who.int/icd/entity/${encodeURIComponent(normalizeMaybeUri(codeValue))}`
        : undefined,
  },
  'snomed ct': {
    key: 'SNOMED CT',
    iriTemplate: (codeValue) =>
      codeValue
        ? `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${encodeURIComponent(normalizeMaybeUri(codeValue))}`
        : undefined,
  },
  snomedct: {
    key: 'SNOMED CT',
    iriTemplate: (codeValue) =>
      codeValue
        ? `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${encodeURIComponent(normalizeMaybeUri(codeValue))}`
        : undefined,
  },
  'snomed-ct': {
    key: 'SNOMED CT',
    iriTemplate: (codeValue) =>
      codeValue
        ? `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${encodeURIComponent(normalizeMaybeUri(codeValue))}`
        : undefined,
  },
  mesh: {
    key: 'MeSH',
    iriTemplate: (codeValue) => (codeValue ? `https://id.nlm.nih.gov/mesh/${encodeURIComponent(normalizeMaybeUri(codeValue))}` : undefined),
  },
  doid: {
    key: 'Disease Ontology',
    iriTemplate: (codeValue) => {
      if (!codeValue) return undefined
      const normalized = normalizeMaybeUri(codeValue).replace(/^DOID:/i, '')
      return `https://www.ebi.ac.uk/ols4/ontologies/doid/terms?obo_id=${encodeURIComponent(
        normalized ? `DOID:${normalized}` : codeValue
      )}`
    },
  },
  umlscui: {
    key: 'UMLS CUI',
    iriTemplate: (codeValue) =>
      codeValue
        ? toIdentifiersUri('umls', codeValue) || `https://uts.nlm.nih.gov/medlineplus/clinicalterms?query=${encodeURIComponent(codeValue)}`
        : undefined,
  },
  umls: {
    key: 'UMLS CUI',
    iriTemplate: (codeValue) =>
      codeValue
        ? toIdentifiersUri('umls', codeValue) || `https://uts.nlm.nih.gov/medlineplus/clinicalterms?query=${encodeURIComponent(codeValue)}`
        : undefined,
  },
  orpha: {
    key: 'Orphanet',
    iriTemplate: (codeValue) => {
      if (!codeValue) return undefined
      const normalized = normalizeMaybeUri(codeValue).replace(/^ORPHA:/i, '')
      return `https://www.orpha.net/en/disease/detail/${encodeURIComponent(normalized)}`
    },
  },
  loinc: {
    key: 'LOINC',
    iriTemplate: (codeValue) => (codeValue ? `https://loinc.org/${encodeURIComponent(normalizeMaybeUri(codeValue))}` : undefined),
  },
  diseaseontology: {
    key: 'Disease Ontology',
    iriTemplate: (codeValue) => {
      if (!codeValue) return undefined
      const normalized = normalizeMaybeUri(codeValue).replace(/^DOID:/i, '')
      return `https://www.ebi.ac.uk/ols4/ontologies/doid/terms?obo_id=${encodeURIComponent(
        normalized ? `DOID:${normalized}` : codeValue
      )}`
    },
  },
  atc: {
    key: 'ATC',
    iriTemplate: (codeValue) =>
      codeValue ? `https://www.whocc.no/atc_ddd_index/?code=${encodeURIComponent(normalizeMaybeUri(codeValue))}` : undefined,
  },
  rxnorm: {
    key: 'RxNorm CUI',
    iriTemplate: (codeValue) =>
      codeValue
        ? toIdentifiersUri('rxnorm', codeValue) ||
          `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${encodeURIComponent(codeValue)}`
        : undefined,
  },
  rxnormcui: {
    key: 'RxNorm CUI',
    iriTemplate: (codeValue) =>
      codeValue
        ? toIdentifiersUri('rxnorm', codeValue) ||
          `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${encodeURIComponent(codeValue)}`
        : undefined,
  },
  drugbank: {
    key: 'DrugBank',
    iriTemplate: (codeValue) =>
      codeValue ? `https://go.drugbank.com/drugs/${encodeURIComponent(normalizeMaybeUri(codeValue))}` : undefined,
  },
}

type ReferenceSchemaType =
  | 'CreativeWork'
  | 'ScholarlyArticle'
  | 'MedicalGuideline'
  | 'GovernmentDocument'
  | 'Book'
  | 'Report'
  | 'WebPage'

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

function normalizeIdentifier(value: unknown) {
  if (value == null) return ''
  const text = String(value).trim()
  return text
}

function normalizeCodeList(value: unknown) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => normalizeIdentifier(item)).filter(Boolean)
  }
  const single = normalizeIdentifier(value)
  return single ? [single] : []
}

function toUpperCode(value: string) {
  return value.trim().toUpperCase()
}

function normalizeOntologySystem(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return value.trim()

  if (ONTOLOGY_VOCABULARIES[normalized]) return ONTOLOGY_VOCABULARIES[normalized].key
  const compact = normalized.replace(/[^a-z0-9]+/g, '')
  if (ONTOLOGY_VOCABULARIES[compact]) return ONTOLOGY_VOCABULARIES[compact].key
  const compactWithDash = compact.replace(/(\d)/g, '-$1')
  if (ONTOLOGY_VOCABULARIES[compactWithDash]) return ONTOLOGY_VOCABULARIES[compactWithDash].key
  return value.trim()
}

function normalizeMaybeUri(value: string) {
  return String(value).trim().replaceAll(' ', '')
}

function inferOntologySameAs(codingSystem: string, codeValue: string) {
  const canonicalSystem = normalizeOntologySystem(codingSystem)
  const normalized = canonicalSystem.toLowerCase()
  const lookup = ONTOLOGY_VOCABULARIES[normalized]
  const compact = normalized.replace(/[^a-z0-9]+/g, '')
  const fallback = ONTOLOGY_VOCABULARIES[compact]
  const compactWithDash = compact.replace(/(\d)/g, '-$1')
  const fallback2 = ONTOLOGY_VOCABULARIES[compactWithDash]
  const entry = lookup || fallback || fallback2
  if (!entry?.iriTemplate) return undefined
  return entry.iriTemplate(codeValue)
}

function toIdentifiersUri(prefix: string, codeValue: string) {
  if (!codeValue) return undefined
  const trimmed = normalizeMaybeUri(codeValue)
  if (!trimmed) return undefined
  return `https://identifiers.org/${encodeURIComponent(prefix)}/${encodeURIComponent(trimmed)}`
}

function citationSchemaType(type: Reference['type']): ReferenceSchemaType {
  if (type === 'artigo') return 'ScholarlyArticle'
  if (type === 'diretriz') return 'MedicalGuideline'
  if (type === 'relatorio') return 'Report'
  if (type === 'livro') return 'Book'
  if (type === 'site') return 'WebPage'
  return 'GovernmentDocument'
}

function toMedicalCode(codingSystem: string, codeValue: string, sameAs?: string): OntologyCodeLike {
  const canonicalSystem = normalizeOntologySystem(codingSystem)
  const normalizedCode = normalizeMaybeUri(codeValue)
  const explicitSameAs = sameAs?.trim()
  const inferredSameAs = inferOntologySameAs(canonicalSystem, normalizedCode)
  const effectiveSameAs = explicitSameAs || inferredSameAs
  return {
    codingSystem: canonicalSystem,
    codeValue: normalizedCode,
    ...(effectiveSameAs ? { sameAs: String(effectiveSameAs) } : {}),
  }
}

function dedupeOntologyCodes(codes: Array<OntologyCodeLike | undefined>) {
  const seen = new Set<string>()
  const out: OntologyCodeLike[] = []

  for (const code of codes) {
    if (!code) continue
    const key = `${toUpperCode(code.codingSystem)}|${toUpperCode(code.codeValue)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(code)
  }

  return out
}

function dedupeValues(values: Array<string | undefined>) {
  const seen = new Set<string>()
  const out: string[] = []

  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const next = trimmed
    if (seen.has(next)) continue
    seen.add(next)
    out.push(next)
  }

  return out
}

function ontologySameAsFromCodes(codes: OntologyCodeLike[]) {
  return dedupeValues(codes.map((entry) => entry.sameAs))
}

function ontologyCodesFromDisease(params: {
  cid10?: string[] | null
  cid11?: string[] | null
  snomedCT?: string | null
  meshId?: string | null
  doid?: string | null
  umlsCui?: string | null
  ordo?: string[] | string | null
  loinc?: string[] | null
}) {
  const rawCid10 = normalizeCodeList(params.cid10)
  const rawCid11 = normalizeCodeList(params.cid11)
  const rawMesh = normalizeCodeList(params.meshId)
  const rawOrdo = normalizeCodeList(params.ordo)
  const rawLoinc = normalizeCodeList(params.loinc)
  const rawSnomed = normalizeCodeList(params.snomedCT)
  const rawDoid = normalizeIdentifier(params.doid)
  const rawUmls = normalizeIdentifier(params.umlsCui)

  return dedupeOntologyCodes([
    ...rawCid10.map((code) => toMedicalCode('ICD-10', code)),
    ...rawCid11.map((code) => toMedicalCode('ICD-11', code)),
    ...rawSnomed.map((code) => toMedicalCode('SNOMED CT', code)),
    ...rawMesh.map((code) => toMedicalCode('MeSH', code)),
    ...(rawDoid
      ? [
          toMedicalCode(
            'Disease Ontology',
            rawDoid.startsWith('DOID:') ? rawDoid : `DOID:${rawDoid}`
          ),
        ]
      : []),
    ...(rawUmls
      ? [
          toMedicalCode(
            'UMLS CUI',
            rawUmls
          ),
        ]
      : []),
    ...rawOrdo.map((rawCode) => {
      const codeValue = rawCode.startsWith('ORPHA:') ? rawCode : `ORPHA:${rawCode}`
      const sameAs = rawCode.replace(/^ORPHA:/i, '').trim()
      return toMedicalCode(
        'Orphanet',
        codeValue,
        sameAs ? `https://www.orpha.net/en/disease/detail/${encodeURIComponent(sameAs)}` : undefined
      )
    }),
    ...rawLoinc.map((code) => toMedicalCode('LOINC', code)),
  ])
}

function ontologyCodesFromMedication(params: {
  atcCode?: string | null
  snomedCT?: string | string[] | null
  rxNormCui?: string | null
  drugBankId?: string | null
  loinc?: string[] | null
}) {
  const rawAtc = normalizeIdentifier(params.atcCode)
  const rawSnomed = normalizeCodeList(params.snomedCT)
  const rawRxNorm = normalizeIdentifier(params.rxNormCui)
  const rawDrugbank = normalizeIdentifier(params.drugBankId)
  const rawLoinc = normalizeCodeList(params.loinc)

  return dedupeOntologyCodes([
    ...(rawAtc ? [toMedicalCode('ATC', rawAtc)] : []),
    ...rawSnomed.map((code) =>
      toMedicalCode('SNOMED CT', code),
    ),
  ...(rawRxNorm
    ? [toMedicalCode('RxNorm CUI', rawRxNorm, toIdentifiersUri('rxnorm', rawRxNorm))]
    : []),
    ...(rawDrugbank ? [toMedicalCode('DrugBank', rawDrugbank)] : []),
    ...rawLoinc.map((code) => toMedicalCode('LOINC', code)),
  ])
}

function citationToCreativeWork(citation: DarwinCitation, pageUrl: string): JsonLd {
  const refId = citation.refId.trim()
  const ref = resolveDarwinReference(refId)
  const url = ref ? getDarwinReferenceUrl(ref) : null
  const doi = ref?.doi && isPlausibleDoi(ref.doi) ? ref.doi.trim() : null
  const schemaType = ref ? citationSchemaType(ref.type) : 'CreativeWork'
  const evidenceProperties: Array<Record<string, unknown>> = []

  if (citation.studyType) {
    evidenceProperties.push({
      '@type': 'PropertyValue',
      name: 'studyType',
      value: citation.studyType,
    })
  }

  if (citation.evidenceLevel) {
    evidenceProperties.push({
      '@type': 'PropertyValue',
      name: 'evidenceLevel',
      value: citation.evidenceLevel,
    })
  }

  if (citation.qualityScore != null) {
    evidenceProperties.push({
      '@type': 'PropertyValue',
      name: 'qualityScore',
      value: String(citation.qualityScore),
    })
  }

  return {
    '@type': schemaType,
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
    ...(schemaType === 'MedicalGuideline' && ref?.publisher
      ? { sourceOrganization: { '@type': 'Organization', name: ref.publisher } }
      : {}),
    ...(citation.page ? { pagination: citation.page } : {}),
    ...(citation.note ? { description: citation.note } : {}),
    ...(evidenceProperties.length > 0 ? { additionalProperty: evidenceProperties } : {}),
    ...(citation.limitations?.length
      ? {
          description: `${citation.note ? `${citation.note} ` : ''}Limitações: ${citation.limitations.join('; ')}`,
        }
      : {}),
    ...(citation.conflictsOfInterest ? { acknowledgements: citation.conflictsOfInterest } : {}),
  }
}

export function buildDiseaseJsonLd(params: {
  id: string
  title: string
  summary: string
  cid10?: string[] | null
  cid11?: string[] | null
  snomedCT?: string | null
  meshId?: string | null
  doid?: string | null
  umlsCui?: string | null
  ordo?: string | string[] | null
  loinc?: string[] | null
  updatedAt?: string | null
  citations?: DarwinCitation[]
}): JsonLd {
  const baseUrl = getPublicSiteUrl()
  const pageUrl = `${baseUrl}/conteudo/doencas/${params.id}`
  const citations = (params.citations || [])
    .filter((c) => !isBlockedCitationRefId(c.refId))
    .map((c) => citationToCreativeWork(c, pageUrl))

  const code = ontologyCodesFromDisease(params).map((entry) => ({
    '@type': 'MedicalCode',
    ...entry,
  }))
  const codeValue = code.length > 0 ? code : undefined
  const ontologySameAs = ontologySameAsFromCodes(code as Array<OntologyCodeLike>).filter((value) => value.length > 0)

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
      '@type': ['MedicalCondition', 'Disease'],
      sameAs: ['https://schema.org/Disease', ...ontologySameAs],
      '@id': `${pageUrl}#condition`,
      identifier: params.id,
      name: params.title,
      description: params.summary,
      ...(codeValue ? { code: codeValue } : {}),
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
  snomedCT?: string | string[] | null
  rxNormCui?: string | null
  drugBankId?: string | null
  loinc?: string[] | null
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
  const code = ontologyCodesFromMedication(params).map((entry) => ({
    '@type': 'MedicalCode',
    ...entry,
  }))
  const codeValue = code.length > 0 ? code : undefined
  const ontologySameAs = ontologySameAsFromCodes(code as Array<OntologyCodeLike>).filter((value) => value.length > 0)

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
      '@type': ['Drug', 'Substance'],
      sameAs: ['https://schema.org/Drug', ...ontologySameAs],
      '@id': `${pageUrl}#drug`,
      identifier: params.id,
      name: params.genericName,
      description: params.summary,
      ...(alternateName ? { alternateName } : {}),
      ...(codeValue ? { code: codeValue } : {}),
      ...(classes.length > 0 ? { drugClass: classes } : {}),
    },
    ...(citations.length > 0 ? { citation: citations } : {}),
  }
}
