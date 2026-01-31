import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAICostSummary } from '@/lib/ai/cost-tracker'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Only allow admin users (check subscription_tier = 'institutional' as proxy)
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('subscription_tier')
    .eq('id', userData.user.id)
    .single()

  if (!profile || profile.subscription_tier !== 'institutional') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const days = Math.min(Number(url.searchParams.get('days')) || 30, 365)

  const summary = await getAICostSummary(days)
  return NextResponse.json(summary)
}
