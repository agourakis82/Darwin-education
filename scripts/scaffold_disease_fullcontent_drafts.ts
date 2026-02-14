import { todasDoencas } from '../darwin-MFC/lib/data/doencas/index'

import fs from 'node:fs'
import path from 'node:path'

type PartialDisease = Record<string, unknown> & { id?: unknown }

function isFullContentPresent(disease: unknown) {
  if (!disease || typeof disease !== 'object') return false
  const maybe = disease as { fullContent?: unknown }
  const fc = maybe.fullContent
  if (!fc || typeof fc !== 'object') return false

  const record = fc as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length === 0) return false

  return keys.some((k) => {
    const v = record[k]
    if (!v) return false
    if (typeof v === 'string') return v.trim().length > 0
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>
      return Object.entries(obj).some(([, inner]) => {
        if (!inner) return false
        if (typeof inner === 'string') return inner.trim().length > 0
        if (Array.isArray(inner)) return inner.length > 0
        if (typeof inner === 'object') return Object.keys(inner as Record<string, unknown>).length > 0
        return false
      })
    }
    return false
  })
}

function findRepoRoot() {
  const candidates = [process.cwd(), path.join(process.cwd(), '..'), path.join(process.cwd(), '..', '..')]
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(candidate, 'darwin-MFC')) && fs.existsSync(path.join(candidate, 'package.json'))) {
        return candidate
      }
    } catch {
      // ignore
    }
  }
  return process.cwd()
}

function getArgFlag(name: string) {
  return process.argv.slice(2).includes(name)
}

function getArgValue(flag: string) {
  const args = process.argv.slice(2)
  const idx = args.indexOf(flag)
  if (idx === -1) return null
  const value = args[idx + 1]
  if (!value || value.startsWith('-')) return null
  return value
}

function parsePositiveInt(value: string | null) {
  if (!value) return null
  const num = Number.parseInt(value, 10)
  if (!Number.isFinite(num) || num <= 0) return null
  return num
}

function parseIds() {
  const args = process.argv.slice(2)
  const ids: string[] = []

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--id') {
      const value = args[i + 1]
      if (value && !value.startsWith('-')) ids.push(value)
      continue
    }
    if (arg === '--ids') {
      const value = args[i + 1]
      if (value && !value.startsWith('-')) {
        ids.push(...value.split(',').map((v) => v.trim()).filter(Boolean))
      }
    }
  }

  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)))
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (patch == null) return base
  if (typeof patch !== 'object') return patch as T

  if (Array.isArray(base) || Array.isArray(patch)) {
    return (patch as T) ?? base
  }

  const out = { ...(base as Record<string, unknown>) } as Record<string, unknown>
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (value === undefined) continue
    const prev = out[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      prev &&
      typeof prev === 'object' &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMerge(prev, value as Record<string, unknown>)
      continue
    }
    out[key] = value
  }
  return out as T
}

function mergeById(items: Array<PartialDisease>): Array<PartialDisease> {
  const merged = new Map<string, PartialDisease>()

  for (const item of items) {
    const id = String(item?.id || '').trim()
    if (!id) continue

    const prev = merged.get(id)
    merged.set(id, prev ? deepMerge(prev, item) : item)
  }

  return Array.from(merged.values())
}

function normalizeStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v || '').trim()).filter(Boolean)
}

function nowMonthUtc() {
  // YYYY-MM
  return new Date().toISOString().slice(0, 7)
}

