'use client'

import { createContext, useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
  maxToasts?: number
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Toast) => {
      const toastWithDefaults = {
        ...toast,
        variant: toast.variant || 'info',
        duration: toast.duration || 3000,
      }

      setToasts((prev) => {
        const updated = [...prev, toastWithDefaults]
        return updated.slice(-maxToasts)
      })

      if (toastWithDefaults.duration > 0) {
        const timer = setTimeout(() => removeToast(toast.id), toastWithDefaults.duration)
        return () => clearTimeout(timer)
      }
    },
    [maxToasts, removeToast]
  )

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (typeof window === 'undefined') return null

  const variantStyles = {
    success: {
      bg: 'bg-emerald-900/90',
      border: 'border-emerald-700',
      text: 'text-emerald-100',
      icon: '✓',
      iconColor: 'text-emerald-400',
    },
    error: {
      bg: 'bg-red-900/90',
      border: 'border-red-700',
      text: 'text-red-100',
      icon: '✕',
      iconColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-amber-900/90',
      border: 'border-amber-700',
      text: 'text-amber-100',
      icon: '⚠',
      iconColor: 'text-amber-400',
    },
    info: {
      bg: 'bg-blue-900/90',
      border: 'border-blue-700',
      text: 'text-blue-100',
      icon: 'ℹ',
      iconColor: 'text-blue-400',
    },
  }

  const toastContent = (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const styles = variantStyles[toast.variant || 'info']
        return (
          <div
            key={toast.id}
            className={`
              ${styles.bg} ${styles.border} ${styles.text}
              pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border
              shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200
            `}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={`${styles.iconColor} font-bold text-lg flex-shrink-0 mt-0.5`}>
              {styles.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className={`${styles.iconColor} hover:opacity-70 flex-shrink-0 transition-opacity ml-2`}
              aria-label="Fechar notificação"
              type="button"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )

  return createPortal(toastContent, document.body)
}
