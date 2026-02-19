import fs from 'node:fs'
import path from 'node:path'

import { isBlockedCitationRefId } from '../apps/web/lib/darwinMfc/blocked-sources'
import { buildDiseaseJsonLd, buildMedicationJsonLd } from '../apps/web/lib/darwinMfc/jsonld'
import { localReferences } from '../apps/web/lib/darwinMfc/local-references'
import { references as mfcReferences } from '../darwin-MFC/lib/data/references'
import { medicamentosConsolidados } from '../darwin-MFC/lib/data/medicamentos/index'
import { todasDoencas } from '../darwin-MFC/lib/data/doencas/index'
import type { Reference } from '../darwin-MFC/lib/types/references'
import { addInferredEvidenceToCitationsInPlace } from './lib/citation_evidence'

type JsonLdGraph = Record<string, unknown>
type JsonLdCodeEntry = { codingSystem: string; codeValue: string }

type IssueCode =
  | 'citations_filtered_out'
  | 'missing_reference_metadata'
  | 'blocked_ref_in_jsonld'
  | 'missing_ontology_codes'
  | 'incomplete_ontology_entry'
  | 'missing_evidence_raw'
  | 'missing_evidence_after_defaults'

type AuditSummary = {
  totalDiseasesChecked: number
  totalMedicationsChecked: number
  diseaseWithJsonLd: number
  medicationWithJsonLd: number
  totalCitationsInJsonLd: number
  missingRefIds: number
  blockedCitations: number
  blockedInJsonLd: number
  missingEvidenceRaw: number
  missingEvidence: number
  missingEvidenceAfterDefaults: number
  ontologyCodeEntries: number
  ontologyCodeEntriesDiseases: number
  ontologyCodeEntriesMedications: number
  incompleteOntologyCodeEntries: number
  ontologySystems: Record<string, number>
  ontologyIncompleteSystems: Record<string, number>
}

type AuditIssue = {
  entityType: 'disease' | 'medication'
  id: string
  level: 'error' | 'warn'
  code: IssueCode
  message: string
}

type JsonLdIssueState = {
  strict: boolean
  strictEvidence: boolean
  strictEvidenceAfterDefaults: boolean
  listIssues: boolean
  summary: AuditSummary
  issues: AuditIssue[]
  entityReports: JsonLdEntityReport[]
}

type JsonLdEntityReport = {
  entityType: 'disease' | 'medication'
  id: string
  title: string
  hasJsonLd: boolean
  citationsInInput: number
  citationsInJsonLd: number
  blockedFiltered: number
  missingRefIds: number
  missingEvidenceRaw: number
  missingEvidence: number
  missingEvidenceAfterDefaults: number
  blockedInJsonLd: number
  ontologyCodes: number
  incompleteOntologyCodes: number
  issueCodes: IssueCode[]
}

type DarwinCitation = {
  refId: string
  page?: string
  note?: string
  studyType?: string
  evidenceLevel?: string
  qualityScore?: number
  limitations?: string[]
  conflictsOfInterest?: string
}

type MedicationLike = {
  id: string
  nomeGenerico?: string
  nomesComerciais?: string[] | null
  brand_names?: string[] | null
  atcCode?: string | null
  snomedCT?: string | string[] | null
  rxNormCui?: string | null
  drugBankId?: string | null
  loinc?: string[] | null
  classeTerapeutica?: string | null
  subclasse?: string | null
  updatedAt?: string | null
  updated_at?: string | null
  summary?: string | null
  quickView?: unknown
}

type JsonLdValidationReport = {
  generatedAt: string
  input: {
    strict: boolean
    strictEvidence: boolean
    strictEvidenceAfterDefaults: boolean
    maxEntitiesPerType: number | 'all'
    issuesListed: boolean
  }
  summary: AuditSummary
  issues: AuditIssue[]
  entities: JsonLdEntityReport[]
}

const referenceCatalog = {
  ...mfcReferences,
  ...localReferences,
} as Record<string, Reference | undefined>

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asStringArray(value: unknown) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(asString).filter(Boolean)
  const text = asString(value)
  return text ? [text] : []
}

function hasEvidence(citation: DarwinCitation) {
  return Boolean(
    citation.studyType ||
      citation.evidenceLevel ||
      citation.qualityScore != null ||
      (citation.limitations?.length || 0) > 0
  )
}

function clonePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload))
}

function resolveDarwinReference(refId: string): Reference | null {
  const normalized = asString(refId).toLowerCase()
  if (!normalized) return null
  return referenceCatalog[normalized] || null
}

function normalizeOntologySystem(value: string) {
  const raw = asString(value)
  if (!raw) return 'UNKNOWN'
  return raw.trim().replace(/\s+/g, ' ').toUpperCase()
}

function getArgValue(name: string) {
  const args = process.argv.slice(2)
  for (let idx = 0; idx < args.length; idx++) {
    const token = args[idx]
    if (!token) continue

    if (token === name) {
      const next = args[idx + 1]
      if (!next || next.startsWith('-')) return null
      return next
    }

    if (token.startsWith(`${name}=`)) {
      const parts = token.split('=')
      if (parts.length < 2) return null
      return parts.slice(1).join('=').trim()
    }
  }

  return null
}

function hasFlag(name: string) {
  return process.argv.slice(2).includes(name)
}

function getMaxScope() {
  const raw = getArgValue('--max')
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function citationKey(citation: DarwinCitation) {
  return `${asString(citation.refId).toLowerCase()}|${asString(citation.page)}|${asString(citation.note)}`
}

function isCitationLike(value: unknown): value is DarwinCitation {
  if (!value || typeof value !== 'object') return false
  const candidate = value as DarwinCitation
  return typeof candidate.refId === 'string' && candidate.refId.trim().length > 0
}

function collectDarwinCitations(payload: unknown, includeBlocked = false) {
  const output: DarwinCitation[] = []
  const seen = new Set<string>()

  const walk = (value: unknown) => {
    if (!value) return
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }

    if (isCitationLike(value)) {
      const citation = value
      const blocked = isBlockedCitationRefId(citation.refId)
      if (blocked && !includeBlocked) return

      const key = citationKey(citation)
      if (seen.has(key)) return
      seen.add(key)

      output.push({
        ...citation,
        refId: citation.refId.trim().toLowerCase(),
        page: citation.page?.trim(),
        note: citation.note?.trim(),
      })
      return
    }

    if (typeof value !== 'object') return

    const record = value as Record<string, unknown>
    for (const [key, item] of Object.entries(record)) {
      if (key === 'citations' && Array.isArray(item)) {
        for (const entry of item) walk(entry)
        continue
      }
      walk(item)
    }
  }

  walk(payload)
  return output
}

function collectCitationIdentifiers(jsonLd: JsonLdGraph) {
  const citation = toArray(jsonLd.citation)
  const out: string[] = []
  for (const item of citation) {
    const record = toRecord(item)
    if (!record) continue
    const identifier = asString(record.identifier)
    if (!identifier) continue
    out.push(identifier)
  }
  return out
}

function collectCodeEntries(jsonLd: JsonLdGraph) {
  const mainEntity = toRecord(jsonLd.mainEntity)
  if (!mainEntity) return [] as JsonLdCodeEntry[]
  const code = toArray(mainEntity.code)
  const out: JsonLdCodeEntry[] = []

  for (const item of code) {
    const record = toRecord(item)
    if (!record) continue
    const codingSystem = asString(record.codingSystem)
    const codeValue = asString(record.codeValue)
    if (!codingSystem && !codeValue) continue
    out.push({ codingSystem, codeValue })
  }

  return out
}

