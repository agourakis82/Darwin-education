'use client'

import { useState, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { spring } from '@/lib/motion'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring.snappy}
            className={`absolute z-dropdown ${positionStyles[position]} pointer-events-none`}
            role="tooltip"
          >
            <div className="px-3 py-1.5 text-xs font-medium text-label-primary bg-surface-4 rounded-md shadow-elevation-2 whitespace-nowrap">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
