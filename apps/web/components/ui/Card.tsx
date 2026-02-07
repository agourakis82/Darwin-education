import { type ReactNode } from 'react'

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
  default: 'bg-surface-2 rounded-lg shadow-elevation-1',
  glass: 'material-thin rounded-lg shadow-elevation-1 border border-white/[0.06] shadow-inner-shine',
  elevated: 'bg-surface-3 rounded-lg shadow-elevation-3',
  outlined: 'bg-transparent border border-separator rounded-lg',
}

const hoverVariantStyles: Record<CardVariant, string> = {
  default: 'hover:shadow-elevation-2 hover:bg-surface-3/80 transition-all duration-200 cursor-pointer',
  glass: 'hover:shadow-elevation-2 hover:bg-white/[0.08] transition-all duration-200 cursor-pointer',
  elevated: 'hover:shadow-elevation-4 transition-all duration-200 cursor-pointer',
  outlined: 'hover:border-white/[0.12] hover:bg-surface-2/50 transition-all duration-200 cursor-pointer',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover || onClick ? hoverVariantStyles[variant] : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
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
