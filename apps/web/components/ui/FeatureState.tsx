'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Inbox, Sparkles } from 'lucide-react'
import { spring } from '@/lib/motion'
import { Button } from './Button'
import { Spinner } from './Spinner'

type FeatureStateKind = 'loading' | 'empty' | 'error' | 'success'

interface FeatureStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

interface FeatureStateProps {
  kind: FeatureStateKind
  title: string
  description?: string
  icon?: ReactNode
  action?: FeatureStateAction
  className?: string
  compact?: boolean
}

const toneClasses: Record<FeatureStateKind, string> = {
  loading: 'border-sky-400/30 bg-sky-500/8',
  empty: 'border-separator/80 bg-surface-1/70',
  error: 'border-rose-400/35 bg-rose-500/12',
  success: 'border-emerald-400/35 bg-emerald-500/10',
}

const iconClasses: Record<FeatureStateKind, string> = {
  loading: 'text-sky-300 border-sky-400/35 bg-sky-500/12',
  empty: 'text-label-tertiary border-separator/80 bg-surface-2/70',
  error: 'text-rose-300 border-rose-400/35 bg-rose-500/14',
  success: 'text-emerald-300 border-emerald-400/35 bg-emerald-500/14',
}

function DefaultStateIcon({ kind }: { kind: FeatureStateKind }) {
  if (kind === 'loading') {
    return <Spinner size="md" className="text-sky-300" />
  }
  if (kind === 'error') {
    return <AlertTriangle className="h-6 w-6" />
  }
  if (kind === 'success') {
    return <Sparkles className="h-6 w-6" />
  }
  return <Inbox className="h-6 w-6" />
}

export function FeatureState({
  kind,
  title,
  description,
  icon,
  action,
  className = '',
  compact = false,
}: FeatureStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className={`darwin-panel-strong ${toneClasses[kind]} rounded-2xl border px-5 py-6 text-center ${compact ? 'py-5' : 'py-8'} ${className}`}
    >
      <div className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${iconClasses[kind]}`}>
        {icon ?? <DefaultStateIcon kind={kind} />}
      </div>
      <h3 className="text-lg font-semibold text-label-primary">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-label-secondary">{description}</p> : null}
      {action ? (
        <div className="mt-5">
          <Button variant={action.variant ?? 'tinted'} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </motion.div>
  )
}