function csvEscape(value: string) {
  const text = value.replace(/"/g, '""')
  return `"${text}"`
}

function formatIssue(label: string, count: number) {
  return `${label}: ${count.toLocaleString('en-US')}`
}

function getReportPathsFromArgs() {
  const reportDir =
    getArgValue('--report-dir') ||
    getArgValue('--out-dir') ||
    process.env.JSONLD_AUDIT_DIR ||
    null
  const jsonOut = getArgValue('--json-out')
  const csvOut = getArgValue('--entity-csv') || getArgValue('--csv-out')

  if (!jsonOut && !csvOut && !reportDir) return null

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safeDir = reportDir ? reportDir : path.join(process.cwd(), '.artifacts', 'jsonld-audit')
  const resolvedBase = path.isAbsolute(safeDir) ? safeDir : path.join(process.cwd(), safeDir)
  const baseFileName = `jsonld-audit-${stamp}`

  return {
    jsonOut: jsonOut
      ? (path.isAbsolute(jsonOut) ? jsonOut : path.join(process.cwd(), jsonOut))
      : path.join(resolvedBase, `${baseFileName}.json`),
    csvOut: csvOut
      ? (path.isAbsolute(csvOut) ? csvOut : path.join(process.cwd(), csvOut))
      : path.join(resolvedBase, `${baseFileName}.entities.csv`),
  }
}

function writeJsonFile(filePath: string, payload: JsonLdValidationReport) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`)
}

function writeEntitiesCsv(filePath: string, rows: JsonLdEntityReport[]) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })

  const headers = [
    'entityType',
    'id',
    'title',
    'hasJsonLd',
    'citationsInInput',
    'citationsInJsonLd',
    'blockedFiltered',
    'missingRefIds',
    'missingEvidenceRaw',
    'missingEvidence',
    'missingEvidenceAfterDefaults',
    'blockedInJsonLd',
    'ontologyCodes',
    'incompleteOntologyCodes',
    'issueCodes',
  ]

  const lines = [
    headers.join(','),
    ...rows.map((row) => {
      const values = [
        row.entityType,
        row.id,
        row.title,
        String(row.hasJsonLd),
        String(row.citationsInInput),
        String(row.citationsInJsonLd),
        String(row.blockedFiltered),
        String(row.missingRefIds),
        String(row.missingEvidenceRaw),
        String(row.missingEvidence),
        String(row.missingEvidenceAfterDefaults),
        String(row.blockedInJsonLd),
        String(row.ontologyCodes),
        String(row.incompleteOntologyCodes),
        row.issueCodes.join(';'),
      ]
      return values.map((value) => csvEscape(value)).join(',')
    }),
  ]

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`)
}

function addIssue(
  state: JsonLdIssueState,
  entityType: JsonLdEntityReport['entityType'],
  id: string,
  level: 'error' | 'warn',
  code: IssueCode,
  message: string
) {
  state.issues.push({ entityType, id, level, code, message })
}

function trackOntologyMetrics(
  entries: JsonLdCodeEntry[],
  summary: AuditSummary
) {
  const incompleteCodeEntries = entries.filter((entry) => !asString(entry.codingSystem) || !asString(entry.codeValue))

  for (const entry of entries) {
    const system = normalizeOntologySystem(entry.codingSystem)
    summary.ontologySystems[system] = (summary.ontologySystems[system] || 0) + 1
    if (!asString(entry.codingSystem) || !asString(entry.codeValue)) {
      summary.ontologyIncompleteSystems[system] = (summary.ontologyIncompleteSystems[system] || 0) + 1
    }
  }

  return incompleteCodeEntries
}

