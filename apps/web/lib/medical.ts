import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import { getTopicById, theoryTopics, type TheoryTopic } from '@/lib/data/theory-content'
import { isMissingTableError } from '@/lib/supabase/errors'
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export type EnamedArea =
  | 'clinica_medica'
  | 'cirurgia'
  | 'pediatria'
  | 'ginecologia_obstetricia'
  | 'saude_coletiva'
export type TheoryDifficulty = TheoryTopic['difficulty']

type MedicalDiseaseRow = Database['public']['Tables']['medical_diseases']['Row']
type MedicalMedicationRow = Database['public']['Tables']['medical_medications']['Row']

interface PaginationParams {
  q?: string
  page?: number
  pageSize?: number
}

interface DiseaseListParams extends PaginationParams {
  area?: EnamedArea
}

interface MedicationListParams extends PaginationParams {
  drugClass?: string
}

interface PagedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  error: PostgrestError | null
}

interface TheoryTopicGeneratedRow {
  id: string
  topic_id: string | null
  version: number | null
  title: string
  description: string | null
  area: string | null
  difficulty: string | null
  definition: string | null
  epidemiology: string | null
  pathophysiology: string | null
  clinical_presentation: string | null
  diagnosis: string | null
  treatment: string | null
  complications: string | null
  prognosis: string | null
  key_points: string[] | null
  estimated_read_time: number | null
  related_disease_ids: string[] | null
  related_medication_ids: string[] | null
  status: string | null
}

interface TheoryTopicListParams {
  q?: string
  area?: EnamedArea | string
  difficulty?: TheoryDifficulty | string
}

interface TheoryResult<T> {
  data: T
  source: 'supabase' | 'fallback'
  error: PostgrestError | null
  meta?: {
    id: string
    topic_id: string | null
    version: number | null
    status: string | null
    source_type?: string | null
    source_disease_id?: string | null
    validation_score?: number | null
    generated_at?: string | null
    last_updated?: string | null
    published_at?: string | null
    updated_at?: string | null
  } | null
  citations?: Array<{
    section: string
    url: string
    title?: string | null
    source?: string | null
    evidence_level?: string | null
    publication_year?: number | null
    authors?: string | null
    journal?: string | null
    doi?: string | null
  }>
}

const DEFAULT_PAGE_SIZE = 25

const DISEASE_SELECT = `
  id,
  title,
  enamed_area,
  categoria,
  subcategoria,
  cid10,
  summary,
  search_terms,
  payload,
  created_at,
  updated_at
`

const MEDICATION_SELECT = `
  id,
  generic_name,
  brand_names,
  atc_code,
  drug_class,
  subclass,
  summary,
  search_terms,
  payload,
  created_at,
  updated_at
`

const THEORY_SELECT = `
  id,
  topic_id,
  version,
  title,
  description,
  area,
  difficulty,
  definition,
  epidemiology,
  pathophysiology,
  clinical_presentation,
  diagnosis,
  treatment,
  complications,
  prognosis,
  key_points,
  estimated_read_time,
  related_disease_ids,
  related_medication_ids,
  status
`

const THEORY_AREA_LABELS: Record<EnamedArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  pediatria: 'Pediatria',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  saude_coletiva: 'Saúde Coletiva',
}

const THEORY_AREAS = new Set<EnamedArea>(Object.keys(THEORY_AREA_LABELS) as EnamedArea[])
const THEORY_DIFFICULTIES = new Set<TheoryDifficulty>(['basico', 'intermediario', 'avancado'])
const MISSING_COLUMN_CODE = '42703'

function normalizePage(value?: number) {
  return value && Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
}

function normalizePageSize(value?: number) {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE
  return Math.min(100, Math.max(10, Math.floor(value)))
}

function sanitizeQuery(query?: string) {
  return (query || '').trim()
}

function escapeIlike(value: string) {
  return value.replaceAll('%', '\\%').replaceAll('_', '\\_')
}

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeTheoryAreaInput(value?: string | null): EnamedArea | null {
  if (!value) return null
  const normalized = stripAccents(value.trim().toLowerCase()).replaceAll('-', '_')

  const aliases: Record<string, EnamedArea> = {
    clinica_medica: 'clinica_medica',
    clinica: 'clinica_medica',
    cirurgia: 'cirurgia',
    pediatria: 'pediatria',
    ginecologia_obstetricia: 'ginecologia_obstetricia',
    ginecologia: 'ginecologia_obstetricia',
    saude_coletiva: 'saude_coletiva',
    saude: 'saude_coletiva',
    'clinica medica': 'clinica_medica',
    'ginecologia e obstetricia': 'ginecologia_obstetricia',
    'saude coletiva': 'saude_coletiva',
  }

  const maybeArea = aliases[normalized]
  if (!maybeArea) return null
  return THEORY_AREAS.has(maybeArea) ? maybeArea : null
}

