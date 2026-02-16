'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
}

const STORAGE_KEY = 'darwin-theme'
const THEME_QUERY = '(prefers-color-scheme: dark)'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function isValidTheme(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia(THEME_QUERY).matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(resolved: ResolvedTheme, themeMode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.setAttribute('data-theme', themeMode)
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const initialTheme = isValidTheme(stored) ? stored : 'system'
    const resolved = resolveTheme(initialTheme)
    setThemeState(initialTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved, initialTheme)
  }, [])

  useEffect(() => {
    const media = window.matchMedia(THEME_QUERY)
    const updateFromSystem = () => {
      if (theme !== 'system') return
      const resolved = media.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyTheme(resolved, 'system')
    }

    media.addEventListener('change', updateFromSystem)
    return () => media.removeEventListener('change', updateFromSystem)
  }, [theme])

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    const resolved = resolveTheme(nextTheme)
    setThemeState(nextTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved, nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
