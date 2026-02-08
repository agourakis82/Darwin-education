'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { ArrowRight, AlertCircle, Zap, GitBranch, Shield } from 'lucide-react'
import type { FCRCascadeAnalysis, FCRLevel, FCRReasoningProfile } from '@darwin-education/shared'
import { FCR_LEVEL_LABELS_PT } from '@darwin-education/shared'

interface CascadeFlowChartProps {
  cascade: FCRCascadeAnalysis
}

const PROFILE_CONFIG: Record<FCRReasoningProfile, {
  label: string
  description: string
  icon: typeof AlertCircle
  color: string
}> = {
  sequential: {
    label: 'Sequencial',
    description: 'Erros propagam entre niveis. Corrigir a base melhorara os niveis subsequentes.',
    icon: ArrowRight,
    color: 'text-amber-400',
  },
  parallel: {
    label: 'Paralelo',
    description: 'Erros sao independentes. Cada nivel precisa de remediacao separada.',
    icon: GitBranch,
    color: 'text-blue-400',
  },
  bottleneck: {
    label: 'Gargalo',
    description: 'Erros concentrados em um nivel especifico. Foque nele primeiro.',
    icon: AlertCircle,
    color: 'text-red-400',
  },
  robust: {
    label: 'Robusto',
    description: 'Poucos erros e boa cadeia de raciocinio. Continue assim!',
    icon: Shield,
    color: 'text-emerald-400',
  },
}

/**
 * Cascade Flow Chart — visualizes error propagation across FCR levels.
 *
 * Shows a flow diagram from Dados → Padrao → Hipotese → Conduta
 * with arrow thickness proportional to cascade lift.
 *
 * A lift > 1 means errors at the source level increase the probability
 * of errors at the target level (cascade effect).
 */
export function CascadeFlowChart({ cascade }: CascadeFlowChartProps) {
  const levels: FCRLevel[] = ['dados', 'padrao', 'hipotese', 'conduta']
  const profileConfig = PROFILE_CONFIG[cascade.reasoningProfile]
  const ProfileIcon = profileConfig.icon

  // Get adjacent transitions (the main cascade path)
  const adjacentTransitions = cascade.transitions.filter((t) => {
    const fromIdx = levels.indexOf(t.fromLevel)
    const toIdx = levels.indexOf(t.toLevel)
    return toIdx === fromIdx + 1
  })

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Analise de Cascata
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        {/* Level flow with arrows */}
        <div className="flex items-center justify-between mb-4">
          {levels.map((level, i) => {
            const errorRate = cascade.levelErrorRates[level]
            const isHigh = errorRate > 0.5
            const isMedium = errorRate > 0.3

            return (
              <div key={level} className="flex items-center">
                {/* Level node */}
                <motion.div
                  className={`relative flex flex-col items-center`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.gentle, delay: i * 0.1 }}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      isHigh
                        ? 'bg-red-900/30 border-red-500/50 text-red-400'
                        : isMedium
                          ? 'bg-amber-900/30 border-amber-500/50 text-amber-400'
                          : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                    }`}
                  >
                    {Math.round(errorRate * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-center">
                    {FCR_LEVEL_LABELS_PT[level]}
                  </div>
                </motion.div>

                {/* Arrow between levels */}
                {i < levels.length - 1 && (
                  <CascadeArrow
                    transition={adjacentTransitions[i]}
                    index={i}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Cascade severity meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Severidade da Cascata</span>
            <span>{Math.round(cascade.cascadeSeverity * 100)}%</span>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                cascade.cascadeSeverity > 0.6
                  ? 'bg-red-500'
                  : cascade.cascadeSeverity > 0.3
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${cascade.cascadeSeverity * 100}%` }}
              transition={{ ...spring.gentle, delay: 0.5 }}
            />
          </div>
        </div>

        {/* Reasoning profile badge */}
        <motion.div
          className="flex items-start gap-3 bg-surface-0/40 rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ProfileIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${profileConfig.color}`} />
          <div>
            <div className={`text-sm font-semibold ${profileConfig.color}`}>
              Perfil: {profileConfig.label}
            </div>
            <p className="text-xs text-muted-foreground">
              {profileConfig.description}
            </p>
          </div>
        </motion.div>

        {/* Strongest cascade detail */}
        {cascade.strongestCascade && cascade.strongestCascade.cascadeLift > 1.5 && (
          <motion.div
            className="mt-3 flex items-center gap-2 text-xs bg-amber-900/10 rounded p-2 border border-amber-700/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300">
              Cascata mais forte: {FCR_LEVEL_LABELS_PT[cascade.strongestCascade.fromLevel]} →{' '}
              {FCR_LEVEL_LABELS_PT[cascade.strongestCascade.toLevel]}
              {' '}(lift: {cascade.strongestCascade.cascadeLift.toFixed(1)}x)
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function CascadeArrow({
  transition,
  index,
}: {
  transition?: { cascadeLift: number; pErrorGivenError: number }
  index: number
}) {
  const lift = transition?.cascadeLift ?? 1
  const isCascade = lift > 1.5
  const thickness = Math.min(4, Math.max(1, lift))

  return (
    <motion.div
      className="flex flex-col items-center mx-1"
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ ...spring.gentle, delay: 0.2 + index * 0.15 }}
    >
      <svg width="32" height="20" viewBox="0 0 32 20">
        <line
          x1="2" y1="10" x2="26" y2="10"
          stroke={isCascade ? '#f59e0b' : '#6b7280'}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <polygon
          points="26,5 32,10 26,15"
          fill={isCascade ? '#f59e0b' : '#6b7280'}
        />
      </svg>
      {lift > 1.2 && (
        <span className={`text-[9px] ${isCascade ? 'text-amber-400' : 'text-muted-foreground'}`}>
          {lift.toFixed(1)}x
        </span>
      )}
    </motion.div>
  )
}
