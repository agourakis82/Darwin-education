'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { spring } from '@/lib/motion'

interface DropdownItem {
  label: string
  value: string
  icon?: ReactNode
  disabled?: boolean
}

interface DropdownProps {
  items: DropdownItem[]
  onSelect: (value: string) => void
  trigger?: ReactNode
  label?: string
  placeholder?: string
  className?: string
}

export function Dropdown({
  items,
  onSelect,
  trigger,
  label,
  placeholder = 'Selecione...',
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [close])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
        setActiveIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0 && !items[activeIndex].disabled) {
          onSelect(items[activeIndex].value)
          close()
        }
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-label-secondary mb-1.5">{label}</label>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-separator rounded-md text-sm text-label-primary hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
      >
        {trigger || <span className="text-label-tertiary">{placeholder}</span>}
        <ChevronDown className={`w-4 h-4 text-label-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={spring.snappy}
            role="listbox"
            className="absolute z-50 mt-1 w-full min-w-[180px] material-thin rounded-lg shadow-elevation-3 overflow-hidden border border-white/[0.06]"
          >
            {items.map((item, index) => (
              <li
                key={item.value}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  item.disabled
                    ? 'text-label-quaternary cursor-not-allowed'
                    : index === activeIndex
                      ? 'bg-emerald-500/[0.12] text-emerald-400'
                      : 'text-label-secondary hover:bg-surface-3'
                }`}
                onClick={() => {
                  if (!item.disabled) {
                    onSelect(item.value)
                    close()
                  }
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {item.icon}
                {item.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
