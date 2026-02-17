import type { Reference } from './types'
import { localReferences } from './local-references'

// Local references serve as the primary data source.
// No external darwin-MFC repo dependency needed.
const references: Record<string, Reference> = {}

export type DarwinCitation = {
  refId: string
  page?: string
  note?: string
  evidenceLevel?: string
  studyType?: string
  qualityScore?: number
  limitations?: string[]
  conflictsOfInterest?: string
}

function isPlaceholderDoi(doi?: string) {
  if (!doi) return false
  const normalized = doi.toLowerCase().trim()
  return normalized.includes('xxxx') || normalized.includes('todo')
}

export function resolveDarwinReference(refId: string): Reference | null {
  const normalized = refId.trim().toLowerCase()
  if (!normalized) return null
  const local = (localReferences as Record<string, Reference | undefined>)[normalized]
  if (local) return local
  const ref = (references as Record<string, Reference | undefined>)[normalized]
  return ref ?? null
}

export function formatDarwinReference(ref: Reference): string {
  const authors = (ref.authors || []).filter(Boolean).join(', ')
  const parts: string[] = []

  if (authors) parts.push(authors)
  parts.push(ref.title)

  const container = [ref.journal, ref.publisher].filter(Boolean).join(' — ')
  if (container) parts.push(container)

  const yearBits = [ref.year, ref.volume, ref.pages].filter(Boolean).join('; ')
  if (yearBits) parts.push(yearBits)

  if (ref.doi && !isPlaceholderDoi(ref.doi)) parts.push(`DOI: ${ref.doi}`)

  return parts.join('. ').replaceAll('..', '.').trim()
}

export function getDarwinReferenceUrl(ref: Reference): string | null {
  const url = (ref.url || '').trim()
  return url ? url : null
}