function scaffoldDiseaseOverride(disease: PartialDisease) {
  const quickView = (disease.quickView || {}) as Record<string, unknown>
  const tratamentoPrimeiraLinha = (quickView.tratamentoPrimeiraLinha || {}) as Record<string, unknown>

  const criterios = normalizeStrings(quickView.criteriosDiagnosticos)
  const naoFarm = normalizeStrings(tratamentoPrimeiraLinha.naoFarmacologico)
  const farm = normalizeStrings(tratamentoPrimeiraLinha.farmacologico)
  const metas = normalizeStrings(quickView.metasTerapeuticas)

  const primeiraLinha = farm.length
    ? [
        {
          classe: 'Primeira linha (resumo)',
          medicamentos: farm,
        },
      ]
    : []

  return {
    id: String(disease.id || '').trim(),
    // Draft scaffold: fill in with real content + citations, then move file to `overrides/diseases/`.
    fullContent: {
      epidemiologia: {
        fatoresRisco: [],
        citations: [],
      },
      quadroClinico: {
        sintomasPrincipais: [],
        sinaisExameFisico: [],
        citations: [],
      },
      diagnostico: {
        criterios,
        diagnosticoDiferencial: [],
        examesLaboratoriais: [],
        examesImagem: [],
        outrosExames: [],
        citations: [],
      },
      tratamento: {
        objetivos: [],
        naoFarmacologico: {
          medidas: naoFarm,
          citations: [],
        },
        farmacologico: {
          primeiraLinha,
          citations: [],
        },
      },
      acompanhamento: {
        frequenciaConsultas: '',
        metasTerapeuticas: metas,
        criteriosEncaminhamento: [],
        citations: [],
      },
    },
    citations: [],
    lastUpdate: nowMonthUtc(),
  }
}

function printUsage() {
  console.log('Scaffold disease fullContent override drafts (does not affect production until moved).')
  console.log('')
  console.log('Usage:')
  console.log('  pnpm scaffold:medical-fullcontent -- --all-missing [--limit 50]')
  console.log('  pnpm scaffold:medical-fullcontent -- --id <disease-id> [--out-dir <dir>]')
  console.log('  pnpm scaffold:medical-fullcontent -- --ids a,b,c')
  console.log('')
  console.log('Flags:')
  console.log('  --out-dir <dir>   Output directory (default: medical-content/overrides/diseases/_drafts)')
  console.log('  --dry-run         Print what would be written, without writing')
  console.log('  --force           Overwrite existing draft files')
}

async function run() {
  const repoRoot = findRepoRoot()
  const outDirArg = getArgValue('--out-dir')
  const outDir = path.isAbsolute(outDirArg || '')
    ? (outDirArg as string)
    : path.join(repoRoot, outDirArg || path.join('medical-content', 'overrides', 'diseases', '_drafts'))

  const allMissing = getArgFlag('--all-missing')
  const ids = parseIds()
  const limit = parsePositiveInt(getArgValue('--limit'))
  const dryRun = getArgFlag('--dry-run')
  const force = getArgFlag('--force')

  const diseases = mergeById(todasDoencas as unknown as PartialDisease[])
  const missing = diseases.filter((d) => !isFullContentPresent(d))

  const selected = allMissing
    ? missing
    : diseases.filter((d) => ids.includes(String(d.id || '').trim()))

  if (!allMissing && selected.length === 0) {
    printUsage()
    process.exit(1)
  }

  const slice = typeof limit === 'number' ? selected.slice(0, limit) : selected

  const planned = slice.map((d) => String(d.id || '').trim()).filter(Boolean)
  console.log(`Selected diseases: ${planned.length}`)
  console.log(`Output dir: ${outDir}`)

  if (dryRun) {
    for (const id of planned) console.log(`- ${id}.json`)
    return
  }

  fs.mkdirSync(outDir, { recursive: true })

  let written = 0
  let skipped = 0

  for (const disease of slice) {
    const id = String(disease.id || '').trim()
    if (!id) continue

    const filePath = path.join(outDir, `${id}.json`)
    if (fs.existsSync(filePath) && !force) {
      skipped += 1
      continue
    }

    const scaffold = scaffoldDiseaseOverride(disease)
    fs.writeFileSync(filePath, JSON.stringify(scaffold, null, 2) + '\n')
    written += 1
  }

  console.log('')
  console.log(`Drafts written: ${written}`)
  console.log(`Drafts skipped (already exist): ${skipped}`)
}

run().catch((error) => {
  console.error('Scaffold failed.')
  console.error(error)
  process.exit(1)
})

