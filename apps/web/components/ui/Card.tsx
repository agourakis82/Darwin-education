import { type KeyboardEvent, type ReactNode } from 'react'

type CardVariant = 'default' | 'glass' | 'elevated' | 'outlined'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantStyles: Record<CardVariant, string> = {
  default: 'darwin-panel rounded-2xl border border-separator/80',
  glass: 'material-thin rounded-2xl border border-separator/70 shadow-elevation-2 shadow-inner-shine',
  elevated: 'rounded-2xl border border-separator/80 bg-surface-2 shadow-elevation-3',
  outlined: 'rounded-2xl border border-separator bg-transparent',
}

const hoverVariantStyles: Record<CardVariant, string> = {
  default:
    'darwin-card-interactive cursor-pointer hover:border-separator/95 hover:bg-surface-2/90 hover:shadow-elevation-3',
  glass:
    'darwin-card-interactive cursor-pointer hover:border-separator/95 hover:bg-surface-1/90 hover:shadow-elevation-3',
  elevated: 'darwin-card-interactive cursor-pointer hover:bg-surface-3/90 hover:shadow-elevation-4',
  outlined:
    'darwin-card-interactive cursor-pointer hover:border-separator/95 hover:bg-surface-1/60 hover:shadow-elevation-2',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const isClickable = Boolean(onClick)
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover || onClick ? hoverVariantStyles[variant] : ''}
        ${isClickable ? 'text-left w-full darwin-focus-ring' : ''}
        relative overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function CardTitle({ children, className = '', as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component className={`text-lg font-semibold text-label-primary ${className}`}>
      {children}
    </Component>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-label-secondary mt-1 ${className}`}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-separator ${className}`}>
      {children}
    </div>
  )
}
