'use client'

import { useCallback, useContext, useMemo } from 'react'
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

  const toast = useCallback((message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) => {
    addToast({
      id: Math.random().toString(36).slice(2, 11),
      message,
      variant: options.variant || 'info',
      duration: options.duration || 3000,
    })
  }, [addToast])

  const success = useCallback((message: string, duration = 3000) => {
    addToast({
      id: Math.random().toString(36).slice(2, 11),
      message,
      variant: 'success',
      duration,
    })
  }, [addToast])

  const error = useCallback((message: string, duration = 4000) => {
    addToast({
      id: Math.random().toString(36).slice(2, 11),
      message,
      variant: 'error',
      duration,
    })
  }, [addToast])

  const warning = useCallback((message: string, duration = 3500) => {
    addToast({
      id: Math.random().toString(36).slice(2, 11),
      message,
      variant: 'warning',
      duration,
    })
  }, [addToast])

  const info = useCallback((message: string, duration = 3000) => {
    addToast({
      id: Math.random().toString(36).slice(2, 11),
      message,
      variant: 'info',
      duration,
    })
  }, [addToast])

  return useMemo(() => ({
    toast,
    success,
    error,
    warning,
    info,
  }), [toast, success, error, warning, info])
}
