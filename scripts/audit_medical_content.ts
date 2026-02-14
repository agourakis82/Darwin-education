import { todasDoencas } from '../darwin-MFC/lib/data/doencas/index'
import { medicamentosConsolidados } from '../darwin-MFC/lib/data/medicamentos/index'
import { references as mfcReferences } from '../darwin-MFC/lib/data/references'
import type { Reference } from '../darwin-MFC/lib/types/references'

import fs from 'node:fs'
import path from 'node:path'

import { isBlockedCitationRefId } from '../apps/web/lib/darwinMfc/blocked-sources'
import { localReferences } from '../apps/web/lib/darwinMfc/local-references'
import { inferStudyTypeFromReference } from './lib/citation_evidence'

type CitationLike = {
  refId: string
  page?: string
  note?: string
  evidenceLevel?: string
  studyType?: string
  qualityScore?: number
}

function isCitationLike(value: unknown): value is CitationLike {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { refId?: unknown }
  return typeof maybe.refId === 'string' && maybe.refId.trim().length > 0
}

function citationKeyOf(citation: CitationLike) {
  return [citation.refId.trim(), citation.page?.trim() || '', citation.note?.trim() || ''].join('|')
}

function collectCitations(payload: unknown): CitationLike[] {
  const output: CitationLike[] = []
  const seen = new Set<string>()

  const walk = (value: unknown) => {
    if (!value) return
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }

    if (isCitationLike(value)) {
      const normalized: CitationLike = {
        ...value,
        refId: value.refId.trim(),
      }
      const key = citationKeyOf(normalized)
      if (!seen.has(key)) {
        seen.add(key)
        output.push(normalized)
      }
      return
    }

    if (typeof value !== 'object') return

    const record = value as Record<string, unknown>
    for (const [k, v] of Object.entries(record)) {
      if (k === 'citations' && Array.isArray(v)) {
        for (const item of v) walk(item)
        continue
      }
      walk(v)
    }
  }

  walk(payload)
  return output
}

function isPlaceholderDoi(doi?: string) {
  if (!doi) return false
  const normalized = doi.toLowerCase().trim()
  return normalized.includes('xxxx') || normalized.includes('todo')
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (patch == null) return base
  if (typeof patch !== 'object') return patch as T

  if (Array.isArray(base) || Array.isArray(patch)) {
    return (patch as T) ?? base
  }

  const out = { ...(base as Record<string, unknown>) } as Record<string, unknown>
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
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

function mergeById<T extends { id?: unknown }>(items: Array<Partial<T>>): Array<Partial<T>> {
  const merged = new Map<string, Partial<T>>()

  for (const item of items) {
    const id = String(item?.id || '').trim()
    if (!id) continue

    const prev = merged.get(id)
    merged.set(id, prev ? deepMerge(prev, item) : item)
  }

  return Array.from(merged.values())
}

function findRepoRoot() {
  const candidates = [process.cwd(), path.join(process.cwd(), '..'), path.join(process.cwd(), '..', '..')]
  for (const candidate of candidates) {
    try {
      if (
        fs.existsSync(path.join(candidate, 'darwin-MFC')) &&
        fs.existsSync(path.join(candidate, 'package.json'))
      ) {
        return candidate
      }
    } catch {
      // ignore
    }
  }
  return process.cwd()
}

function loadJsonOverrides<T extends { id?: unknown }>(dirPath: string) {
  const overrides = new Map<string, Partial<T>>()
  if (!fs.existsSync(dirPath)) return overrides

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    if (!raw.trim()) continue

    const parsed = JSON.parse(raw) as Partial<T>
    const id = typeof parsed?.id === 'string' ? parsed.id.trim() : ''
    if (!id) {
      console.warn(`[overrides] skipping ${file}: missing id`)
      continue
    }
    overrides.set(id, parsed)
  }

  return overrides
}

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

function resolveRef(refId: string): Reference | null {
  const local = (localReferences as Record<string, Reference | undefined>)[refId]
  if (local) return local
  const mfc = (mfcReferences as Record<string, Reference | undefined>)[refId]
  return mfc ?? null
}

function getArgFlag(name: string) {
  return process.argv.slice(2).includes(name)
}

function topEntries<T>(items: Array<[string, T]>, limit = 50) {
  return items.slice(0, Math.max(0, limit))
}

