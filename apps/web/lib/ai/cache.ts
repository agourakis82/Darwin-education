import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

type CacheEntry = {
  id: string
  response_text: string
  tokens_used: number | null
  cost_brl: number | null
  expires_at: string | null
  hits: number | null
}

function tryCreateAdminClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    return `{${entries.join(',')}}`
  }

  return JSON.stringify(value)
}

export function hashRequestPayload(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex')
}

export async function getCachedAIResponse(requestHash: string): Promise<CacheEntry | null> {
  const admin = tryCreateAdminClient()
  if (!admin) {
    return null
  }

  const { data, error } = await (admin.from('ai_response_cache') as any)
    .select('id, response_text, tokens_used, cost_brl, expires_at, hits')
    .eq('request_hash', requestHash)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at)
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      await (admin.from('ai_response_cache') as any).delete().eq('id', data.id)
      return null
    }
  }

  await (admin.from('ai_response_cache') as any)
    .update({ hits: (data.hits ?? 0) + 1 })
    .eq('id', data.id)

  return data
}

export async function storeCachedAIResponse(options: {
  requestType: string
  requestHash: string
  responseText: string
  tokensUsed?: number | null
  costBRL?: number | null
  expiresAt?: Date | null
}) {
  const admin = tryCreateAdminClient()
  if (!admin) {
    return
  }

  await (admin.from('ai_response_cache') as any)
    .upsert(
      {
        request_type: options.requestType,
        request_hash: options.requestHash,
        response_text: options.responseText,
        tokens_used: options.tokensUsed ?? null,
        cost_brl: options.costBRL ?? null,
        expires_at: options.expiresAt ? options.expiresAt.toISOString() : null,
      },
      { onConflict: 'request_hash' }
    )
}
