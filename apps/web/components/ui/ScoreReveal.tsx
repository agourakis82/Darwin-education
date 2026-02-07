'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { AnimatedCounter } from './AnimatedCounter'

interface ScoreRevealProps {
  score: number
  maxScore?: number
  passed: boolean
  passLabel?: string
  failLabel?: string
  subtitle?: string
  cutoffLabel?: string
  stats?: { value: number; label: string; color?: string; suffix?: string }[]
  onRevealComplete?: () => void
}

export function ScoreReveal({
  score,
  maxScore = 1000,
  passed,
  passLabel = 'Aprovado',
  failLabel = 'Reprovado',
  subtitle = `Pontuacao TRI (0-${maxScore})`,
  cutoffLabel,
  stats,
  onRevealComplete,
}: ScoreRevealProps) {
  return (
    <div className="text-center py-8">
      {/* Stage 1: Pass/Fail Badge — slide in with bouncy spring */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring.bouncy, delay: 0 }}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
          passed
            ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
            : 'bg-red-900/50 text-red-300 border border-red-700'
        }`}
      >
        {passed ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {passLabel}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {failLabel}
          </>
        )}
      </motion.div>

      {/* Stage 2: Score count-up — fades in after badge, counts from 0 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...spring.gentle, delay: 0.4 }}
        className="mb-6"
        onAnimationComplete={onRevealComplete}
      >
        <div className="text-6xl font-bold text-white mb-2">
          <AnimatedCounter value={score} duration={1.8} />
        </div>
        <div className="text-label-secondary">{subtitle}</div>
        {cutoffLabel && (
          <div className="text-sm text-label-tertiary mt-1">{cutoffLabel}</div>
        )}
      </motion.div>

      {/* Stage 3: Stats grid — stagger in from below */}
      {stats && stats.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 1.2 } },
          }}
          className={`grid grid-cols-${stats.length} gap-4 max-w-md mx-auto`}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: spring.gentle },
              }}
              className="bg-surface-2/50 rounded-lg p-4"
            >
              <div className={`text-2xl font-bold ${stat.color || 'text-white'}`}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1} />
              </div>
              <div className="text-xs text-label-secondary">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
