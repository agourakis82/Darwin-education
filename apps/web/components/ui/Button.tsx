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
    'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 hover:shadow-elevation-3',
  secondary:
    'darwin-panel border border-separator/80 text-label-primary hover:bg-surface-2/85',
  outline:
    'border border-emerald-400/45 bg-transparent text-emerald-300 hover:bg-emerald-500/10',
  ghost:
    'bg-transparent text-label-secondary hover:bg-surface-3/70 hover:text-label-primary',
  danger:
    'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-elevation-2 shadow-inner-shine hover:from-rose-400 hover:to-rose-500 hover:shadow-elevation-3',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-3.5 text-lg rounded-xl',
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
  return `darwin-focus-ring inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()
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
