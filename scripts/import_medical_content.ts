import { createClient } from '@supabase/supabase-js'

import { doencasConsolidadas } from '../darwin-MFC/lib/data/doencas/index'
import { medicamentosConsolidados } from '../darwin-MFC/lib/data/medicamentos/index'
import type { CategoriaDoenca, Doenca } from '../darwin-MFC/lib/types/doenca'
import type { Medicamento } from '../darwin-MFC/lib/types/medicamento'

const DEFAULT_BATCH_SIZE = 200

type ImportOnly = 'diseases' | 'medications' | 'all'

function getArgValue(args: string[], flag: string) {
  const idx = args.indexOf(flag)
  if (idx === -1) return null
  const value = args[idx + 1]
  if (!value || value.startsWith('-')) return null
  return value
}

function parseImportOnly(args: string[]): ImportOnly {
  const only = getArgValue(args, '--only')
  if (!only) return 'all'
  if (only === 'diseases' || only === 'medications' || only === 'all') return only
  throw new Error(`Invalid --only value: ${only} (expected diseases|medications|all)`)
}

function parsePositiveInt(value: string | null, label: string) {
  if (!value) return null
  const num = Number.parseInt(value, 10)
  if (!Number.isFinite(num) || num <= 0) throw new Error(`Invalid ${label}: ${value}`)
  return num
}

type EnamedArea =
  | 'clinica_medica'
  | 'cirurgia'
  | 'pediatria'
  | 'ginecologia_obstetricia'
  | 'saude_coletiva'

const categoriaToArea: Record<CategoriaDoenca, EnamedArea> = {
  cardiovascular: 'clinica_medica',
  metabolico: 'clinica_medica',
  respiratorio: 'clinica_medica',
  musculoesqueletico: 'clinica_medica',
  saude_mental: 'clinica_medica',
  infecciosas: 'clinica_medica',
  dermatologico: 'clinica_medica',
  gastrointestinal: 'cirurgia',
  neurologico: 'clinica_medica',
  endocrino: 'clinica_medica',
  hematologico: 'clinica_medica',
  urologico: 'cirurgia',
  ginecologico: 'ginecologia_obstetricia',
  pediatrico: 'pediatria',
  geriatrico: 'clinica_medica',
  outros: 'saude_coletiva',
}

function normalizeText(value: unknown) {
  if (value == null) return ''
  return String(value).trim()
}

function compact(parts: Array<unknown>) {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .map((part) => normalizeText(part))
    .filter(Boolean)
}

function uniqueWords(parts: Array<unknown>) {
  return Array.from(new Set(compact(parts))).join(' ')
}

function toJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function diseaseSummary(item: Partial<Doenca>) {
  return (
    normalizeText(item.quickView?.definicao) ||
    normalizeText(item.fullContent?.fisiopatologia?.texto) ||
    normalizeText(item.titulo)
  )
}

function medicationSummary(item: Medicamento) {
  return (
    normalizeText(item.indicacoes?.[0]) ||
    normalizeText(item.mecanismoAcao) ||
    normalizeText(item.classeTerapeutica)
  )
}

function mapDiseaseRow(item: Partial<Doenca>) {
  const categoria = (item.categoria || 'outros') as CategoriaDoenca

  return {
    id: item.id || '',
    title: normalizeText(item.titulo) || 'Sem titulo',
    enamed_area: categoriaToArea[categoria] || 'clinica_medica',
    categoria,
    subcategoria: item.subcategoria || null,
    cid10: item.cid10 || [],
    summary: diseaseSummary(item) || null,
    search_terms: uniqueWords([
      item.id,
      item.titulo,
      item.sinonimos,
      item.tags,
      item.categoria,
      item.subcategoria,
      item.cid10,
      item.ciap2,
      item.doid,
      item.snomedCT,
      item.meshId,
      item.umlsCui,
      item.quickView?.definicao,
      item.quickView?.criteriosDiagnosticos,
      item.quickView?.redFlags,
      item.fullContent?.quadroClinico?.sintomasPrincipais,
      item.fullContent?.quadroClinico?.sinaisExameFisico,
      item.fullContent?.diagnostico?.criterios,
    ]),
    payload: toJson(item),
  }
}

