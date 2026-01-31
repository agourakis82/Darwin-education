import type { MinimaxMessage } from '../minimax-client'

export interface CaseStudyInput {
  area: string
  topic?: string
  difficulty?: string
}

export function buildCaseStudyMessages(input: CaseStudyInput): MinimaxMessage[] {
  const topic = input.topic ? `Topic: ${input.topic}.` : 'Topic: general.'
  const difficulty = input.difficulty ? `Difficulty: ${input.difficulty}.` : 'Difficulty: medio.'

  return [
    {
      role: 'system',
      content:
        'You are a medical case simulator. Output ONLY valid JSON. Language: pt-BR without markdown.',
    },
    {
      role: 'user',
      content: [
        `Area: ${input.area}.`,
        topic,
        difficulty,
        'Generate a brief clinical case with history, exam, and labs if relevant.',
        'Return JSON with keys: case_summary, question, ideal_answer, red_flags, next_steps.',
        'red_flags and next_steps are arrays of short strings.',
      ].join(' '),
    },
  ]
}
