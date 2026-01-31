'use client'

import { useState } from 'react'
import type { ENAMEDQuestion, ENAMEDArea, DifficultyLevel } from '@darwin-education/shared'
import { ExplanationPanel } from '@/components/ai/ExplanationPanel'

interface QuestionCardProps {
  question: ENAMEDQuestion
  questionNumber?: number
  totalQuestions?: number
  selectedAnswer?: string | null
  onAnswerSelect?: (answer: string) => void
  showCorrectAnswer?: boolean
  disabled?: boolean
  showExplanation?: boolean
  showAIExplanation?: boolean
}

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const areaColors: Record<ENAMEDArea, string> = {
  clinica_medica: 'bg-blue-900/50 text-blue-300 border-blue-700',
  cirurgia: 'bg-red-900/50 text-red-300 border-red-700',
  ginecologia_obstetricia: 'bg-pink-900/50 text-pink-300 border-pink-700',
  pediatria: 'bg-green-900/50 text-green-300 border-green-700',
  saude_coletiva: 'bg-purple-900/50 text-purple-300 border-purple-700',
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  showCorrectAnswer = false,
  disabled = false,
  showExplanation = false,
  showAIExplanation = false,
}: QuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null)
  const selected = selectedAnswer ?? localSelected

  const handleSelect = (answer: string) => {
    if (disabled) return
    setLocalSelected(answer)
    onAnswerSelect?.(answer)
  }

  const getCorrectAnswerText = () => question.options[question.correctIndex]?.text

  const getOptionStyle = (optionText: string) => {
    const isSelected = selected === optionText
    const isCorrect = optionText === getCorrectAnswerText()

    if (showCorrectAnswer) {
      if (isCorrect) {
        return 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
      }
      if (isSelected && !isCorrect) {
        return 'border-red-500 bg-red-900/30 text-red-300'
      }
    }

    if (isSelected) {
      return 'border-emerald-500 bg-emerald-900/20 text-white'
    }

    return 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 text-slate-300'
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {questionNumber && (
          <span className="text-slate-400 text-sm font-medium">
            Questão {questionNumber}
            {totalQuestions && ` de ${totalQuestions}`}
          </span>
        )}

        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${areaColors[question.ontology.area]}`}
        >
          {areaLabels[question.ontology.area]}
        </span>

        {question.difficulty && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {difficultyLabels[question.difficulty]}
          </span>
        )}

        {question.year && (
          <span className="text-xs text-slate-500">ENAMED {question.year}</span>
        )}
      </div>

      {/* Question Text */}
      <div className="prose prose-invert max-w-none mb-6">
        <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
          {question.stem}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const letter = option.letter
          const isCorrect = index === question.correctIndex
          const optionText = option.text
          return (
            <button
              key={option.letter}
              onClick={() => handleSelect(optionText)}
              disabled={disabled}
              className={`
                w-full text-left p-4 rounded-lg border transition-colors
                flex items-start gap-3
                disabled:cursor-not-allowed
                ${getOptionStyle(optionText)}
              `}
            >
              <span
                className={`
                  flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                  text-sm font-medium border
                  ${
                    selected === optionText
                      ? showCorrectAnswer && !isCorrect
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-emerald-600 border-emerald-600 text-white'
                      : showCorrectAnswer && isCorrect
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                  }
                `}
              >
                {letter}
              </span>
              <span className="flex-1">{optionText}</span>
              {showCorrectAnswer && isCorrect && (
                <svg
                  className="w-5 h-5 text-emerald-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {showCorrectAnswer && selected === optionText && !isCorrect && (
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showExplanation && question.explanation && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Explicação</h4>
          <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* AI Explanation */}
      {showAIExplanation && showCorrectAnswer && (
        <ExplanationPanel
          stem={question.stem}
          options={question.options}
          correctIndex={question.correctIndex}
          selectedIndex={
            selected
              ? question.options.findIndex((o) => o.text === selected)
              : undefined
          }
          staticExplanation={showExplanation ? undefined : question.explanation}
        />
      )}
    </div>
  )
}
