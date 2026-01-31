import {
  minimaxChat,
  type MinimaxChatRequest,
  type MinimaxChatResponse,
  type MinimaxApiStyle,
} from '@darwin-education/shared'

const DEFAULT_MODEL = 'abab6.5-chat'

export async function runMinimaxChat(request: MinimaxChatRequest): Promise<MinimaxChatResponse> {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new Error('Missing MINIMAX_API_KEY')
  }

  const baseUrl = process.env.MINIMAX_API_URL
  const groupId = process.env.MINIMAX_GROUP_ID
  const apiStyle = (process.env.MINIMAX_API_STYLE as MinimaxApiStyle | undefined) ?? 'minimax'

  return minimaxChat(
    {
      ...request,
      model: request.model ?? process.env.MINIMAX_MODEL ?? DEFAULT_MODEL,
    },
    {
      apiKey,
      groupId,
      baseUrl,
      apiStyle,
      timeoutMs: 30000,
    }
  )
}

export function estimateCostBRL(tokensUsed?: number | null) {
  if (!tokensUsed) return null
  const rate = Number(process.env.MINIMAX_COST_PER_1K_TOKENS_BRL)
  if (!Number.isFinite(rate) || rate <= 0) {
    return null
  }
  return (tokensUsed / 1000) * rate
}
