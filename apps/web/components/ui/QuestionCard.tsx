'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { ENAMEDQuestion, DifficultyLevel } from '@darwin-education/shared'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExplanationPanel } from '@/components/ai/ExplanationPanel'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import { spring } from '@/lib/motion'

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
  isFlagged?: boolean
  onToggleFlag?: () => void
}

// ─── Motion Variants ────────────────────────────────────────────────────────

const optionsContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035 },
  },
}

const optionVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: spring.snappy },
}

const iconRevealVariants = {
  initial: { scale: 0, opacity: 0, rotate: -12 },
  animate: { scale: 1, opacity: 1, rotate: 0, transition: spring.bouncy },
  exit:    { scale: 0, opacity: 0, rotate: 12, transition: { duration: 0.1 } },
}

const explanationVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { ...spring.gentle } },
  exit:    { height: 0, opacity: 0, transition: { duration: 0.18 } },
}

// ─── Difficulty Helpers ──────────────────────────────────────────────────────

const difficultyLabels: Record<DifficultyLevel, string> = {
  muito_facil:   'Muito Fácil',
  facil:         'Fácil',
  medio:         'Médio',
  dificil:       'Difícil',
  muito_dificil: 'Muito Difícil',
}

const difficultyIRTClass: Record<DifficultyLevel, string> = {
  muito_facil:   'text-irt-easy',
  facil:         'text-irt-easy',
  medio:         'text-irt-medium',
  dificil:       'text-irt-hard',
  muito_dificil: 'text-irt-very-hard',
}

const difficultyBorderStyle: Record<DifficultyLevel, React.CSSProperties> = {
  muito_facil:   { borderColor: 'color-mix(in oklch, var(--color-irt-easy) 30%, transparent)' },
  facil:         { borderColor: 'color-mix(in oklch, var(--color-irt-easy) 30%, transparent)' },
  medio:         { borderColor: 'color-mix(in oklch, var(--color-irt-medium) 30%, transparent)' },
  dificil:       { borderColor: 'color-mix(in oklch, var(--color-irt-hard) 30%, transparent)' },
  muito_dificil: { borderColor: 'color-mix(in oklch, var(--color-irt-very-hard) 30%, transparent)' },
}

// ─── Clinical Case Detection ─────────────────────────────────────────────────

const CLINICAL_PREFIXES = /^(Paciente|Uma paciente|Um paciente|Uma\/Um|Gestante|Lactente|Criança|Idoso|Idosa|Uma\s|Um\s)/i

