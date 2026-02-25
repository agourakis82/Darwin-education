'use client'

import { type KeyboardEvent, type ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type CardVariant = 
  | 'default'      // iOS grouped background
  | 'glass'        // visionOS glass material
  | 'elevated'     // Elevated with shadow
  | 'chrome'       // macOS window chrome
  | 'outlined'     // Bordered only

type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: CardVariant
  padding?: CardPadding
  hover?: boolean
  pressable?: boolean
  onClick?: () => void
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  xs: 'p-3',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
}

const variantStyles: Record<CardVariant, string> = {
  default: cn(
    'bg-secondary-system-background',
    'rounded-xl',
    'border-[0.5px] border-separator/20',
    'shadow-ios-card'
  ),
  glass: cn(
    'bg-system-background/75',
    'backdrop-blur-material-regular',
    'rounded-2xl',
    'border-[0.5px] border-separator/30',
    'shadow-depth-2',
    'shadow-inner-shine'
  ),
  elevated: cn(
    'bg-secondary-system-background',
    'rounded-2xl',
    'border-[0.5px] border-separator/20',
    'shadow-depth-3'
  ),
  chrome: cn(
    'bg-secondary-system-background/92',
    'backdrop-blur-material-chrome',
    'rounded-2xl',
    'border-[0.5px] border-separator/35',
    'shadow-ios-modal'
  ),
  outlined: cn(
    'bg-transparent',
    'rounded-xl',
    'border-[0.5px] border-separator/50'
  ),
}

const hoverVariantStyles: Record<CardVariant, string> = {
  default: 'hover:shadow-depth-3 hover:bg-secondary-system-background/90',
  glass: 'hover:bg-system-background/85 hover:shadow-depth-3',
  elevated: 'hover:shadow-depth-4 hover:translate-y-[-2px]',
  chrome: 'hover:bg-secondary-system-background/95',
  outlined: 'hover:bg-secondary-system-background/50',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  pressable = false,
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
      className={cn(
        // Base styles
        'relative overflow-hidden',
        'transition-all duration-ios-normal ease-ios',
        
        // Variant
        variantStyles[variant],
        
        // Padding
        paddingStyles[padding],
        
        // Hover effect
        (hover || onClick) && !pressable && hoverVariantStyles[variant],
        
        // Pressable effect
        pressable && 'apple-pressable',
        
        // Clickable states
        isClickable && [
          'cursor-pointer',
          'active:scale-[0.98]',
          'focus-visible:ring-2 focus-visible:ring-system-blue/50 focus-visible:ring-offset-2',
        ],
        
        // Custom classes
        className
      )}
    >
      {children}
    </div>
  )
}

// Card subcomponents for structured content

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 space-y-1', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'large' | 'medium' | 'small'
}

export function CardTitle({ 
  children, 
  className = '', 
  as: Component = 'h3',
  size = 'medium'
}: CardTitleProps) {
  const sizeStyles = {
    large: 'text-title-2',
    medium: 'text-title-3',
    small: 'text-headline',
  }
  
  return (
    <Component className={cn(
      'font-semibold text-label',
      sizeStyles[size],
      className
    )}>
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
    <p className={cn('text-subheadline text-secondary-label', className)}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
  bordered?: boolean
}

export function CardFooter({ children, className = '', bordered = true }: CardFooterProps) {
  return (
    <div className={cn(
      'mt-4 pt-4',
      bordered && 'border-t-[0.5px] border-separator/20',
      className
    )}>
      {children}
    </div>
  )
}

// Specialized card variants for common patterns

interface ListCardProps {
  children: ReactNode
  className?: string
}

export function ListCard({ children, className = '' }: ListCardProps) {
  return (
    <div className={cn(
      'bg-secondary-system-background',
      'rounded-xl',
      'overflow-hidden',
      'shadow-ios-card',
      className
    )}>
      {children}
    </div>
  )
}

interface ListCardItemProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  chevron?: boolean
}

export function ListCardItem({ 
  children, 
  className = '', 
  onClick,
  chevron = false 
}: ListCardItemProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'flex items-center justify-between',
        'px-4 py-3',
        'border-b-[0.5px] border-separator/20',
        'last:border-b-0',
        'transition-colors duration-ios-fast',
        onClick && [
          'cursor-pointer',
          'hover:bg-tertiary-system-background',
          'active:bg-system-gray-6/50',
        ],
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {chevron && (
        <svg
          className="w-5 h-5 text-tertiary-label ml-2 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
}

// Glass panel for floating UI elements
interface GlassPanelProps {
  children: ReactNode
  className?: string
  intensity?: 'ultra-thin' | 'thin' | 'regular' | 'thick' | 'chrome'
}

export function GlassPanel({ 
  children, 
  className = '',
  intensity = 'regular'
}: GlassPanelProps) {
  const intensityMap = {
    'ultra-thin': 'backdrop-blur-material-ultra-thin bg-system-background/55',
    'thin': 'backdrop-blur-material-thin bg-system-background/70',
    'regular': 'backdrop-blur-material-regular bg-system-background/75',
    'thick': 'backdrop-blur-material-thick bg-secondary-system-background/82',
    'chrome': 'backdrop-blur-material-chrome bg-secondary-system-background/92',
  }
  
  return (
    <div className={cn(
      'rounded-2xl',
      'border-[0.5px] border-separator/30',
      'shadow-depth-2',
      intensityMap[intensity],
      className
    )}>
      {children}
    </div>
  )
}
