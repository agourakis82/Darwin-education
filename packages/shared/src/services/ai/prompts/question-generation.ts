import type { MinimaxMessage } from '../minimax-client'

export interface QuestionGenerationInput {
  area: string
  topic?: string
  difficulty?: string
  focus?: string
}

export function buildQuestionGenerationMessages(
  input: QuestionGenerationInput
): MinimaxMessage[] {
  const topic = input.topic ? `Topic: ${input.topic}.` : 'Topic: general.'
  const difficulty = input.difficulty ? `Difficulty: ${input.difficulty}.` : 'Difficulty: medio.'
  const focus = input.focus ? `Focus: ${input.focus}.` : ''

  return [
    {
      role: 'system',
      content:
        'You are an ENAMED medical exam item writer. Output ONLY valid JSON. Language: pt-BR without markdown.',
    },
    {
      role: 'user',
      content: [
        `Area: ${input.area}.`,
        topic,
        difficulty,
        focus,
        'Create a single multiple-choice question with 4 options (A-D).',
        'Return JSON with keys: stem, options, correct_index, explanation, area, topic, difficulty, irt.',
        'options is an array of { letter, text, feedback }.',
        'correct_index is 0-3.',
        'irt has { difficulty, discrimination, guessing } where difficulty in [-3,3], discrimination in [0.5,2.5], guessing = 0.25.',
      ]
        .filter(Boolean)
        .join(' '),
    },
  ]
}
