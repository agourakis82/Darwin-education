import type { MinimaxMessage } from '../minimax-client'

export interface ExplanationInput {
  stem: string
  options: { letter: string; text: string }[]
  correctIndex: number
  selectedIndex?: number
}

export function buildExplanationMessages(input: ExplanationInput): MinimaxMessage[] {
  const selected =
    typeof input.selectedIndex === 'number' && input.options[input.selectedIndex]
      ? `Selected: ${input.options[input.selectedIndex].letter}. ${input.options[input.selectedIndex].text}`
      : 'Selected: not provided.'
  const correct = input.options[input.correctIndex]
    ? `Correct: ${input.options[input.correctIndex].letter}. ${input.options[input.correctIndex].text}`
    : 'Correct: not provided.'

  return [
    {
      role: 'system',
      content:
        'You are a medical tutor. Respond in pt-BR without markdown. Keep concise and practical.',
    },
    {
      role: 'user',
      content: [
        `Question: ${input.stem}`,
        `Options: ${input.options.map((opt) => `${opt.letter}. ${opt.text}`).join(' | ')}`,
        selected,
        correct,
        'Explain why the correct answer is right and why the selected answer is wrong (if provided).',
        'Include 2-3 key clinical takeaways.',
      ].join(' '),
    },
  ]
}
