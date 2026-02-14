import type { DarwinCitation } from '@/lib/darwinMfc/references'
import { isBlockedCitationRefId } from '@/lib/darwinMfc/blocked-sources'

function isCitationLike(value: unknown): value is DarwinCitation {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { refId?: unknown }
  return typeof maybe.refId === 'string' && maybe.refId.trim().length > 0
}

function keyOf(citation: DarwinCitation) {
  return [citation.refId.trim(), citation.page?.trim() || '', citation.note?.trim() || ''].join('|')
}

export function collectDarwinCitations(payload: unknown): DarwinCitation[] {
  const output: DarwinCitation[] = []
  const seen = new Set<string>()

  const walk = (value: unknown) => {
    if (!value) return
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }

    if (isCitationLike(value)) {
      if (isBlockedCitationRefId(value.refId)) return
      const key = keyOf(value)
      if (!seen.has(key)) {
        seen.add(key)
        output.push(value)
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

export function extractDarwinLastUpdate(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const maybe = payload as { lastUpdate?: unknown }
  return typeof maybe.lastUpdate === 'string' && maybe.lastUpdate.trim() ? maybe.lastUpdate.trim() : null
}
