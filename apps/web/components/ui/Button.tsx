import { forwardRef, isValidElement, cloneElement, type ButtonHTMLAttributes, type ReactNode, type ReactElement } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  asChild?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-elevation-1 shadow-inner-shine text-white hover:from-emerald-400 hover:to-emerald-500 hover:shadow-elevation-2',
  secondary:
    'bg-surface-3 text-label-primary border border-separator shadow-elevation-1 hover:bg-surface-4',
  outline:
    'bg-transparent border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10',
  ghost:
    'bg-transparent text-label-secondary hover:bg-surface-3 hover:text-label-primary',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 shadow-elevation-1 shadow-inner-shine text-white hover:from-red-400 hover:to-red-500 hover:shadow-elevation-2',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
} = {}) {
  return `inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
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
    const buttonClassName = getButtonClassName({ variant, size, fullWidth, className })

    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement<Record<string, unknown>>, {
        className: `${buttonClassName} ${(children.props as Record<string, unknown>).className || ''}`.trim(),
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
          <Spinner size="sm" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