function isClinicalCase(stem: string): boolean {
  return CLINICAL_PREFIXES.test(stem.trimStart())
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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
          <p key={i} className="text-label-primary text-lg leading-relaxed whitespace-pre-wrap">
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

// Renders a clinical image from Supabase Storage with a caption.
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

// ─── Main Component ───────────────────────────────────────────────────────────

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
  isFlagged,
  onToggleFlag,
}: QuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null)
  const selected = selectedAnswer ?? localSelected

  const handleSelect = (answer: string) => {
    if (disabled) return
    setLocalSelected(answer)
    onAnswerSelect?.(answer)
  }

  const getCorrectAnswerText = () => question.options[question.correctIndex]?.text

  const getOptionStyle = (optionText: string, isCorrect: boolean): string => {
    const isSelected = selected === optionText

    if (showCorrectAnswer) {
      if (isCorrect) {
        return [
          'border-l-[3px] border-l-emerald-500 border-t border-r border-b',
          'border-t-emerald-500/30 border-r-emerald-500/30 border-b-emerald-500/30',
          'bg-emerald-500/10 text-label-primary',
          'ring-1 ring-emerald-500/15 shadow-depth-1',
        ].join(' ')
      }
      if (isSelected && !isCorrect) {
        return [
          'border-l-[3px] border-l-red-500 border-t border-r border-b',
          'border-t-red-500/30 border-r-red-500/30 border-b-red-500/30',
          'bg-red-500/10 text-label-primary',
          'ring-1 ring-red-500/15 shadow-depth-1',
        ].join(' ')
      }
    }

    if (isSelected) {
      return [
        'border-2 border-emerald-500/60',
        'bg-emerald-500/10 text-label-primary',
        'ring-1 ring-emerald-500/15 shadow-depth-1',
      ].join(' ')
    }

    return [
      'border border-separator/50 bg-surface-2/30 text-label-primary',
      'hover:bg-surface-2/60 hover:border-label-quaternary/60',
      'transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
    ].join(' ')
  }

  const area = question.ontology.area
  const areaColors = AREA_COLORS[area]

  return (
    <div
      className="darwin-panel border border-separator/40 rounded-2xl p-6"
      style={{
        boxShadow:
          '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        {/* Question number — area-colored pill */}
        {questionNumber && (
          <span
            className={`
              px-3 py-1 text-xs font-semibold rounded-full border
              ${areaColors?.bg ?? ''} ${areaColors?.text ?? ''} ${areaColors?.border ?? ''}
            `}
          >
            {questionNumber}{totalQuestions ? ` / ${totalQuestions}` : ''}
          </span>
        )}

        {/* Area badge */}
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${areaColors?.badge ?? ''}`}
        >
          {AREA_LABELS[area]}
        </span>

        {/* Difficulty badge with IRT OKLCH color */}
        {question.difficulty && (
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full border bg-surface-2/50 ${difficultyIRTClass[question.difficulty]}`}
            style={difficultyBorderStyle[question.difficulty]}
          >
            {difficultyLabels[question.difficulty]}
          </span>
        )}

        {/* Year — pushed right */}
        {question.year && !onToggleFlag && (
          <span className="text-xs text-label-tertiary ml-auto">ENAMED {question.year}</span>
        )}
        {question.year && onToggleFlag && (
          <span className="text-xs text-label-tertiary">ENAMED {question.year}</span>
        )}

        {/* Inline flag button */}
        {onToggleFlag && (
          <motion.button
            onClick={onToggleFlag}
            whileTap={{ scale: 0.9 }}
            transition={spring.snappy}
            className={`
              ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              border transition-colors duration-150
              ${isFlagged
                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                : 'bg-surface-2/50 border-separator/50 text-label-tertiary hover:text-label-secondary hover:border-label-quaternary/50'
              }
            `}
            aria-label={isFlagged ? 'Remover marcação' : 'Marcar para revisão'}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={isFlagged ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            {isFlagged ? 'Marcada' : 'Marcar'}
          </motion.button>
        )}
      </div>

      {/* ── Question Stem ── */}
      <div
        className={`
          prose max-w-none mb-6 dark:prose-invert
          ${isClinicalCase(question.stem) ? `pl-4 border-l-2 ${areaColors?.border ?? ''}` : ''}
        `}
      >
        <StemWithImages stem={question.stem} />
      </div>

      {/* Clinical Image */}
      {question.image_url && (
        <ClinicalImage
          src={question.image_url}
          alt={`Imagem clínica da questão ${questionNumber ?? ''}`}
        />
      )}

      {/* ── Options ── */}
      <motion.div
        className="space-y-2.5"
        variants={optionsContainerVariants}
        initial="hidden"
        animate="show"
      >
        {question.options.map((option, index) => {
          const letter = option.letter
          const isCorrect = index === question.correctIndex
          const optionText = option.text
          const isSelected = selected === optionText

          return (
            <motion.button
              key={option.letter}
              variants={optionVariants}
              whileTap={!disabled ? { scale: 0.985 } : undefined}
              onClick={() => handleSelect(optionText)}
              disabled={disabled}
              className={`
                w-full text-left p-4 rounded-xl
                flex items-start gap-3
                disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darwin-emerald/40
                ${getOptionStyle(optionText, isCorrect)}
              `}
            >
              {/* Letter badge */}
              <motion.span
                animate={{ scale: isSelected ? [1, 1.15, 1] : 1 }}
                transition={spring.bouncy}
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-semibold border
                  ${
                    isSelected
                      ? showCorrectAnswer && !isCorrect
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-emerald-600 border-emerald-600 text-white'
                      : showCorrectAnswer && isCorrect
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-surface-2/60 border-separator/60 text-label-secondary'
                  }
                `}
              >
                {letter}
              </motion.span>

              {/* Option text */}
              <span className="flex-1 text-callout leading-relaxed">{optionText}</span>

              {/* Correct / Incorrect icons */}
              <AnimatePresence mode="wait">
                {showCorrectAnswer && isCorrect && (
                  <motion.span
                    key="correct"
                    variants={iconRevealVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.span>
                )}
                {showCorrectAnswer && isSelected && !isCorrect && (
                  <motion.span
                    key="incorrect"
                    variants={iconRevealVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </motion.div>

      {/* ── Explanation ── */}
      <AnimatePresence>
        {showExplanation && question.explanation && (
          <motion.div
            key="explanation"
            variants={explanationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="mt-5 p-4 darwin-panel border-l-4 border-emerald-500/70 border border-separator/30 rounded-xl">
              <h4 className="text-footnote font-semibold text-emerald-400 mb-2">Explicação</h4>
              <div className="prose prose-sm max-w-none dark:prose-invert text-label-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.explanation}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Explanation ── */}
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
