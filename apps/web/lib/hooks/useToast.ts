'use client'

import { useContext } from 'react'
import { ToastContext } from '@/components/ui/Toast'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
}

interface UseToastReturn {
  toast: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

export function useToast(): UseToastReturn {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast } = context

  return {
    toast: (message, options = {}) => {
      addToast({
        id: Math.random().toString(36).substr(2, 9),
        message,
        variant: options.variant || 'info',
        duration: options.duration || 3000,
      })
    },
    success: (message, duration = 3000) => {
      addToast({
        id: Math.random().toString(36).substr(2, 9),
        message,
        variant: 'success',
        duration,
      })
    },
    error: (message, duration = 4000) => {
      addToast({
        id: Math.random().toString(36).substr(2, 9),
        message,
        variant: 'error',
        duration,
      })
    },
    warning: (message, duration = 3500) => {
      addToast({
        id: Math.random().toString(36).substr(2, 9),
        message,
        variant: 'warning',
        duration,
      })
    },
    info: (message, duration = 3000) => {
      addToast({
        id: Math.random().toString(36).substr(2, 9),
        message,
        variant: 'info',
        duration,
      })
    },
  }
}