function inspectDisease(
  disease: {
    id: string
    titulo?: string
    fullContent?: unknown
    quickView?: { definicao?: string }
    cid10?: string[] | null
    cid11?: string[] | null
    snomedCT?: string | null
    meshId?: string | null
    doid?: string | null
    umlsCui?: string | null
    ordo?: string[] | string | null
    loinc?: string[] | null
  },
  state: JsonLdIssueState
) {
  const payload = toRecord(disease) as Record<string, unknown>
  const payloadWithInferredEvidence = clonePayload(payload)
  addInferredEvidenceToCitationsInPlace(payloadWithInferredEvidence, resolveDarwinReference)

  const citationsAllRaw = collectDarwinCitations(payload, true)
  const citationsRaw = collectDarwinCitations(payload, false)
  const citationsAll = collectDarwinCitations(payloadWithInferredEvidence, true)
  const citations = collectDarwinCitations(payloadWithInferredEvidence, false)
  const issueCodes: IssueCode[] = []

  const blockedCount = citationsAllRaw.length - citationsRaw.length
  const missingRefIds = citations.filter((citation) => !resolveDarwinReference(citation.refId)).length
  const missingEvidenceRaw = citationsRaw.filter((citation) => !hasEvidence(citation)).length
  const missingEvidenceAfterDefaults = citations.filter((citation) => !hasEvidence(citation)).length

  const jsonLd = buildDiseaseJsonLd({
    id: disease.id,
    title: asString(disease.titulo) || 'Sem título',
    summary:
      asString((payload.fullContent as Record<string, unknown> | undefined)?.summary) ||
      asString(payload.quickView && (payload.quickView as Record<string, unknown>).definicao) ||
      'Resumo não disponível.',
    cid10: disease.cid10 || [],
    cid11: disease.cid11 || [],
    snomedCT: disease.snomedCT || null,
    meshId: disease.meshId || null,
    doid: disease.doid || null,
    umlsCui: disease.umlsCui || null,
    ordo: disease.ordo || null,
    loinc: disease.loinc || [],
    citations,
  })

  const citationIds = collectCitationIdentifiers(jsonLd)
  const codeEntries = collectCodeEntries(jsonLd)
  const incompleteCodeEntries = trackOntologyMetrics(codeEntries, state.summary)
  const blockedInJsonLd = citationIds.filter((identifier) => isBlockedCitationRefId(identifier)).length

  state.summary.totalDiseasesChecked += 1
  state.summary.diseaseWithJsonLd += jsonLd ? 1 : 0
  state.summary.totalCitationsInJsonLd += citationIds.length
  state.summary.blockedCitations += blockedCount
  state.summary.missingRefIds += missingRefIds
  state.summary.missingEvidenceRaw += missingEvidenceRaw
  state.summary.missingEvidence += missingEvidenceAfterDefaults
  state.summary.missingEvidenceAfterDefaults += missingEvidenceAfterDefaults
  state.summary.ontologyCodeEntries += codeEntries.length
  state.summary.ontologyCodeEntriesDiseases += codeEntries.length
  state.summary.incompleteOntologyCodeEntries += incompleteCodeEntries.length
  state.summary.blockedInJsonLd += blockedInJsonLd

  const hadInputCitations = citationsAllRaw.length > 0
  if (hadInputCitations && citationIds.length === 0) {
    const level = blockedCount > 0 || missingRefIds > 0 ? 'error' : state.strict ? 'warn' : 'warn'
    addIssue(
      state,
      'disease',
      disease.id,
      level,
      'citations_filtered_out',
      `citations were filtered out before JSON-LD generation (${citations.length} visible of ${citationsAll.length})`
    )
    issueCodes.push('citations_filtered_out')
  }

  if (missingRefIds > 0) {
    addIssue(
      state,
      'disease',
      disease.id,
      state.strict ? 'error' : 'warn',
      'missing_reference_metadata',
      `missing reference metadata for ${missingRefIds} citation(s)`
    )
    issueCodes.push('missing_reference_metadata')
  }

  if (blockedInJsonLd > 0) {
    addIssue(
      state,
      'disease',
      disease.id,
      state.strict ? 'error' : 'warn',
      'blocked_ref_in_jsonld',
      `blocked ref still present in JSON-LD: ${blockedInJsonLd}`
    )
    issueCodes.push('blocked_ref_in_jsonld')
  }

  if (codeEntries.length === 0) {
    addIssue(
      state,
      'disease',
      disease.id,
      state.strict ? 'error' : 'warn',
      'missing_ontology_codes',
      'no ontology codes mapped in JSON-LD mainEntity'
    )
    issueCodes.push('missing_ontology_codes')
  } else if (incompleteCodeEntries.length > 0) {
    addIssue(
      state,
      'disease',
      disease.id,
      'warn',
      'incomplete_ontology_entry',
      `ontology code entries incomplete: ${incompleteCodeEntries.length}`
    )
    issueCodes.push('incomplete_ontology_entry')
  }

  if (missingEvidenceRaw > 0) {
    addIssue(
      state,
      'disease',
      disease.id,
      state.strictEvidence ? 'error' : 'warn',
      'missing_evidence_raw',
      `citations without evidence metadata (raw): ${missingEvidenceRaw}`
    )
    issueCodes.push('missing_evidence_raw')
  }

  if (missingEvidenceAfterDefaults > 0) {
    addIssue(
      state,
      'disease',
      disease.id,
      state.strictEvidenceAfterDefaults ? 'error' : 'warn',
      'missing_evidence_after_defaults',
      `citations without evidence metadata after defaults: ${missingEvidenceAfterDefaults}`
    )
    issueCodes.push('missing_evidence_after_defaults')
  }

  state.entityReports.push({
    entityType: 'disease',
    id: disease.id,
    title: asString(disease.titulo) || 'Sem título',
    hasJsonLd: Boolean(jsonLd),
    citationsInInput: citations.length,
    citationsInJsonLd: citationIds.length,
    blockedFiltered: blockedCount,
    missingRefIds,
    missingEvidenceRaw,
    missingEvidence: missingEvidenceAfterDefaults,
    missingEvidenceAfterDefaults,
    blockedInJsonLd,
    ontologyCodes: codeEntries.length,
    incompleteOntologyCodes: incompleteCodeEntries.length,
    issueCodes: Array.from(new Set(issueCodes)),
  })
}

