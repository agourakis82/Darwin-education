'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ENAMEDQuestion, DifficultyLevel } from '@darwin-education/shared'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExplanationPanel } from '@/components/ai/ExplanationPanel'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'

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


const difficultyLabels: Record<DifficultyLevel, string> = {
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
}

// Renders the question stem, replacing [Imagem de X] placeholders with a styled notice box.
function StemWithImages({ stem }: { stem: string }) {
  const IMAGE_PATTERN = /\[Imagem[^\]]*\]/gi

  const parts: Array<{ type: 'text' | 'image'; content: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const re = new RegExp(IMAGE_PATTERN.source, 'gi')
  while ((match = re.exec(stem)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: stem.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'image', content: match[0] })
    lastIndex = re.lastIndex
  }
  if (lastIndex < stem.length) {
    parts.push({ type: 'text', content: stem.slice(lastIndex) })
  }

  return (
    <div className="space-y-3">
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <p key={i} className="text-label-primary text-base leading-relaxed whitespace-pre-wrap">
            {part.content}
          </p>
        ) : (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-label-quaternary bg-surface-2/40 text-label-tertiary text-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {part.content.replace(/^\[|\]$/g, '')}
            </span>
          </div>
        )
      )}
    </div>
  )
}

// Renders a clinical image from Supabase Storage with a caption derived from the alt text.
function ClinicalImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-separator bg-surface-2/40">
      <div className="relative w-full" style={{ maxHeight: '400px' }}>
        <Image
          src={src}
          alt={alt}
          width={800}
          height={400}
          className="w-full h-auto object-contain"
          style={{ maxHeight: '400px' }}
          unoptimized
        />
      </div>
      <p className="px-4 py-2 text-xs text-label-tertiary border-t border-separator/50 text-center italic">
        {alt}
      </p>
    </div>
  )
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
        return 'border-emerald-500/60 bg-emerald-500/12 text-label-primary shadow-inner-shine'
      }
      if (isSelected && !isCorrect) {
        return 'border-red-500/60 bg-red-500/10 text-label-primary shadow-inner-shine'
      }
    }

    if (isSelected) {
      return 'border-emerald-500/55 bg-emerald-500/12 text-label-primary shadow-inner-shine'
    }

    return 'border-separator hover:border-label-quaternary hover:bg-surface-2/50 text-label-primary'
  }

  return (
    <div className="bg-surface-1 border border-separator rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {questionNumber && (
          <span className="text-label-secondary text-sm font-medium">
            Questão {questionNumber}
            {totalQuestions && ` de ${totalQuestions}`}
          </span>
        )}

        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${AREA_COLORS[question.ontology.area]?.badge}`}
        >
          {AREA_LABELS[question.ontology.area]}
        </span>

        {question.difficulty && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-2 text-label-secondary border border-separator">
            {difficultyLabels[question.difficulty]}
          </span>
        )}

        {question.year && (
          <span className="text-xs text-label-tertiary">ENAMED {question.year}</span>
        )}
      </div>

      {/* Question Text */}
      <div className="prose max-w-none mb-6 dark:prose-invert">
        <StemWithImages stem={question.stem} />
      </div>

      {/* Clinical Image (from Supabase Storage) */}
      {question.image_url && (
        <ClinicalImage
          src={question.image_url}
          alt={`Imagem clínica da questão ${questionNumber ?? ''}`}
        />
      )}

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
                        : 'bg-surface-2 border-label-quaternary text-label-secondary'
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
        <div className="mt-6 p-4 bg-surface-2/50 rounded-lg border border-separator">
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Explicação</h4>
          <div className="prose prose-sm max-w-none dark:prose-invert text-label-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.explanation}</ReactMarkdown>
          </div>
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