async function run() {
  const strict = getArgFlag('--strict')
  const listMissingFullContent = getArgFlag('--list-missing-fullcontent')
  const limit = process.argv.slice(2).includes('--all') ? Number.POSITIVE_INFINITY : 50

  const repoRoot = findRepoRoot()
  const overridesRoot = path.join(repoRoot, 'medical-content', 'overrides')
  const diseaseOverrides = loadJsonOverrides(path.join(overridesRoot, 'diseases'))
  const medicationOverrides = loadJsonOverrides(path.join(overridesRoot, 'medications'))

  const diseaseBase = mergeById(todasDoencas)
  const diseases = diseaseBase.map((item) => {
    const id = String(item.id || '').trim()
    const patch = id ? diseaseOverrides.get(id) : null
    return patch ? deepMerge(item, patch) : item
  })

  for (const [id, patch] of diseaseOverrides.entries()) {
    const exists = diseases.some((d) => String((d as { id?: unknown }).id || '').trim() === id)
    if (!exists) diseases.push(patch)
  }

  const medications = medicamentosConsolidados.map((item) => {
    const id = String((item as { id?: unknown }).id || '').trim()
    const patch = id ? medicationOverrides.get(id) : null
    return patch ? deepMerge(item, patch) : item
  })

  for (const [id, patch] of medicationOverrides.entries()) {
    const exists = medications.some((m) => String((m as { id?: unknown }).id || '').trim() === id)
    if (!exists) medications.push(patch)
  }

  const diseaseCount = diseases.length
  const medicationCount = medications.length

  const diseaseFullCount = diseases.filter((d) => isFullContentPresent(d)).length
  const diseaseMissingFullIds = diseases
    .filter((d) => !isFullContentPresent(d))
    .map((d) => String((d as { id?: unknown }).id || '').trim())
    .filter(Boolean)

  const diseaseCitations = diseases.flatMap((d) => collectCitations(d))
  const medicationCitations = medications.flatMap((m) => collectCitations(m))
  const allCitations = [...diseaseCitations, ...medicationCitations]

  const usage = new Map<string, number>()
  const missing = new Map<string, number>()
  const blocked = new Map<string, number>()
  const missingEvidenceRaw = new Map<string, number>()
  const missingEvidenceAfterDefaults = new Map<string, number>()
  const placeholderDoi = new Map<string, number>()

  for (const citation of allCitations) {
    const refId = citation.refId.trim()
    if (!refId) continue

    usage.set(refId, (usage.get(refId) || 0) + 1)

    if (isBlockedCitationRefId(refId)) {
      blocked.set(refId, (blocked.get(refId) || 0) + 1)
      continue
    }

    const ref = resolveRef(refId)
    if (!ref) {
      missing.set(refId, (missing.get(refId) || 0) + 1)
      continue
    }

    if (ref.doi && isPlaceholderDoi(ref.doi)) {
      placeholderDoi.set(refId, (placeholderDoi.get(refId) || 0) + 1)
    }

    const hasEvidenceRaw = Boolean(citation.studyType || citation.evidenceLevel || citation.qualityScore != null)
    if (!hasEvidenceRaw) {
      missingEvidenceRaw.set(refId, (missingEvidenceRaw.get(refId) || 0) + 1)

      const inferredStudyType = inferStudyTypeFromReference(ref)
      const hasEvidenceAfterDefaults = Boolean(inferredStudyType)
      if (!hasEvidenceAfterDefaults) {
        missingEvidenceAfterDefaults.set(refId, (missingEvidenceAfterDefaults.get(refId) || 0) + 1)
      }
    }
  }

  const missingList = Array.from(missing.entries()).sort((a, b) => b[1] - a[1])
  const blockedList = Array.from(blocked.entries()).sort((a, b) => b[1] - a[1])
  const placeholderList = Array.from(placeholderDoi.entries()).sort((a, b) => b[1] - a[1])
  const missingEvidenceRawList = Array.from(missingEvidenceRaw.entries()).sort((a, b) => b[1] - a[1])
  const missingEvidenceAfterDefaultsList = Array.from(missingEvidenceAfterDefaults.entries()).sort((a, b) => b[1] - a[1])

  console.log('=== Darwin Education — Medical Content Audit ===')
  console.log(`Diseases: ${diseaseCount}`)
  console.log(`Diseases with fullContent present: ${diseaseFullCount}`)
  console.log(`Medications: ${medicationCount}`)
  console.log(`Disease overrides loaded: ${diseaseOverrides.size}`)
  console.log(`Medication overrides loaded: ${medicationOverrides.size}`)
  console.log(`Total citations found: ${allCitations.length}`)
  console.log(`Unique refIds found: ${usage.size}`)
  console.log(`Blocked refIds (omitted): ${blocked.size}`)
  console.log(`Missing refIds (no metadata): ${missing.size}`)
  console.log(`RefIds with placeholder DOI: ${placeholderDoi.size}`)
  console.log(`RefIds cited without evidence metadata (raw): ${missingEvidenceRaw.size}`)
  console.log(`RefIds cited without evidence metadata (after defaults): ${missingEvidenceAfterDefaults.size}`)

  if (listMissingFullContent) {
    console.log('')
    console.log(`--- Diseases missing fullContent (${diseaseMissingFullIds.length}) ---`)
    for (const id of diseaseMissingFullIds.slice(0, limit)) {
      console.log(id)
    }
  }

  if (blockedList.length > 0) {
    console.log('')
    console.log('--- Top blocked refIds (count) ---')
    for (const [refId, count] of topEntries(blockedList, limit)) {
      console.log(`${count}\t${refId}`)
    }
  }

  if (missingList.length > 0) {
    console.log('')
    console.log('--- Top missing refIds (count) ---')
    for (const [refId, count] of topEntries(missingList, limit)) {
      console.log(`${count}\t${refId}`)
    }
  }

  if (placeholderList.length > 0) {
    console.log('')
    console.log('--- Top placeholder DOI refIds (count) ---')
    for (const [refId, count] of topEntries(placeholderList, limit)) {
      console.log(`${count}\t${refId}`)
    }
  }

  if (missingEvidenceAfterDefaultsList.length > 0) {
    console.log('')
    console.log('--- Top refIds still missing evidence metadata after defaults (count) ---')
    for (const [refId, count] of topEntries(missingEvidenceAfterDefaultsList, limit)) {
      console.log(`${count}\t${refId}`)
    }
  }

  if (strict) {
    const errors: string[] = []
    if (missing.size > 0) errors.push(`Missing reference metadata for ${missing.size} refIds`)
    if (errors.length > 0) {
      console.error('')
      console.error('STRICT MODE FAILED:')
      for (const err of errors) console.error(`- ${err}`)
      process.exit(1)
    }
  }
}

run().catch((error) => {
  console.error('Medical content audit failed.')
  console.error(error)
  process.exit(1)
})
