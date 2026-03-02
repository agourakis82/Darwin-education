'use client'

import { motion } from 'framer-motion'
import type { ENAMEDQuestion } from '@darwin-education/shared'
import { spring } from '@/lib/motion'

interface ExamAnswer {
  questionId: string
  selectedAnswer: string | null
  timeSpent: number
  flagged: boolean
}

interface QuestionNavigationProps {
  questions: ENAMEDQuestion[]
  currentIndex: number
  answers: Record<string, ExamAnswer>
  onSelectQuestion: (index: number) => void
  compact?: boolean
}

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.015 },
  },
}

const gridButtonVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: spring.snappy },
}

const statusStyles = {
  current:    'bg-emerald-600 text-white border-emerald-500 shadow-depth-1 ring-1 ring-emerald-500/30',
  answered:   'bg-surface-2/60 text-label-primary border-separator/60 shadow-depth-1',
  flagged:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/40 ring-1 ring-yellow-500/20',
  unanswered: 'bg-surface-2/30 text-label-tertiary border-separator/40 hover:bg-surface-2/60 hover:border-label-quaternary/50 transition-colors duration-150',
}

export function QuestionNavigation({
  questions,
  currentIndex,
  answers,
  onSelectQuestion,
  compact = false,
}: QuestionNavigationProps) {
  const getQuestionStatus = (question: ENAMEDQuestion, index: number) => {
    const answer = answers[question.id]
    const isCurrent = index === currentIndex

    if (isCurrent) return 'current'
    if (answer?.flagged) return 'flagged'
    if (answer?.selectedAnswer !== null) return 'answered'
    return 'unanswered'
  }

  const answeredCount = Object.values(answers).filter(a => a.selectedAnswer !== null).length
  const flaggedCount = Object.values(answers).filter(a => a.flagged).length

  // ── Compact (mobile) ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="darwin-panel border border-separator/40 rounded-2xl p-4"
        style={{
          boxShadow:
            '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-footnote font-semibold text-label-primary">Navegação</span>
          <div className="flex gap-3 text-xs">
            <span className="text-emerald-400 font-medium">
              {answeredCount}/{questions.length}
            </span>
            {flaggedCount > 0 && (
              <span className="text-yellow-400 font-medium">{flaggedCount} marcadas</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question, index)
            return (
              <button
                key={question.id}
                onClick={() => onSelectQuestion(index)}
                className={`
                  w-8 h-8 text-xs font-medium rounded-lg border
                  flex items-center justify-center
                  ${statusStyles[status]}
                `}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Full (desktop sidebar) ────────────────────────────────────────────────
  return (
    <div
      className="darwin-panel border border-separator/40 rounded-2xl p-4"
      style={{
        boxShadow:
          '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.08)',
      }}
    >
      <h3 className="text-footnote font-semibold text-label-primary mb-3">Questões</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-1 ring-emerald-500/30" />
          <span className="text-caption text-label-tertiary">Atual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-surface-2/80 border border-separator/60" />
          <span className="text-caption text-label-tertiary">Respondida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
          <span className="text-caption text-label-tertiary">Marcada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-surface-2/30 border border-separator/40" />
          <span className="text-caption text-label-tertiary">Não respondida</span>
        </div>
      </div>

      {/* Question Grid — stagger on mount */}
      <motion.div
        className="grid grid-cols-5 gap-2"
        variants={gridContainerVariants}
        initial="hidden"
        animate="show"
      >
        {questions.map((question, index) => {
          const status = getQuestionStatus(question, index)
          return (
            <motion.button
              key={question.id}
              variants={gridButtonVariants}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={spring.snappy}
              onClick={() => onSelectQuestion(index)}
              className={`
                aspect-square text-sm font-medium rounded-lg border
                flex items-center justify-center
                ${statusStyles[status]}
              `}
              title={`Questão ${index + 1}`}
            >
              {index + 1}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-separator/40">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xl font-bold text-emerald-400 tabular-nums">{answeredCount}</span>
            <span className="text-caption text-emerald-400/70">Respondidas</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-xl font-bold text-yellow-400 tabular-nums">{flaggedCount}</span>
            <span className="text-caption text-yellow-400/70">Marcadas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
