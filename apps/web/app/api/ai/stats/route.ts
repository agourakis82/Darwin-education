import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAICostSummary } from '@/lib/ai/cost-tracker'
import { getSessionUserSummary } from '@/lib/auth/session'
import { isMissingTableError, isSchemaDriftError } from '@/lib/supabase/errors'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const user = await getSessionUserSummary(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Only allow admin users (check subscription_tier = 'institutional' as proxy)
  const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profileError) {
    if (isMissingTableError(profileError) || isSchemaDriftError(profileError)) {
      return NextResponse.json(
        { error: 'Dados indisponíveis neste ambiente (schema em migração).' },
        { status: 503 }
      )
    }
    console.error('Error checking admin profile:', profileError)
    return NextResponse.json({ error: 'Falha ao verificar permissões' }, { status: 500 })
  }

  if (!profile || profile.subscription_tier !== 'institutional') {
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })
  }

  const url = new URL(request.url)
  const days = Math.min(Number(url.searchParams.get('days')) || 30, 365)

  const summary = await getAICostSummary(days)
  return NextResponse.json(summary)
}
