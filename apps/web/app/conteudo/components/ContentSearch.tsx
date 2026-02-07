'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ContentSearchProps {
  placeholder?: string
  type: 'doencas' | 'medicamentos' | 'teoria'
  onSearch?: (query: string) => void
}

export function ContentSearch({ placeholder = 'Buscar...', type, onSearch }: ContentSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`/conteudo/${type}?${params.toString()}`)
    onSearch?.(query)
  }

  const handleClear = () => {
    setQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`/conteudo/${type}?${params.toString()}`)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`relative transition-all ${isFocused ? 'ring-2 ring-emerald-500/50' : ''} rounded-lg`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-24 bg-surface-2 border border-separator rounded-lg text-white placeholder-label-secondary focus:outline-none focus:border-emerald-500 transition-colors"
        />

        {/* Search icon */}
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-label-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-3 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-label-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Keyboard shortcut */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-2 py-1 text-xs bg-surface-3 text-label-secondary rounded">
            {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          <kbd className="px-2 py-1 text-xs bg-surface-3 text-label-secondary rounded">K</kbd>
        </div>
      </div>

      {/* Search suggestions */}
      {isFocused && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-2 border border-separator rounded-lg shadow-xl z-50">
          <div className="p-2 text-xs text-label-tertiary border-b border-separator">
            Pressione Enter para buscar
          </div>
          <div className="p-2 space-y-1">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 hover:bg-surface-3 rounded-lg text-sm text-label-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-label-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar "{query}" em {type === 'doencas' ? 'Doenças' : 'Medicamentos'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
