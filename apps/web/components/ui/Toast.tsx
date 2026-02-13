'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CircleCheck, CircleAlert, TriangleAlert, Info } from 'lucide-react'
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

const variantConfig = {
  success: {
    bg: 'bg-emerald-500/14',
    border: 'border-emerald-400/45',
    text: 'text-label-primary',
    Icon: CircleCheck,
    iconColor: 'text-emerald-300',
    title: 'Sucesso',
  },
  error: {
    bg: 'bg-rose-500/14',
    border: 'border-rose-400/42',
    text: 'text-label-primary',
    Icon: CircleAlert,
    iconColor: 'text-rose-300',
    title: 'Erro',
  },
  warning: {
    bg: 'bg-amber-500/12',
    border: 'border-amber-400/40',
    text: 'text-label-primary',
    Icon: TriangleAlert,
    iconColor: 'text-amber-300',
    title: 'Atenção',
  },
  info: {
    bg: 'bg-sky-500/12',
    border: 'border-sky-400/40',
    text: 'text-label-primary',
    Icon: Info,
    iconColor: 'text-sky-300',
    title: 'Informação',
  },
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toastContent = (
    <div className="pointer-events-none fixed bottom-[calc(5.6rem+env(safe-area-inset-bottom))] left-1/2 z-toast flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2.5 md:bottom-auto md:left-auto md:right-5 md:top-5 md:w-[min(28rem,92vw)] md:translate-x-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant || 'info']
          const IconComponent = config.Icon
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={spring.snappy}
              className={`
                ${config.bg} ${config.border} ${config.text}
                pointer-events-auto flex items-start gap-3 rounded-2xl border px-3.5 py-3
                shadow-elevation-4
              `}
              style={{ WebkitBackdropFilter: 'blur(30px) saturate(180%)', backdropFilter: 'blur(30px) saturate(180%)' }}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className={`${config.iconColor} mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-separator/70 bg-surface-2/70`}>
                <IconComponent className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-label-tertiary">{config.title}</p>
                <p className="mt-1 text-sm leading-5 break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                className={`${config.iconColor} ml-1 flex-shrink-0 rounded-lg p-1 transition-opacity hover:bg-surface-2/70 hover:opacity-70`}
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
