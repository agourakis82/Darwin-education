/**
 * AI Services and Prompt Builders
 * ================================
 *
 * Provides message builders for AI-powered features
 */

import type { ENAMEDArea } from '../types/education'

// ============================================================================
// MESSAGE BUILDERS
// ============================================================================

export interface QuestionGenerationContext {
  area: ENAMEDArea
  topic?: string
  difficulty?: number
  focus?: string
}

export interface CaseStudyContext {
  topic?: string
  title?: string
  area: ENAMEDArea
  difficulty?: number
}

export interface ExplanationContext {
  concept?: string
  stem?: string
  options?: string[]
  correctIndex?: number
  selectedIndex?: number
  area?: ENAMEDArea
  difficulty?: number
  context?: string
}

export interface SummaryContext {
  text?: string
  sourceText?: string
  contentType?: string
  name?: string
  length?: 'brief' | 'medium' | 'detailed'
}

/**
 * Build system and user messages for question generation
 */
export function buildQuestionGenerationMessages(context: QuestionGenerationContext) {
  const systemMessage = {
    role: 'system' as const,
    content: `You are an expert medical educator specialized in ENAMED (Brazilian Medical Licensing Exam) questions.
Create high-quality multiple-choice medical questions that test clinical reasoning and knowledge.
Always respond with a JSON object containing: stem, options (array of 4), correct_index (0-3), and explanation.`,
  }

  const userMessage = {
    role: 'user' as const,
    content: `Generate a medical question for the ${context.area} area${context.topic ? ` about ${context.topic}` : ''}${
      context.difficulty ? ` at difficulty level ${context.difficulty}/5` : ''
    }${context.focus ? ` focusing on ${context.focus}` : ''}.

Format your response as JSON:
{
  "stem": "question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_index": 0,
  "explanation": "explanation text",
  "area": "${context.area}",
  "topic": "${context.topic || ''}",
  "irt": {
    "difficulty": ${context.difficulty || 0},
    "discrimination": 1.0,
    "guessing": 0.25
  }
}`,
  }

  return [systemMessage, userMessage]
}

/**
 * Build messages for case study generation
 */
export function buildCaseStudyMessages(context: CaseStudyContext) {
  const caseTitle = context.title || context.topic || 'Clinical Case'

  return [
    {
      role: 'system' as const,
      content:
        'You are an expert medical educator. Create realistic clinical case studies for medical education.',
    },
    {
      role: 'user' as const,
      content: `Create a clinical case study titled "${caseTitle}" for the ${context.area} area${
        context.difficulty ? ` at difficulty level ${context.difficulty}/5` : ''
      }.

Include: presentation, clinical findings, diagnostic workup, treatment, and discussion.`,
    },
  ]
}

/**
 * Build messages for concept explanation or question explanation
 */
export function buildExplanationMessages(context: ExplanationContext) {
  let userContent: string

  // If this is a question explanation (has stem)
  if (context.stem && context.options) {
    const isCorrect = context.selectedIndex === context.correctIndex
    const explanationNote = !isCorrect
      ? ' of why the student answer was incorrect and why the correct answer is right'
      : ''
    userContent = `Explain this medical question:

Stem: ${context.stem}

Options:
${context.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + (context.correctIndex || 0))}
Student selected: ${String.fromCharCode(65 + (context.selectedIndex || 0))} (${isCorrect ? 'Correct' : 'Incorrect'})

Provide a clear, educational explanation${explanationNote}.`
  } else {
    // Concept explanation
    userContent = `Explain the concept of "${context.concept || 'this medical concept'}"${
      context.area ? ` in the context of ${context.area}` : ''
    }${context.difficulty ? ` at an appropriate level for difficulty ${context.difficulty}/5` : ''}${
      context.context ? `. Context: ${context.context}` : ''
    }.

Include clinical relevance and key points.`
  }

  return [
    {
      role: 'system' as const,
      content: 'You are an expert medical educator. Provide clear, accurate medical explanations.',
    },
    {
      role: 'user' as const,
      content: userContent,
    },
  ]
}

/**
 * Build messages for text summarization
 */
export function buildSummaryMessages(context: SummaryContext) {
  const lengthGuidance =
    context.length === 'brief'
      ? '2-3 sentences'
      : context.length === 'detailed'
        ? '5-7 paragraphs'
        : '3-4 paragraphs'

  const textToSummarize = context.text || context.sourceText || ''
  const contentTypeInfo = context.contentType ? ` (${context.contentType})` : ''
  const nameInfo = context.name ? ` - "${context.name}"` : ''

  return [
    {
      role: 'system' as const,
      content: 'You are an expert at creating clear, accurate medical summaries.',
    },
    {
      role: 'user' as const,
      content: `Summarize the following medical text${contentTypeInfo}${nameInfo} in ${lengthGuidance}:

${textToSummarize}`,
    },
  ]
}

// ============================================================================
// MINIMAX TYPES
// ============================================================================

export type MinimaxApiStyle = 'minimax' | 'openai'

export interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface MinimaxChatRequest {
  messages: MinimaxMessage[]
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
}

export interface MinimaxChatResponse {
  text: string
  usage?: {
    totalTokens: number
    inputTokens?: number
    outputTokens?: number
  }
}

/**
 * Execute a chat request using Grok or Minimax API
 *
 * Supports both Grok API (OpenAI-compatible) and Minimax API
 * Automatically detects which API to use based on environment variables:
 * - GROK_API_KEY: Use Grok API (xAI)
 * - MINIMAX_API_KEY: Use Minimax API
 */
export async function minimaxChat(
  request: MinimaxChatRequest,
  options?: {
    apiKey?: string
    groupId?: string
    baseUrl?: string
    apiStyle?: MinimaxApiStyle
    timeoutMs?: number
  }
): Promise<MinimaxChatResponse> {
  const apiKey = options?.apiKey || process.env.GROK_API_KEY || process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new Error('Missing GROK_API_KEY or MINIMAX_API_KEY')
  }

  // Use Grok API if available
  if (process.env.GROK_API_KEY) {
    return minimaxChatViaGrok(request, apiKey, options?.timeoutMs)
  }

  // Fall back to Minimax API
  throw new Error('Minimax API implementation pending - use GROK_API_KEY instead')
}

/**
 * Execute chat request via Grok API (OpenAI-compatible)
 */
async function minimaxChatViaGrok(
  request: MinimaxChatRequest,
  apiKey: string,
  timeoutMs = 30000
): Promise<MinimaxChatResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'grok-4-1-fast',
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Grok API error: ${response.status} - ${JSON.stringify(error)}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: {
        total_tokens?: number
        prompt_tokens?: number
        completion_tokens?: number
      }
    }

    const text = data.choices?.[0]?.message?.content || ''
    const totalTokens = data.usage?.total_tokens || 0

    return {
      text,
      usage: {
        totalTokens,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}
