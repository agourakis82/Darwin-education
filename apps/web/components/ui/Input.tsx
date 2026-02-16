'use client'

import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [shake, setShake] = useState(false)
    const prevError = useRef(error)

    useEffect(() => {
      if (error && !prevError.current) {
        setShake(true)
        const t = setTimeout(() => setShake(false), 400)
        return () => clearTimeout(t)
      }
      prevError.current = error
    }, [error])

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-label-primary mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            darwin-focus-ring w-full rounded-xl border bg-surface-2 px-4 py-3 text-label-primary
            placeholder-label-quaternary transition-all duration-300
            focus:border-emerald-500/60 focus:shadow-glow-emerald
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-separator'}
            ${shake ? 'animate-shake' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-label-tertiary">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
