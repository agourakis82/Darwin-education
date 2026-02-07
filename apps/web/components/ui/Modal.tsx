'use client'

import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlayClick = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', trapFocus)
      document.body.style.overflow = 'hidden'

      requestAnimationFrame(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      })
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose, trapFocus])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={modalRef}
        className={`
          w-full ${sizeStyles[size]} material-regular
          rounded-xl shadow-elevation-5 animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
            <h2 className="text-lg font-semibold text-label-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-label-secondary" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null

  return createPortal(modalContent, document.body)
}
