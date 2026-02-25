'use client'

import { forwardRef, isValidElement, cloneElement, type ButtonHTMLAttributes, type ReactNode, type ReactElement } from 'react'
import { Spinner } from './Spinner'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for cleaner tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ButtonVariant =
  | 'filled'      // iOS filled button (primary)
  | 'tinted'      // iOS tinted button (secondary)
  | 'glass'       // visionOS glass material
  | 'plain'       // iOS plain button
  | 'bordered'    // Bordered style
  | 'borderless'  // No border
  // Legacy aliases
  | 'primary'     // → filled
  | 'secondary'   // → tinted
  | 'ghost'       // → plain
  | 'outline'     // → bordered
  | 'danger'      // → filled (with red color)

type ButtonSize = 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg' | 'xs'
type ButtonColor = 'blue' | 'green' | 'red' | 'gray' | 'darwin'

type CoreVariant = 'filled' | 'tinted' | 'glass' | 'plain' | 'bordered' | 'borderless'
type CoreSize = 'small' | 'medium' | 'large'

function normalizeVariant(v: ButtonVariant): { variant: CoreVariant; color?: ButtonColor } {
  switch (v) {
    case 'primary': return { variant: 'filled' }
    case 'secondary': return { variant: 'tinted' }
    case 'ghost': return { variant: 'plain' }
    case 'outline': return { variant: 'bordered' }
    case 'danger': return { variant: 'filled', color: 'red' }
    default: return { variant: v }
  }
}

function normalizeSize(s: ButtonSize): CoreSize {
  switch (s) {
    case 'xs': case 'sm': return 'small'
    case 'md': return 'medium'
    case 'lg': return 'large'
    default: return s
  }
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  asChild?: boolean
  rounded?: boolean
}

const colorMap: Record<ButtonColor, { bg: string; hover: string; text: string }> = {
  blue: {
    bg: 'bg-system-blue',
    hover: 'hover:bg-system-blue/85',
    text: 'text-system-blue',
  },
  green: {
    bg: 'bg-system-green',
    hover: 'hover:bg-system-green/85',
    text: 'text-system-green',
  },
  red: {
    bg: 'bg-system-red',
    hover: 'hover:bg-system-red/85',
    text: 'text-system-red',
  },
  gray: {
    bg: 'bg-system-gray',
    hover: 'hover:bg-system-gray/85',
    text: 'text-system-gray',
  },
  darwin: {
    bg: 'bg-darwin-emerald',
    hover: 'hover:bg-darwin-emerald/85',
    text: 'text-darwin-emerald',
  },
}

const variantStyles = (
  variant: CoreVariant,
  color: ButtonColor,
  isDark: boolean
): string => {
  const c = colorMap[color]
  
  switch (variant) {
    case 'filled':
      return cn(
        c.bg,
        c.hover,
        'text-white',
        'shadow-ios-button',
        'active:scale-[0.96]',
        'active:opacity-90'
      )
    
    case 'tinted':
      return cn(
        isDark ? 'bg-white/15' : 'bg-black/5',
        c.text,
        'hover:bg-opacity-20',
        'active:scale-[0.96]'
      )
    
    case 'glass':
      return cn(
        'bg-system-background/75',
        'backdrop-blur-material-regular',
        'border-[0.5px] border-separator/30',
        'shadow-ios-card',
        'text-label',
        'hover:bg-system-background/85',
        'active:scale-[0.96]'
      )
    
    case 'plain':
      return cn(
        'bg-transparent',
        c.text,
        'hover:bg-system-gray-6/50',
        'active:opacity-70'
      )
    
    case 'bordered':
      return cn(
        'bg-transparent',
        'border-[0.5px] border-separator/50',
        'text-label',
        'hover:bg-secondary-system-background',
        'active:scale-[0.96]'
      )
    
    case 'borderless':
      return cn(
        'bg-transparent',
        'text-label',
        'hover:bg-secondary-system-background',
        'active:opacity-70'
      )
    
    default:
      return ''
  }
}

const sizeStyles: Record<CoreSize, string> = {
  small: 'h-7 px-3 text-xs rounded-md',
  medium: 'h-9 px-4 text-sm rounded-lg',
  large: 'h-12 px-6 text-base rounded-xl',
}

const iconSizeStyles: Record<CoreSize, string> = {
  small: 'w-3.5 h-3.5',
  medium: 'w-4 h-4',
  large: 'w-5 h-5',
}

export function getButtonClassName({
  variant = 'filled',
  size = 'medium',
  color = 'darwin',
  fullWidth = false,
  className = '',
  isDark = false,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
  fullWidth?: boolean
  className?: string
  isDark?: boolean
} = {}) {
  const normalized = normalizeVariant(variant)
  const coreSize = normalizeSize(size)
  const resolvedColor = normalized.color ?? color

  return cn(
    // Base styles
    'relative inline-flex items-center justify-center gap-2',
    'font-semibold whitespace-nowrap',
    'transition-all duration-ios-normal ease-ios',
    'will-change-transform',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-blue/50',

    // Size
    sizeStyles[coreSize],

    // Variant styles
    variantStyles(normalized.variant, resolvedColor, isDark),

    // Full width
    fullWidth && 'w-full',

    // Custom classes
    className
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'filled',
      size = 'medium',
      color = 'darwin',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const coreSize = normalizeSize(size)
    const buttonClassName = getButtonClassName({
      variant,
      size,
      color,
      fullWidth,
      className
    })

    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement<Record<string, unknown>>, {
        className: cn(buttonClassName, (children.props as Record<string, unknown>).className || ''),
      })
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={buttonClassName}
        {...props}
      >
        {loading ? (
          <Spinner size={coreSize === 'small' ? 'sm' : coreSize === 'large' ? 'lg' : 'md'} />
        ) : (
          leftIcon && (
            <span className={cn('flex items-center justify-center', iconSizeStyles[coreSize])}>
              {leftIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className={cn('flex items-center justify-center', iconSizeStyles[coreSize])}>
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Convenience exports for common button patterns
export const FilledButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="filled" {...props} />
)
FilledButton.displayName = 'FilledButton'

export const TintedButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="tinted" {...props} />
)
TintedButton.displayName = 'TintedButton'

export const GlassButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="glass" {...props} />
)
GlassButton.displayName = 'GlassButton'

export const PlainButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="plain" {...props} />
)
PlainButton.displayName = 'PlainButton'