function inspectMedication(medication: MedicationLike, state: JsonLdIssueState) {
  const payload = toRecord(medication)
  const payloadWithInferredEvidence = clonePayload(payload)
  addInferredEvidenceToCitationsInPlace(payloadWithInferredEvidence, resolveDarwinReference)

  const citationsAllRaw = collectDarwinCitations(payload, true)
  const citationsRaw = collectDarwinCitations(payload, false)
  const citationsAll = collectDarwinCitations(payloadWithInferredEvidence, true)
  const citations = collectDarwinCitations(payloadWithInferredEvidence, false)
  const issueCodes: IssueCode[] = []

  const blockedCount = citationsAllRaw.length - citationsRaw.length
  const missingRefIds = citations.filter((citation) => !resolveDarwinReference(citation.refId)).length
  const missingEvidenceRaw = citationsRaw.filter((citation) => !hasEvidence(citation)).length
  const missingEvidenceAfterDefaults = citations.filter((citation) => !hasEvidence(citation)).length
  const brandNames = [
    ...asStringArray(medication.nomesComerciais),
    ...asStringArray(medication.brand_names),
  ].filter((name, idx, list) => name && list.indexOf(name) === idx)

  const jsonLd = buildMedicationJsonLd({
    id: medication.id,
    genericName: asString(medication.nomeGenerico) || 'Medicamento',
    summary: asString(medication.summary) || 'Consulta de fármaco.',
    brandNames,
    atcCode: medication.atcCode || null,
    snomedCT: medication.snomedCT || null,
    rxNormCui: medication.rxNormCui || null,
    drugBankId: medication.drugBankId || null,
    loinc: medication.loinc || [],
    drugClass: medication.classeTerapeutica || 'medicamento',
    subclass: medication.subclasse || null,
    updatedAt: asString(medication.updatedAt || medication.updated_at),
    citations,
  })

  const citationIds = collectCitationIdentifiers(jsonLd)
  const codeEntries = collectCodeEntries(jsonLd)
  const incompleteCodeEntries = trackOntologyMetrics(codeEntries, state.summary)
  const blockedInJsonLd = citationIds.filter((identifier) => isBlockedCitationRefId(identifier)).length

  state.summary.totalMedicationsChecked += 1
  state.summary.medicationWithJsonLd += jsonLd ? 1 : 0
  state.summary.totalCitationsInJsonLd += citationIds.length
  state.summary.blockedCitations += blockedCount
  state.summary.missingRefIds += missingRefIds
  state.summary.missingEvidenceRaw += missingEvidenceRaw
  state.summary.missingEvidence += missingEvidenceAfterDefaults
  state.summary.missingEvidenceAfterDefaults += missingEvidenceAfterDefaults
  state.summary.ontologyCodeEntries += codeEntries.length
  state.summary.ontologyCodeEntriesMedications += codeEntries.length
  state.summary.incompleteOntologyCodeEntries += incompleteCodeEntries.length
  state.summary.blockedInJsonLd += blockedInJsonLd

  if (missingRefIds > 0) {
    addIssue(
      state,
      'medication',
      medication.id,
      state.strict ? 'error' : 'warn',
      'missing_reference_metadata',
      `missing reference metadata for ${missingRefIds} citation(s)`
    )
    issueCodes.push('missing_reference_metadata')
  }

  if (blockedInJsonLd > 0) {
    addIssue(
      state,
      'medication',
      medication.id,
      state.strict ? 'error' : 'warn',
      'blocked_ref_in_jsonld',
      `blocked ref still present in JSON-LD: ${blockedInJsonLd}`
    )
    issueCodes.push('blocked_ref_in_jsonld')
  }

  if (codeEntries.length === 0) {
    addIssue(
      state,
      'medication',
      medication.id,
      state.strict ? 'error' : 'warn',
      'missing_ontology_codes',
      'no ontology codes mapped in JSON-LD mainEntity'
    )
    issueCodes.push('missing_ontology_codes')
  } else if (incompleteCodeEntries.length > 0) {
    addIssue(
      state,
      'medication',
      medication.id,
      'warn',
      'incomplete_ontology_entry',
      `ontology code entries incomplete: ${incompleteCodeEntries.length}`
    )
    issueCodes.push('incomplete_ontology_entry')
  }

  if (missingEvidenceRaw > 0) {
    addIssue(
      state,
      'medication',
      medication.id,
      state.strictEvidence ? 'error' : 'warn',
      'missing_evidence_raw',
      `citations without evidence metadata (raw): ${missingEvidenceRaw}`
    )
    issueCodes.push('missing_evidence_raw')
  }

  if (missingEvidenceAfterDefaults > 0) {
    addIssue(
      state,
      'medication',
      medication.id,
      state.strictEvidenceAfterDefaults ? 'error' : 'warn',
      'missing_evidence_after_defaults',
      `citations without evidence metadata after defaults: ${missingEvidenceAfterDefaults}`
    )
    issueCodes.push('missing_evidence_after_defaults')
  }

  state.entityReports.push({
    entityType: 'medication',
    id: medication.id,
    title: asString(medication.nomeGenerico) || 'Medicamento',
    hasJsonLd: Boolean(jsonLd),
    citationsInInput: citations.length,
    citationsInJsonLd: citationIds.length,
    blockedFiltered: blockedCount,
    missingRefIds,
    missingEvidenceRaw,
    missingEvidence: missingEvidenceAfterDefaults,
    missingEvidenceAfterDefaults,
    blockedInJsonLd,
    ontologyCodes: codeEntries.length,
    incompleteOntologyCodes: incompleteCodeEntries.length,
    issueCodes: Array.from(new Set(issueCodes)),
  })
}