function normalizeTheoryDifficultyInput(value?: string | null): TheoryDifficulty | null {
  if (!value) return null
  const normalized = stripAccents(value.trim().toLowerCase()).replaceAll('-', '_')

  const aliases: Record<string, TheoryDifficulty> = {
    basico: 'basico',
    intermediario: 'intermediario',
    avancado: 'avancado',
    beginner: 'basico',
    intermediate: 'intermediario',
    advanced: 'avancado',
    facil: 'basico',
    medio: 'intermediario',
    dificil: 'avancado',
  }

  const maybeDifficulty = aliases[normalized]
  if (!maybeDifficulty) return null
  return THEORY_DIFFICULTIES.has(maybeDifficulty) ? maybeDifficulty : null
}

function isMissingColumnError(error?: PostgrestError | null) {
  return error?.code === MISSING_COLUMN_CODE
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function estimateReadTime(sections: TheoryTopic['sections'], keyPoints: string[]) {
  const text = [Object.values(sections).join(' '), keyPoints.join(' ')].join(' ').trim()
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0
  if (!words) return 8
  return Math.max(5, Math.min(30, Math.round(words / 180)))
}

function mapTheoryRowToTopic(row: TheoryTopicGeneratedRow): TheoryTopic | null {
  const title = row.title?.trim()
  const definition = row.definition?.trim()
  if (!title || !definition) return null

  const area = normalizeTheoryAreaInput(row.area) || 'clinica_medica'
  const difficulty = normalizeTheoryDifficultyInput(row.difficulty) || 'intermediario'

  const sections: TheoryTopic['sections'] = {
    definition,
  }

  if (row.epidemiology?.trim()) sections.epidemiology = row.epidemiology.trim()
  if (row.pathophysiology?.trim()) sections.pathophysiology = row.pathophysiology.trim()
  if (row.clinical_presentation?.trim()) sections.clinicalPresentation = row.clinical_presentation.trim()
  if (row.diagnosis?.trim()) sections.diagnosis = row.diagnosis.trim()
  if (row.treatment?.trim()) sections.treatment = row.treatment.trim()
  if (row.complications?.trim()) sections.complications = row.complications.trim()
  if (row.prognosis?.trim()) sections.prognosis = row.prognosis.trim()

  const keyPoints = (row.key_points || []).map((item) => item?.trim()).filter(Boolean) as string[]
  const description =
    row.description?.trim() ||
    keyPoints[0] ||
    `${title} com foco em revisão teórica para preparação ENAMED.`

  const estimatedReadTime =
    typeof row.estimated_read_time === 'number' && row.estimated_read_time > 0
      ? row.estimated_read_time
      : estimateReadTime(sections, keyPoints)

  return {
    id: (row.topic_id || row.id).trim(),
    title,
    description,
    area: THEORY_AREA_LABELS[area],
    difficulty,
    sections,
    relatedDiseases: (row.related_disease_ids || []).filter(Boolean),
    relatedMedications: (row.related_medication_ids || []).filter(Boolean),
    keyPoints,
    estimatedReadTime,
  }
}

function dedupeTheoryRows(rows: TheoryTopicGeneratedRow[]) {
  const seen = new Set<string>()
  const deduped: TheoryTopicGeneratedRow[] = []

  for (const row of rows) {
    const key = (row.topic_id || row.id || '').trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    deduped.push(row)
  }

  return deduped
}

function matchesTheoryQuery(topic: TheoryTopic, query: string) {
  const normalizedQuery = stripAccents(query.toLowerCase())
  const haystack = [
    topic.title,
    topic.description,
    topic.area,
    topic.keyPoints.join(' '),
    Object.values(topic.sections).join(' '),
  ]
    .join(' ')
    .toLowerCase()

  return stripAccents(haystack).includes(normalizedQuery)
}

function filterFallbackTheoryTopics({
  q,
  area,
  difficulty,
}: {
  q?: string
  area?: EnamedArea | string
  difficulty?: TheoryDifficulty | string
}) {
  const normalizedArea = normalizeTheoryAreaInput(area)
  const normalizedDifficulty = normalizeTheoryDifficultyInput(difficulty)
  const sanitizedQuery = sanitizeQuery(q)

  return theoryTopics.filter((topic) => {
    const topicArea = normalizeTheoryAreaInput(topic.area)
    if (normalizedArea && topicArea !== normalizedArea) return false
    if (normalizedDifficulty && topic.difficulty !== normalizedDifficulty) return false
    if (sanitizedQuery && !matchesTheoryQuery(topic, sanitizedQuery)) return false
    return true
  })
}

function buildTheoryQuery({
  supabase,
  q,
  area,
  difficulty,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>
  q?: string
  area?: EnamedArea | string
  difficulty?: TheoryDifficulty | string
}) {
  const normalizedArea = normalizeTheoryAreaInput(area)
  const normalizedDifficulty = normalizeTheoryDifficultyInput(difficulty)
  const sanitizedQuery = sanitizeQuery(q)

  let query = (supabase as any).from('theory_topics_generated')
    .select(THEORY_SELECT)
    .order('topic_id', { ascending: true })
    .order('version', { ascending: false })

  if (normalizedArea) {
    query = query.eq('area', normalizedArea)
  }

  if (normalizedDifficulty) {
    query = query.eq('difficulty', normalizedDifficulty)
  }

  if (sanitizedQuery) {
    const safeQuery = escapeIlike(sanitizedQuery)
    query = query.or(
      `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,definition.ilike.%${safeQuery}%`
    )
  }

  return query
}

function mapTheoryRows(rows: TheoryTopicGeneratedRow[]) {
  return dedupeTheoryRows(rows)
    .map(mapTheoryRowToTopic)
    .filter((topic): topic is TheoryTopic => Boolean(topic))
}

export async function listTheoryTopics(
  params: TheoryTopicListParams
): Promise<TheoryResult<TheoryTopic[]>> {
  const supabase = await createServerClient()

  const published = await buildTheoryQuery({ supabase, ...params }).in('status', ['approved', 'published'])

  if (published.error && isMissingTableError(published.error)) {
    return {
      data: filterFallbackTheoryTopics(params),
      source: 'fallback',
      error: null,
    }
  }

  let rows = (published.data || []) as TheoryTopicGeneratedRow[]
  let lastError = published.error

  if (published.error && isMissingColumnError(published.error)) {
    const withoutStatus = await buildTheoryQuery({ supabase, ...params })
    rows = (withoutStatus.data || []) as TheoryTopicGeneratedRow[]
    lastError = withoutStatus.error
  } else if (!published.error && rows.length === 0) {
    const withoutStatus = await buildTheoryQuery({ supabase, ...params })
    rows = (withoutStatus.data || []) as TheoryTopicGeneratedRow[]
    lastError = withoutStatus.error
  }

  if (lastError) {
    return {
      data: filterFallbackTheoryTopics(params),
      source: 'fallback',
      error: lastError,
    }
  }

  const topics = mapTheoryRows(rows)
  if (topics.length === 0) {
    return {
      data: filterFallbackTheoryTopics(params),
      source: 'fallback',
      error: null,
    }
  }

  const sanitizedQuery = sanitizeQuery(params.q)
  const filtered =
    sanitizedQuery.length > 0 ? topics.filter((topic) => matchesTheoryQuery(topic, sanitizedQuery)) : topics

  if (filtered.length === 0) {
    return {
      data: filterFallbackTheoryTopics(params),
      source: 'fallback',
      error: null,
    }
  }

  return {
    data: filtered,
    source: 'supabase',
    error: null,
  }
}

export async function getTheoryTopicById(id: string): Promise<TheoryResult<TheoryTopic | null>> {
  const sanitizedId = (id || '').trim()
  if (!sanitizedId) {
    return { data: null, source: 'fallback', error: null }
  }

  const supabase = await createServerClient()

  const byTopicId = await (supabase as any).from('theory_topics_generated')
    .select(THEORY_SELECT)
    .eq('topic_id', sanitizedId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (byTopicId.error && isMissingTableError(byTopicId.error)) {
    return {
      data: getTopicById(sanitizedId) || null,
      source: 'fallback',
      error: null,
    }
  }

  if (!byTopicId.error && byTopicId.data) {
    const meta = await (async () => {
      const base = byTopicId.data as any
      const rowId = (base?.id as string | undefined) || null
      if (!rowId) return null

      const selectAttempts = [
        'id, topic_id, version, status, source_type, source_disease_id, validation_score, generated_at, last_updated, published_at, updated_at',
        'id, topic_id, version, status, updated_at',
        'id, topic_id, version, status',
        'id, topic_id, version',
      ]

      for (const select of selectAttempts) {
        const result = await (supabase as any).from('theory_topics_generated').select(select).eq('id', rowId).maybeSingle()
        if (!result?.error && result?.data) return result.data as any
        if (result?.error && !isMissingColumnError(result.error)) break
      }

      return null
    })()

    const citations = await (async () => {
      const base = byTopicId.data as any
      const rowId = (base?.id as string | undefined) || null
      if (!rowId) return []

      const joined = await (supabase as any).from('theory_topic_citations')
        .select(
          'section_name, theory_citations(url, title, source, evidence_level, publication_year, authors, journal, doi)'
        )
        .eq('topic_id', rowId)

      if (joined.error || !joined.data) return []

      const rows = joined.data as Array<any>
      const flattened = rows
        .map((row) => {
          const citation = row.theory_citations
          const url = citation?.url as string | undefined
          if (!url) return null

          return {
            section: (row.section_name as string | undefined) || 'unknown',
            url,
            title: citation.title ?? null,
            source: citation.source ?? null,
            evidence_level: citation.evidence_level ?? null,
            publication_year: citation.publication_year ?? null,
            authors: citation.authors ?? null,
            journal: citation.journal ?? null,
            doi: citation.doi ?? null,
          }
        })
        .filter(Boolean) as NonNullable<TheoryResult<null>['citations']>

      const seen = new Set<string>()
      return flattened.filter((item) => {
        const key = `${item.section}:${item.url}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    })()

    return {
      data: mapTheoryRowToTopic(byTopicId.data as TheoryTopicGeneratedRow),
      source: 'supabase',
      error: null,
      meta: meta
        ? {
            id: meta.id ?? (byTopicId.data as any).id,
            topic_id: meta.topic_id ?? (byTopicId.data as any).topic_id ?? null,
            version: meta.version ?? (byTopicId.data as any).version ?? null,
            status: meta.status ?? (byTopicId.data as any).status ?? null,
            source_type: meta.source_type ?? null,
            source_disease_id: meta.source_disease_id ?? null,
            validation_score: meta.validation_score ?? null,
            generated_at: meta.generated_at ?? null,
            last_updated: meta.last_updated ?? null,
            published_at: meta.published_at ?? null,
            updated_at: meta.updated_at ?? null,
          }
        : {
            id: (byTopicId.data as any).id,
            topic_id: (byTopicId.data as any).topic_id ?? null,
            version: (byTopicId.data as any).version ?? null,
            status: (byTopicId.data as any).status ?? null,
          },
      citations,
    }
  }

  if (byTopicId.error && isMissingColumnError(byTopicId.error) && isUuid(sanitizedId)) {
    const byUuid = await (supabase as any).from('theory_topics_generated')
      .select(THEORY_SELECT)
      .eq('id', sanitizedId)
      .maybeSingle()

    if (!byUuid.error && byUuid.data) {
      return {
        data: mapTheoryRowToTopic(byUuid.data as TheoryTopicGeneratedRow),
        source: 'supabase',
        error: null,
      }
    }
  } else if (!byTopicId.error && !byTopicId.data && isUuid(sanitizedId)) {
    const byUuid = await (supabase as any).from('theory_topics_generated')
      .select(THEORY_SELECT)
      .eq('id', sanitizedId)
      .maybeSingle()

    if (!byUuid.error && byUuid.data) {
      return {
        data: mapTheoryRowToTopic(byUuid.data as TheoryTopicGeneratedRow),
        source: 'supabase',
        error: null,
      }
    }
  }

  return {
    data: getTopicById(sanitizedId) || null,
    source: 'fallback',
    error: byTopicId.error,
  }
}

export async function listDiseases(params: DiseaseListParams): Promise<PagedResult<MedicalDiseaseRow>> {
  const q = sanitizeQuery(params.q)
  const page = normalizePage(params.page)
  const pageSize = normalizePageSize(params.pageSize)
  const offset = (page - 1) * pageSize

  const supabase = await createServerClient()

  let query = supabase
    .from('medical_diseases')
    .select(DISEASE_SELECT, { count: 'exact' })
    .order('title', { ascending: true })

  if (params.area) {
    query = query.eq('enamed_area', params.area)
  }

  if (q) {
    const safeQuery = escapeIlike(q)
    query = query.or(`search_terms.ilike.%${safeQuery}%,title.ilike.%${safeQuery}%`)
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1)

  if (error) {
    return { data: [], count: 0, page, pageSize, error }
  }

  if (q && (count || 0) === 0) {
    let ftsQuery = supabase
      .from('medical_diseases')
      .select(DISEASE_SELECT, { count: 'exact' })
      .order('title', { ascending: true })
      .textSearch('search_terms', q, { config: 'portuguese', type: 'websearch' })

    if (params.area) {
      ftsQuery = ftsQuery.eq('enamed_area', params.area)
    }

    const fts = await ftsQuery.range(offset, offset + pageSize - 1)
    if (!fts.error) {
      return {
        data: (fts.data || []) as MedicalDiseaseRow[],
        count: fts.count || 0,
        page,
        pageSize,
        error: null,
      }
    }
  }

  return {
    data: (data || []) as MedicalDiseaseRow[],
    count: count || 0,
    page,
    pageSize,
    error: null,
  }
}

export async function getDiseaseById(
  id: string
): Promise<{ data: MedicalDiseaseRow | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('medical_diseases')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return { data: (data as MedicalDiseaseRow | null) || null, error }
}

export async function listMedications(
  params: MedicationListParams
): Promise<PagedResult<MedicalMedicationRow>> {
  const q = sanitizeQuery(params.q)
  const page = normalizePage(params.page)
  const pageSize = normalizePageSize(params.pageSize)
  const offset = (page - 1) * pageSize

  const supabase = await createServerClient()

  let query = supabase
    .from('medical_medications')
    .select(MEDICATION_SELECT, { count: 'exact' })
    .order('generic_name', { ascending: true })

  if (params.drugClass) {
    query = query.eq('drug_class', params.drugClass)
  }

  if (q) {
    const safeQuery = escapeIlike(q)
    query = query.or(
      `search_terms.ilike.%${safeQuery}%,generic_name.ilike.%${safeQuery}%,atc_code.ilike.%${safeQuery}%`
    )
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1)

  if (error) {
    return { data: [], count: 0, page, pageSize, error }
  }

  if (q && (count || 0) === 0) {
    let ftsQuery = supabase
      .from('medical_medications')
      .select(MEDICATION_SELECT, { count: 'exact' })
      .order('generic_name', { ascending: true })
      .textSearch('search_terms', q, { config: 'portuguese', type: 'websearch' })

    if (params.drugClass) {
      ftsQuery = ftsQuery.eq('drug_class', params.drugClass)
    }

    const fts = await ftsQuery.range(offset, offset + pageSize - 1)
    if (!fts.error) {
      return {
        data: (fts.data || []) as MedicalMedicationRow[],
        count: fts.count || 0,
        page,
        pageSize,
        error: null,
      }
    }
  }

  return {
    data: (data || []) as MedicalMedicationRow[],
    count: count || 0,
    page,
    pageSize,
    error: null,
  }
}

export async function getMedicationById(
  id: string
): Promise<{ data: MedicalMedicationRow | null; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('medical_medications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return { data: (data as MedicalMedicationRow | null) || null, error }
}

export async function listMedicationClasses(): Promise<{ data: string[]; error: PostgrestError | null }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('medical_medications')
    .select('drug_class')
    .order('drug_class', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  const rows = ((data || []) as Array<{ drug_class: string | null }>).filter(Boolean)
  const classes = Array.from(
    new Set(rows.map((row) => row.drug_class).filter((value): value is string => Boolean(value)))
  )
  return { data: classes, error: null }
}

export async function getTheoryTopicCount() {
  const supabase = await createServerClient()

  const { count: publishedCount, error: publishedError } = await (supabase as any)
    .from('theory_topics_generated')
    .select('id', { count: 'exact', head: true })
    .in('status', ['approved', 'published'])

  if (!publishedError) {
    return publishedCount || 0
  }

  const { count: allCount, error: allError } = await (supabase as any).from('theory_topics_generated')
    .select('id', { count: 'exact', head: true })

  if (!allError) {
    return allCount || 0
  }

  if (isMissingTableError(publishedError) || isMissingTableError(allError)) {
    return theoryTopics.length
  }

  return theoryTopics.length
}

export async function getMedicalCounts() {
  const supabase = await createServerClient()

  const [diseasesCountResult, medicationsCountResult] = await Promise.all([
    supabase.from('medical_diseases').select('id', { count: 'exact', head: true }),
    supabase.from('medical_medications').select('id', { count: 'exact', head: true }),
  ])

  return {
    diseases: diseasesCountResult.count || 0,
    medications: medicationsCountResult.count || 0,
    error: diseasesCountResult.error || medicationsCountResult.error,
  }
}
