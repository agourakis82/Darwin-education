import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildCaseStudyMessages } from '@darwin-education/shared'
import { consumeAICredit } from '@/lib/ai/credits'
import { getCachedAIResponse, hashRequestPayload, storeCachedAIResponse } from '@/lib/ai/cache'
import { estimateCostBRL, runMinimaxChat } from '@/lib/ai/minimax'
import { extractJsonFromText } from '@/lib/ai/parse'
import { getSessionUserSummary } from '@/lib/auth/session'
import { hasMinimaxApiKey, minimaxServiceUnavailable } from '@/lib/ai/key-availability'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload?.area) {
    return NextResponse.json({ error: 'Parâmetro "área" (area) é obrigatório.' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const user = await getSessionUserSummary(supabase)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const messages = buildCaseStudyMessages({
    area: payload.area,
    topic: payload.topic,
    difficulty: payload.difficulty,
  })

  const requestHash = hashRequestPayload({
    requestType: 'case_study',
    model: payload.model,
    messages,
  })

  const cached = await getCachedAIResponse(requestHash)
  if (cached) {
    return NextResponse.json({
      text: cached.response_text,
      parsed: extractJsonFromText(cached.response_text),
      cached: true,
      tokensUsed: cached.tokens_used,
      costBRL: cached.cost_brl,
    })
  }

  if (!hasMinimaxApiKey()) {
    return minimaxServiceUnavailable('de casos clínicos')
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
    maxTokens: payload.maxTokens ?? 900,
    temperature: payload.temperature ?? 0.6,
    topP: payload.topP ?? 0.9,
  })

  const tokensUsed = response.usage?.totalTokens ?? null
  const costBRL = estimateCostBRL(tokensUsed)
  const ttlDays = Number(process.env.AI_CACHE_TTL_CASE_STUDY_DAYS) || 30
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

  await storeCachedAIResponse({
    requestType: 'case_study',
    requestHash,
    responseText: response.text,
    tokensUsed,
    costBRL,
    expiresAt,
  })

  return NextResponse.json({
    text: response.text,
    parsed: extractJsonFromText(response.text),
    cached: false,
    remaining: credit.remaining,
    resetAt: credit.resetAt,
    tokensUsed,
    costBRL,
  })
}
