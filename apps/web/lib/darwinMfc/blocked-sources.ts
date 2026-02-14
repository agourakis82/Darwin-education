export type BlockedCitationReason = 'proprietary'

const BLOCKED_REFID_PREFIXES: Array<{ prefix: string; reason: BlockedCitationReason }> = [
  { prefix: 'uptodate-', reason: 'proprietary' },
  { prefix: 'sanford-', reason: 'proprietary' },
]

export function getBlockedCitationReason(refId: string): BlockedCitationReason | null {
  const normalized = (refId || '').trim().toLowerCase()
  if (!normalized) return null

  for (const entry of BLOCKED_REFID_PREFIXES) {
    if (normalized.startsWith(entry.prefix)) return entry.reason
  }

  return null
}

export function isBlockedCitationRefId(refId: string): boolean {
  return getBlockedCitationReason(refId) !== null
}

