export interface UserSummary {
  id: string
  email: string | null
  fullName: string | null
  legal?: {
    eulaVersion: string | null
    eulaAcceptedAt: string | null
    researchConsent: boolean | null
    researchConsentAt: string | null
    researchConsentRevokedAt: string | null
  } | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function decodeBase64UrlToString(input: string): string | null {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  try {
    // Node.js / most server runtimes
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(padded, 'base64').toString('utf8')
    }
  } catch {
    // fall through
  }

  try {
    // Browser / edge runtimes
    if (typeof atob === 'function') {
      const binary = atob(padded)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    }
  } catch {
    // fall through
  }

  return null
}

export function getUserSummaryFromAccessToken(accessToken: string): UserSummary | null {
  try {
    const [, payload] = accessToken.split('.')
    if (!payload) return null

    const decoded = decodeBase64UrlToString(payload)
    if (!decoded) return null

    const json = JSON.parse(decoded) as {
      sub?: unknown
      email?: unknown
      user_metadata?: unknown
    }

    if (typeof json.sub !== 'string') return null

    const userMetadata = isRecord(json.user_metadata) ? json.user_metadata : null
    const legalRaw = userMetadata && isRecord(userMetadata.legal) ? userMetadata.legal : null

    const legal = {
      eulaVersion:
        typeof legalRaw?.eula_version === 'string'
          ? legalRaw.eula_version
          : typeof userMetadata?.eula_version === 'string'
            ? userMetadata.eula_version
            : null,
      eulaAcceptedAt:
        typeof legalRaw?.eula_accepted_at === 'string'
          ? legalRaw.eula_accepted_at
          : typeof userMetadata?.eula_accepted_at === 'string'
            ? userMetadata.eula_accepted_at
            : null,
      researchConsent:
        typeof legalRaw?.research_consent === 'boolean'
          ? legalRaw.research_consent
          : typeof userMetadata?.research_consent === 'boolean'
            ? userMetadata.research_consent
            : null,
      researchConsentAt:
        typeof legalRaw?.research_consent_at === 'string'
          ? legalRaw.research_consent_at
          : typeof userMetadata?.research_consent_at === 'string'
            ? userMetadata.research_consent_at
            : null,
      researchConsentRevokedAt:
        typeof legalRaw?.research_consent_revoked_at === 'string'
          ? legalRaw.research_consent_revoked_at
          : typeof userMetadata?.research_consent_revoked_at === 'string'
            ? userMetadata.research_consent_revoked_at
            : null,
    }

    return {
      id: json.sub,
      email: typeof json.email === 'string' ? json.email : null,
      fullName: typeof userMetadata?.full_name === 'string' ? userMetadata.full_name : null,
      legal,
    }
  } catch {
    return null
  }
}

export function getUserDisplayName(user: UserSummary): string {
  const trimmed = (user.fullName || '').trim()
  if (trimmed) return trimmed

  const email = (user.email || '').trim()
  if (!email) return 'Usuário'

  const [localPart] = email.split('@')
  return localPart || 'Usuário'
}

export function getUserInitial(user: UserSummary): string {
  return getUserDisplayName(user).charAt(0).toUpperCase() || 'U'
}
