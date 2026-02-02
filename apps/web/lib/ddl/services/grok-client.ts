// ============================================================
// GROK CLIENT - xAI API Integration
// ============================================================

import OpenAI from 'openai'

// Grok API is OpenAI-compatible
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
})

export interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GrokChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

const DEFAULT_MODEL = 'grok-4-1-fast-reasoning'

export async function grokChat(
  messages: GrokChatMessage[],
  options: GrokChatOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 4096,
    temperature = 0.3,
  } = options

  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY environment variable is not set')
  }

  const response = await grok.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response content from Grok API')
  }

  return content
}

export function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }

  // Try to find JSON object directly
  const objectMatch = text.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    return objectMatch[0]
  }

  return text
}

export { grok }
