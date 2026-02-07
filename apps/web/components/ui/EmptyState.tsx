import { type ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
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
    <div
      className={`
        flex flex-col items-center justify-center py-12 px-4
        ${className}
      `}
    >
      {icon && (
        <div className="mb-4 text-label-secondary">
          {typeof icon === 'string' ? (
            <span className="text-5xl">{icon}</span>
          ) : (
            <div className="w-16 h-16">{icon}</div>
          )}
        </div>
      )}

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {description && <p className="text-label-secondary text-center max-w-sm mb-6">{description}</p>}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface EmptyStateWithIconProps {
  icon: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  className?: string
}

export function EmptyStateWithIcon(props: EmptyStateWithIconProps) {
  return <EmptyState {...props} />
}

// Preset empty states with common icons

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
      icon="🔍"
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
      icon="📋"
      title={title || 'Lista vazia'}
      description={description || 'Não há itens para exibir no momento.'}
      action={action}
    />
  )
}

export function NoPermissions({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon="🔒"
      title={title || 'Acesso negado'}
      description={description || 'Você não tem permissão para acessar este conteúdo.'}
      action={action}
    />
  )
}

export function NoData({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon="📊"
      title={title || 'Sem dados'}
      description={description || 'Comece a usar o aplicativo para gerar dados.'}
      action={action}
    />
  )
}

export function ServerError({ title, description, action }: SimpleEmptyStateProps) {
  return (
    <EmptyState
      icon="⚠️"
      title={title || 'Erro no servidor'}
      description={description || 'Algo deu errado. Por favor, tente novamente mais tarde.'}
      action={action}
    />
  )
}
