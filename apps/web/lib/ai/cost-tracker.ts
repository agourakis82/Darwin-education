import { createAdminClient } from '@/lib/supabase/admin'

export interface AICostSummary {
  totalTokens: number
  totalCostBRL: number
  totalRequests: number
  totalCacheHits: number
  cacheHitRate: number
  byType: {
    requestType: string
    tokens: number
    costBRL: number
    requests: number
    cacheHits: number
  }[]
  daily: {
    date: string
    tokens: number
    costBRL: number
    requests: number
  }[]
}

export async function getAICostSummary(
  daysBack: number = 30
): Promise<AICostSummary> {
  let admin: ReturnType<typeof createAdminClient> | null = null
  try {
    admin = createAdminClient()
  } catch {
    admin = null
  }

  if (!admin) {
    return {
      totalTokens: 0,
      totalCostBRL: 0,
      totalRequests: 0,
      totalCacheHits: 0,
      cacheHitRate: 0,
      byType: [],
      daily: [],
    }
  }

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await (admin.from('ai_response_cache') as any)
    .select('request_type, tokens_used, cost_brl, created_at, hits')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error || !rows) {
    return {
      totalTokens: 0,
      totalCostBRL: 0,
      totalRequests: 0,
      totalCacheHits: 0,
      cacheHitRate: 0,
      byType: [],
      daily: [],
    }
  }

  let totalTokens = 0
  let totalCostBRL = 0
  let totalCacheHits = 0
  const totalRequests = rows.length

  const typeMap = new Map<
    string,
    { tokens: number; costBRL: number; requests: number; cacheHits: number }
  >()
  const dayMap = new Map<
    string,
    { tokens: number; costBRL: number; requests: number }
  >()

  for (const row of rows) {
    const tokens = row.tokens_used ?? 0
    const cost = Number(row.cost_brl) || 0
    const hits = row.hits ?? 0

    totalTokens += tokens
    totalCostBRL += cost
    totalCacheHits += hits

    // By type
    const type = row.request_type ?? 'unknown'
    const existing = typeMap.get(type) ?? {
      tokens: 0,
      costBRL: 0,
      requests: 0,
      cacheHits: 0,
    }
    existing.tokens += tokens
    existing.costBRL += cost
    existing.requests += 1
    existing.cacheHits += hits
    typeMap.set(type, existing)

    // By day
    const day = new Date(row.created_at).toISOString().slice(0, 10)
    const dayEntry = dayMap.get(day) ?? { tokens: 0, costBRL: 0, requests: 0 }
    dayEntry.tokens += tokens
    dayEntry.costBRL += cost
    dayEntry.requests += 1
    dayMap.set(day, dayEntry)
  }

  const totalServed = totalRequests + totalCacheHits
  const cacheHitRate = totalServed > 0 ? totalCacheHits / totalServed : 0

  return {
    totalTokens,
    totalCostBRL: Math.round(totalCostBRL * 100) / 100,
    totalRequests,
    totalCacheHits,
    cacheHitRate: Math.round(cacheHitRate * 1000) / 10,
    byType: Array.from(typeMap.entries()).map(([requestType, v]) => ({
      requestType,
      tokens: v.tokens,
      costBRL: Math.round(v.costBRL * 100) / 100,
      requests: v.requests,
      cacheHits: v.cacheHits,
    })),
    daily: Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        tokens: v.tokens,
        costBRL: Math.round(v.costBRL * 100) / 100,
        requests: v.requests,
      })),
  }
}
