export interface UserSummary {
  id: string
  email: string | null
  fullName: string | null
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
      user_metadata?: { full_name?: unknown } | null
    }

    if (typeof json.sub !== 'string') return null

    return {
      id: json.sub,
      email: typeof json.email === 'string' ? json.email : null,
      fullName: typeof json.user_metadata?.full_name === 'string' ? json.user_metadata.full_name : null,
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
