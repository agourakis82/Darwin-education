'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Search, ClipboardList, Lock, BarChart3, AlertTriangle } from 'lucide-react'
import { spring } from '@/lib/motion'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className={`
        darwin-panel-strong rounded-2xl border border-separator/80
        flex flex-col items-center justify-center px-5 py-8
        ${className}
      `}
    >
      {icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.bouncy, delay: 0.1 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-separator/80 bg-surface-2/70 text-label-tertiary"
        >
          {icon}
        </motion.div>
      )}

      <h3 className="text-xl font-semibold text-label-primary mb-2">{title}</h3>

      {description && <p className="mb-6 max-w-sm text-center text-label-secondary">{description}</p>}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}

interface EmptyStateWithIconProps {
  icon: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  }
  className?: string
}

export function EmptyStateWithIcon(props: EmptyStateWithIconProps) {
  return <EmptyState {...props} />
}

// Preset empty states with lucide-react icons

interface SimpleEmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptySearchResults({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8" />}
      title={title || 'Nenhum resultado encontrado'}
      description={
        description || 'Tente ajustar seus critérios de busca ou tente novamente mais tarde.'
      }
      action={action}
    />
  )
}

export function EmptyList({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon={<ClipboardList className="w-8 h-8" />}
      title={title || 'Lista vazia'}
      description={description || 'Não há itens para exibir no momento.'}
      action={action}
    />
  )
}

export function NoPermissions({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon={<Lock className="w-8 h-8" />}
      title={title || 'Acesso negado'}
      description={description || 'Você não tem permissão para acessar este conteúdo.'}
      action={action}
    />
  )
}

export function NoData({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon={<BarChart3 className="w-8 h-8" />}
      title={title || 'Sem dados'}
      description={description || 'Comece a usar o aplicativo para gerar dados.'}
      action={action}
    />
  )
}

export function ServerError({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon={<AlertTriangle className="w-8 h-8" />}
      title={title || 'Erro no servidor'}
      description={description || 'Algo deu errado. Por favor, tente novamente mais tarde.'}
      action={action}
    />
  )
}
