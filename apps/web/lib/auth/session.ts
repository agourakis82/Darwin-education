import { getUserSummaryFromAccessToken, type UserSummary } from './user'

type SupabaseSession = {
  access_token?: unknown
  user?: {
    id?: unknown
    email?: unknown
    user_metadata?: { full_name?: unknown } | null
  } | null
} | null

type SupabaseLike = {
  auth: {
    getSession: () => Promise<{ data: { session: SupabaseSession }; error: unknown | null }>
  }
}

export async function getSessionUserSummary(supabase: SupabaseLike): Promise<UserSummary | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null

  const session = data.session
  if (!session) return null

  // Server: avoid `session.user` (warn-proxied) and decode from access token.
  if (typeof window === 'undefined') {
    return typeof session.access_token === 'string'
      ? getUserSummaryFromAccessToken(session.access_token)
      : null
  }

  const user = session.user
  if (!user || typeof user.id !== 'string') return null

  return {
    id: user.id,
    email: typeof user.email === 'string' ? user.email : null,
    fullName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null,
  }
}

export async function getSessionUserId(supabase: SupabaseLike): Promise<string | null> {
  const summary = await getSessionUserSummary(supabase)
  return summary?.id ?? null
}

