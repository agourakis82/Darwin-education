'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme, type ThemeMode } from './ThemeProvider'

interface ThemeToggleProps {
  showLabels?: boolean
}

const options: Array<{
  value: ThemeMode
  label: string
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function ThemeToggle({ showLabels = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const statusLabel = useMemo(() => {
    if (!mounted) return 'Sistema'
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? 'Sistema (Escuro)' : 'Sistema (Claro)'
    }
    return theme === 'dark' ? 'Escuro' : 'Claro'
  }, [mounted, resolvedTheme, theme])

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="inline-flex h-10 min-w-[120px] rounded-xl border border-separator bg-surface-2/70"
      />
    )
  }

  return (
    <div className="inline-flex items-center rounded-xl border border-separator/80 bg-surface-2/70 p-1">
      <span className="sr-only">Tema atual: {statusLabel}</span>
      {options.map((option) => {
        const Icon = option.icon
        const active = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`darwin-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-300 shadow-inner-shine'
                : 'border border-transparent text-label-secondary hover:bg-surface-3/70 hover:text-label-primary'
            }`}
            aria-pressed={active}
            aria-label={`Ativar tema ${option.label.toLowerCase()}`}
            title={option.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {showLabels ? <span>{option.label}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
