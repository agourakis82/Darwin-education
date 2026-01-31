import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_LIMITS: Record<string, number> = {
  free: 5,
  premium: 50,
  institutional: 200,
}

const DAY_MS = 24 * 60 * 60 * 1000

export type AICreditStatus = {
  allowed: boolean
  remaining: number
  resetAt: string
  tier: string
}

export async function consumeAICredit(
  supabase: SupabaseClient,
  userId: string
): Promise<AICreditStatus> {
  const { data: profile, error } = await (supabase.from('profiles') as any)
    .select('id, subscription_tier, ai_credits_remaining, ai_credits_reset_at')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new Error('Unable to load AI credit profile')
  }

  const tier = profile.subscription_tier || 'free'
  const limit = DEFAULT_LIMITS[tier] ?? DEFAULT_LIMITS.free
  const now = new Date()

  let remaining = profile.ai_credits_remaining ?? limit
  let resetAt = profile.ai_credits_reset_at
    ? new Date(profile.ai_credits_reset_at)
    : new Date(0)

  if (!resetAt || Number.isNaN(resetAt.getTime()) || now > resetAt) {
    remaining = limit
    resetAt = new Date(now.getTime() + DAY_MS)
  }

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: resetAt.toISOString(),
      tier,
    }
  }

  const updatedRemaining = remaining - 1
  await (supabase.from('profiles') as any)
    .update({
      ai_credits_remaining: updatedRemaining,
      ai_credits_reset_at: resetAt.toISOString(),
    })
    .eq('id', userId)

  return {
    allowed: true,
    remaining: updatedRemaining,
    resetAt: resetAt.toISOString(),
    tier,
  }
}
