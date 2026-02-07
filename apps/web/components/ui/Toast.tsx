'use client'

import { createContext, useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { spring } from '@/lib/motion'

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

const variantStyles = {
  success: {
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-500/20',
    text: 'text-emerald-100',
    icon: '\u2713',
    iconColor: 'text-emerald-400',
  },
  error: {
    bg: 'bg-red-950/80',
    border: 'border-red-500/20',
    text: 'text-red-100',
    icon: '\u2715',
    iconColor: 'text-red-400',
  },
  warning: {
    bg: 'bg-amber-950/80',
    border: 'border-amber-500/20',
    text: 'text-amber-100',
    icon: '\u26A0',
    iconColor: 'text-amber-400',
  },
  info: {
    bg: 'bg-blue-950/80',
    border: 'border-blue-500/20',
    text: 'text-blue-100',
    icon: '\u2139',
    iconColor: 'text-blue-400',
  },
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (typeof window === 'undefined') return null

  const toastContent = (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const styles = variantStyles[toast.variant || 'info']
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={spring.snappy}
              className={`
                ${styles.bg} ${styles.border} ${styles.text}
                pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border
                shadow-elevation-3 max-w-sm
              `}
              style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)' }}
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
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )

  return createPortal(toastContent, document.body)
}
