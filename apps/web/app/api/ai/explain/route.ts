import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildExplanationMessages } from '@darwin-education/shared'
import { consumeAICredit } from '@/lib/ai/credits'
import { getCachedAIResponse, hashRequestPayload, storeCachedAIResponse } from '@/lib/ai/cache'
import { estimateCostBRL, runMinimaxChat } from '@/lib/ai/minimax'
import { getSessionUserSummary } from '@/lib/auth/session'
import { hasMinimaxApiKey, minimaxServiceUnavailable } from '@/lib/ai/key-availability'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload?.stem || !payload?.options || payload.correctIndex === undefined) {
    return NextResponse.json(
      { error: 'Parâmetros "stem", "options" e "correctIndex" são obrigatórios.' },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()
  const user = await getSessionUserSummary(supabase)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const messages = buildExplanationMessages({
    stem: payload.stem,
    options: payload.options,
    correctIndex: payload.correctIndex,
    selectedIndex: payload.selectedIndex,
  })

  const requestHash = hashRequestPayload({
    requestType: 'explain',
    model: payload.model,
    messages,
  })

  const cached = await getCachedAIResponse(requestHash)
  if (cached) {
    return NextResponse.json({
      text: cached.response_text,
      cached: true,
      tokensUsed: cached.tokens_used,
      costBRL: cached.cost_brl,
    })
  }

  if (!hasMinimaxApiKey()) {
    return minimaxServiceUnavailable('de explicação de alternativas')
  }

  const credit = await consumeAICredit(supabase, user.id)
  if (!credit.allowed) {
    return NextResponse.json(
      {
        error: 'ai_credits_exhausted',
        remaining: credit.remaining,
        resetAt: credit.resetAt,
      },
      { status: 429 }
    )
  }

  const response = await runMinimaxChat({
    messages,
    model: payload.model,
    maxTokens: payload.maxTokens ?? 700,
    temperature: payload.temperature ?? 0.5,
    topP: payload.topP ?? 0.9,
  })

  const tokensUsed = response.usage?.totalTokens ?? null
  const costBRL = estimateCostBRL(tokensUsed)
  const ttlDays = Number(process.env.AI_CACHE_TTL_EXPLAIN_DAYS) || 7
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

  await storeCachedAIResponse({
    requestType: 'explain',
    requestHash,
    responseText: response.text,
    tokensUsed,
    costBRL,
    expiresAt,
  })

  return NextResponse.json({
    text: response.text,
    cached: false,
    remaining: credit.remaining,
    resetAt: credit.resetAt,
    tokensUsed,
    costBRL,
  })
}