function printSummary(state: JsonLdIssueState) {
  const errorCount = state.issues.filter((issue) => issue.level === 'error').length
  const warnCount = state.issues.filter((issue) => issue.level === 'warn').length
  const avgOntologyCodesDisease = state.summary.totalDiseasesChecked
    ? Math.round((state.summary.ontologyCodeEntriesDiseases / state.summary.totalDiseasesChecked) * 100) / 100
    : 0
  const avgOntologyCodesMedication = state.summary.totalMedicationsChecked
    ? Math.round((state.summary.ontologyCodeEntriesMedications / state.summary.totalMedicationsChecked) * 100) / 100
    : 0

  console.log('\n=== JSON-LD Ontology & Evidence Audit ===')
  console.log(`Diseases checked: ${state.summary.totalDiseasesChecked}`)
  console.log(`Medications checked: ${state.summary.totalMedicationsChecked}`)
  console.log(`JSON-LD generated for diseases: ${state.summary.diseaseWithJsonLd}`)
  console.log(`JSON-LD generated for meds: ${state.summary.medicationWithJsonLd}`)
  console.log(formatIssue('Total citations represented in JSON-LD', state.summary.totalCitationsInJsonLd))
  console.log(formatIssue('Blocked citations (input)', state.summary.blockedCitations))
  console.log(formatIssue('Blocked citations still in JSON-LD', state.summary.blockedInJsonLd))
  console.log(formatIssue('Missing reference metadata', state.summary.missingRefIds))
  console.log(formatIssue('Citations missing evidence metadata (raw)', state.summary.missingEvidenceRaw))
  console.log(formatIssue('Citations missing evidence metadata (after defaults)', state.summary.missingEvidenceAfterDefaults))
  console.log(formatIssue('Ontology code entries mapped', state.summary.ontologyCodeEntries))
  console.log(formatIssue('Ontology code entries incomplete', state.summary.incompleteOntologyCodeEntries))
  console.log(`Avg ontology entries (diseases): ${avgOntologyCodesDisease.toFixed(2)}`)
  console.log(`Avg ontology entries (medications): ${avgOntologyCodesMedication.toFixed(2)}`)
  console.log(`Issues (errors): ${errorCount}`)
  console.log(`Issues (warns): ${warnCount}`)

  console.log('\nTop ontology systems (mapped entries):')
  const sortedSystems = Object.entries(state.summary.ontologySystems).sort((a, b) => b[1] - a[1])
  for (const [system, count] of sortedSystems.slice(0, 8)) {
    console.log(`  ${system}: ${count}`)
  }
  if (state.summary.incompleteOntologyCodeEntries > 0) {
    console.log('\nOntology systems with incomplete entries:')
    const sortedMissing = Object.entries(state.summary.ontologyIncompleteSystems).sort((a, b) => b[1] - a[1])
    for (const [system, count] of sortedMissing.slice(0, 8)) {
      console.log(`  ${system}: ${count}`)
    }
  }
}