function mapMedicationRow(item: Medicamento) {
  return {
    id: item.id,
    generic_name: normalizeText(item.nomeGenerico),
    brand_names: item.nomesComerciais || [],
    atc_code: item.atcCode || null,
    drug_class: normalizeText(item.classeTerapeutica),
    subclass: item.subclasse || null,
    summary: medicationSummary(item) || null,
    search_terms: uniqueWords([
      item.id,
      item.nomeGenerico,
      item.nomesComerciais,
      item.atcCode,
      item.classeTerapeutica,
      item.subclasse,
      item.indicacoes,
      item.tags,
      item.mecanismoAcao,
      item.contraindicacoes,
      item.monitorizacao,
      item.interacoes?.map((entry) => [entry.medicamento, entry.efeito, entry.conduta]),
    ]),
    payload: toJson(item),
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size))
  }
  return output
}

async function importTableRows<T extends { id: string }>(
  table: 'medical_diseases' | 'medical_medications',
  rows: T[],
  client: ReturnType<typeof createClient>
  batchSize: number
) {
  let inserted = 0
  let updated = 0

  for (const batch of chunk(rows, batchSize)) {
    const batchIds = batch.map((row) => row.id)

    const existing = await client.from(table).select('id').in('id', batchIds)
    if (existing.error) {
      throw new Error(`[${table}] failed to fetch existing rows: ${existing.error.message}`)
    }

    const existingIds = new Set((existing.data || []).map((row) => row.id))
    const existingCount = batchIds.filter((id) => existingIds.has(id)).length

    inserted += batch.length - existingCount
    updated += existingCount

    const upsertResult = await client.from(table).upsert(batch, { onConflict: 'id' })
    if (upsertResult.error) {
      throw new Error(`[${table}] upsert failed: ${upsertResult.error.message}`)
    }
  }

  const countResult = await client.from(table).select('id', { count: 'exact', head: true })
  if (countResult.error) {
    throw new Error(`[${table}] count failed: ${countResult.error.message}`)
  }

  return {
    inserted,
    updated,
    totalAfterImport: countResult.count || 0,
  }
}

async function run() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const only = parseImportOnly(args)
  const batchSize = parsePositiveInt(getArgValue(args, '--batch-size'), '--batch-size') ?? DEFAULT_BATCH_SIZE
  const limit = parsePositiveInt(getArgValue(args, '--limit'), '--limit')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const diseaseRowsAll = doencasConsolidadas
    .filter((item) => Boolean(item.id && item.titulo && item.categoria))
    .map(mapDiseaseRow)
    .filter((item) => item.id)

  const medicationRowsAll = medicamentosConsolidados
    .filter((item) => Boolean(item.id && item.nomeGenerico && item.classeTerapeutica))
    .map(mapMedicationRow)

  const diseaseRows = typeof limit === 'number' ? diseaseRowsAll.slice(0, limit) : diseaseRowsAll
  const medicationRows = typeof limit === 'number' ? medicationRowsAll.slice(0, limit) : medicationRowsAll

  console.log('Starting medical content import...')
  console.log(`Mode: ${only}`)
  if (dryRun) console.log('Dry run: no writes to Supabase')
  if (limit) console.log(`Limit: ${limit}`)
  console.log(`Batch size: ${batchSize}`)
  console.log(`Diseases ready: ${diseaseRows.length}`)
  console.log(`Medications ready: ${medicationRows.length}`)

  if (dryRun) return

  const diseasesReport =
    only === 'all' || only === 'diseases'
      ? await importTableRows('medical_diseases', diseaseRows, client, batchSize)
      : null
  const medicationsReport =
    only === 'all' || only === 'medications'
      ? await importTableRows('medical_medications', medicationRows, client, batchSize)
      : null

  console.log('')
  console.log('Import completed.')
  if (diseasesReport) {
    console.log(
      `medical_diseases: inserted ${diseasesReport.inserted}, updated ${diseasesReport.updated}, total ${diseasesReport.totalAfterImport}`
    )
  }
  if (medicationsReport) {
    console.log(
      `medical_medications: inserted ${medicationsReport.inserted}, updated ${medicationsReport.updated}, total ${medicationsReport.totalAfterImport}`
    )
  }
}

run().catch((error) => {
  console.error('Medical content import failed.')
  console.error(error)
  process.exit(1)
})
