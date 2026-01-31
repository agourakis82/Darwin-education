import type { MinimaxMessage } from '../minimax-client'

export interface SummaryInput {
  contentType: 'disease' | 'medication'
  name: string
  sourceText?: string
}

export function buildSummaryMessages(input: SummaryInput): MinimaxMessage[] {
  const source = input.sourceText ? `Source: ${input.sourceText}` : ''

  return [
    {
      role: 'system',
      content:
        'You are a medical content editor. Respond in pt-BR without markdown. Keep it concise.',
    },
    {
      role: 'user',
      content: [
        `Content type: ${input.contentType}.`,
        `Name: ${input.name}.`,
        source,
        'Provide a summary with sections: overview, diagnosis, treatment, pitfalls.',
      ]
        .filter(Boolean)
        .join(' '),
    },
  ]
}