function main() {
  const state: JsonLdIssueState = {
    strict: hasFlag('--strict'),
    strictEvidence: hasFlag('--strict-evidence'),
    strictEvidenceAfterDefaults: hasFlag('--strict-evidence-after-defaults'),
    listIssues: hasFlag('--list-issues'),
    summary: {
      totalDiseasesChecked: 0,
      totalMedicationsChecked: 0,
      diseaseWithJsonLd: 0,
      medicationWithJsonLd: 0,
      totalCitationsInJsonLd: 0,
      missingRefIds: 0,
      blockedCitations: 0,
      blockedInJsonLd: 0,
      missingEvidenceRaw: 0,
      missingEvidence: 0,
      missingEvidenceAfterDefaults: 0,
      ontologyCodeEntries: 0,
      ontologyCodeEntriesDiseases: 0,
      ontologyCodeEntriesMedications: 0,
      incompleteOntologyCodeEntries: 0,
      ontologySystems: {},
      ontologyIncompleteSystems: {},
    },
    issues: [],
    entityReports: [],
  }

  const max = getMaxScope()
  const diseases = (todasDoencas || []).filter(Boolean)
  const medications = (medicamentosConsolidados || []).filter(Boolean)
  const diseaseSubset = max ? diseases.slice(0, max) : diseases
  const medSubset = max ? medications.slice(0, max) : medications

  for (const disease of diseaseSubset) {
    inspectDisease(disease as unknown as { id: string; titulo?: string }, state)
  }

  for (const medication of medSubset) {
    inspectMedication(medication as MedicationLike, state)
  }

  printSummary(state)

  if (state.listIssues && state.issues.length > 0) {
    console.log('\n--- Issues ---')
    for (const issue of state.issues) {
      console.log(`${issue.level.toUpperCase()} [${issue.entityType} ${issue.id}] [${issue.code}] ${issue.message}`)
    }
  }

  const reportPaths = getReportPathsFromArgs()
  if (reportPaths) {
    const output: JsonLdValidationReport = {
      generatedAt: new Date().toISOString(),
      input: {
        strict: state.strict,
        strictEvidence: state.strictEvidence,
        strictEvidenceAfterDefaults: state.strictEvidenceAfterDefaults,
        maxEntitiesPerType: max ?? 'all',
        issuesListed: state.listIssues,
      },
      summary: state.summary,
      issues: state.issues,
      entities: state.entityReports,
    }

    writeJsonFile(reportPaths.jsonOut, output)
    writeEntitiesCsv(reportPaths.csvOut, state.entityReports)
    console.log(`\nJSON-LD audit artifacts written:
  - ${reportPaths.jsonOut}
  - ${reportPaths.csvOut}`)
  }

  const errorCount = state.issues.filter((issue) => issue.level === 'error').length
  const warnCount = state.issues.filter((issue) => issue.level === 'warn').length

  const strictModeEnabled = state.strict || state.strictEvidence || state.strictEvidenceAfterDefaults

  if (strictModeEnabled && errorCount > 0) {
    const activeFlags: string[] = []
    if (state.strict) activeFlags.push('--strict')
    if (state.strictEvidence) activeFlags.push('--strict-evidence')
    if (state.strictEvidenceAfterDefaults) activeFlags.push('--strict-evidence-after-defaults')

    console.log('\nStrict mode failed: found blocking issues with flags:', activeFlags.join(', '))
    process.exitCode = 1
    return
  }

  if (state.issues.length > 0) {
    const available = ['--strict', '--strict-evidence', '--strict-evidence-after-defaults']
    console.log(`\nThere are warnings. Run with ${available.join(', ')} to enforce stricter modes.`)
    return
  }

  console.log('\nJSON-LD audit completed with no issues.')
}

main()
