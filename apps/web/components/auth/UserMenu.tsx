'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, LogOut, Layers, BarChart3 } from 'lucide-react'
import { getUserDisplayName, getUserInitial, type UserSummary } from '@/lib/auth/user'

interface UserMenuProps {
  user: UserSummary
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const userName = getUserDisplayName(user)
  const userInitial = getUserInitial(user)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="darwin-focus-ring darwin-nav-link inline-flex items-center gap-2 rounded-xl border border-separator/70 bg-surface-2/65 px-3 py-2 text-sm text-label-primary shadow-elevation-1 hover:bg-surface-3/70"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/25 to-emerald-600/15 text-sm font-semibold text-emerald-200 shadow-inner-shine">
          {userInitial}
        </div>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-label-primary sm:block">
          {userName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-label-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-dropdown mt-2 w-72 overflow-hidden rounded-2xl border border-separator/80 bg-surface-1/90 p-1 shadow-elevation-4 backdrop-blur-xl"
          role="menu"
        >
          <div className="rounded-xl border border-separator/70 bg-surface-2/60 px-4 py-3">
            <p className="text-sm font-semibold text-label-primary">{userName}</p>
            <p className="mt-0.5 text-xs text-label-tertiary truncate">{user.email || ''}</p>
          </div>

          <Link
            href="/desempenho"
            onClick={() => setIsOpen(false)}
            className="darwin-focus-ring darwin-nav-link mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-label-secondary hover:bg-surface-3/70 hover:text-label-primary"
          >
            <BarChart3 className="h-4 w-4 text-label-tertiary" aria-hidden="true" />
            Meu desempenho
          </Link>

          <Link
            href="/flashcards"
            onClick={() => setIsOpen(false)}
            className="darwin-focus-ring darwin-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-label-secondary hover:bg-surface-3/70 hover:text-label-primary"
          >
            <Layers className="h-4 w-4 text-label-tertiary" aria-hidden="true" />
            Meus flashcards
          </Link>

          <div className="mt-1 border-t border-separator/70 pt-1">
            <button
              onClick={handleSignOut}
              className="darwin-focus-ring darwin-nav-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Encerrar sessão
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
