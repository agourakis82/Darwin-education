'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { UserMenu } from '@/components/auth/UserMenu'
import { createClient } from '@/lib/supabase/client'
import type { UserSummary } from '@/lib/auth/user'
import {
  Home,
  ClipboardList,
  Layers,
  Map,
  SlidersHorizontal,
  Lightbulb,
  FileText,
  BarChart3,
  BookOpen,
  Brain,
  FlaskConical,
  ChevronDown,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

const allNavItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/simulado', label: 'Simulado', icon: ClipboardList },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/trilhas', label: 'Trilhas', icon: Map },
  { href: '/conteudo', label: 'Conteúdo', icon: BookOpen },
  { href: '/montar-prova', label: 'Montar Prova', icon: SlidersHorizontal },
  { href: '/qgen', label: 'Gerar IA', icon: Lightbulb },
  { href: '/caso-clinico', label: 'Caso Clínico', icon: FileText },
  { href: '/fcr', label: 'Raciocínio', icon: Brain },
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3 },
  { href: '/pesquisa', label: 'Pesquisa', icon: FlaskConical },
]

const primaryNavItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/simulado', label: 'Simulado', icon: ClipboardList },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/trilhas', label: 'Trilhas', icon: Map },
  { href: '/conteudo', label: 'Conteúdo', icon: BookOpen },
]

const moreNavItems = [
  { href: '/montar-prova', label: 'Montar Prova', icon: SlidersHorizontal },
  { href: '/qgen', label: 'Gerar IA', icon: Lightbulb },
  { href: '/caso-clinico', label: 'Caso Clínico', icon: FileText },
  { href: '/fcr', label: 'Raciocínio', icon: Brain },
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3 },
  { href: '/pesquisa', label: 'Pesquisa', icon: FlaskConical },
]

export function Navigation({ user }: { user: UserSummary | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const desktopNavItems = isAuthPage ? [] : primaryNavItems
  const mobileItems = isAuthPage
    ? [{ href: '/', label: 'Início', icon: Home }]
    : allNavItems

  useEffect(() => {
    setMobileMenuOpen(false)
    setMoreMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!moreMenuRef.current) return
      if (!moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isMoreActive = moreNavItems.some((item) => isActive(item.href))

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Pular para o conteúdo
      </a>

      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={spring.gentle}
        className="sticky top-0 z-sticky px-3 pb-2 pt-2 md:px-4 md:pt-3"
        style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)' }}
        aria-label="Navegação principal"
      >
        <div className="mx-auto max-w-7xl rounded-[22px] darwin-panel-strong">
          <div className="flex h-[60px] items-center justify-between px-4 sm:px-5 lg:px-6">
            {/* Logo */}
            <Link href="/" className="darwin-focus-ring flex items-center gap-2 rounded-lg">
              <BrandLogo variant="horizontal" size="md" priority />
            </Link>

            {/* Desktop Navigation */}
            {desktopNavItems.length > 0 ? (
              <div className="hidden items-center gap-1 rounded-xl border border-separator/70 bg-surface-2/65 px-1.5 py-1.5 md:flex" role="menubar">
                {desktopNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                      className={`darwin-focus-ring darwin-nav-link group relative flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 text-sm font-medium ${
                        active
                          ? 'border-emerald-500/35 text-emerald-200'
                          : 'border-transparent text-label-secondary hover:border-separator/80 hover:bg-surface-3/70 hover:text-label-primary'
                      }`}
                    >
                      {active ? (
                        <motion.span
                          layoutId="desktop-nav-active-pill"
                          transition={spring.snappy}
                          className="absolute inset-0 rounded-lg border border-emerald-500/35 bg-emerald-500/[0.16] shadow-inner-shine"
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="relative z-[1] flex items-center gap-2">
                        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-105" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  )
                })}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setMoreMenuOpen((open) => !open)}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="menu"
                    className={`darwin-focus-ring darwin-nav-link relative flex items-center gap-1.5 overflow-hidden rounded-lg border px-3 py-2 text-sm font-medium ${
                      isMoreActive
                        ? 'border-emerald-500/35 text-emerald-200'
                        : 'border-transparent text-label-secondary hover:border-separator/80 hover:bg-surface-3/70 hover:text-label-primary'
                    }`}
                  >
                    {isMoreActive ? (
                      <motion.span
                        layoutId="desktop-nav-active-pill"
                        transition={spring.snappy}
                        className="absolute inset-0 rounded-lg border border-emerald-500/35 bg-emerald-500/[0.16] shadow-inner-shine"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="relative z-[1]">Mais</span>
                    <ChevronDown className={`relative z-[1] h-4 w-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {moreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={spring.snappy}
                        className="absolute right-0 z-dropdown mt-2 w-64 overflow-hidden rounded-2xl border border-separator/80 bg-surface-1/90 p-1 shadow-elevation-4 backdrop-blur-xl"
                        role="menu"
                      >
                        <div className="py-1">
                          {moreNavItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                aria-current={active ? 'page' : undefined}
                                className={`darwin-focus-ring darwin-nav-link relative flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-sm ${
                                  active
                                    ? 'text-emerald-200'
                                    : 'text-label-secondary hover:bg-surface-3/70 hover:text-label-primary'
                                }`}
                              >
                                {active ? (
                                  <motion.span
                                    layoutId="desktop-nav-more-active"
                                    transition={spring.snappy}
                                    className="absolute inset-0 rounded-xl bg-emerald-500/[0.16]"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                <Icon className="relative z-[1] h-4 w-4" />
                                <span className="relative z-[1]">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              {user ? (
                <UserMenu user={user} />
              ) : (
                <>
                  {pathname === '/login' ? null : (
                    <Link
                      href="/login"
                      className="darwin-focus-ring darwin-nav-link hidden rounded-lg px-2 py-1 text-sm text-label-secondary hover:text-label-primary sm:block"
                    >
                      Entrar
                    </Link>
                  )}
                  {pathname === '/signup' ? null : (
                    <Link
                      href="/signup"
                      className="darwin-focus-ring darwin-nav-link hidden rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 sm:block"
                    >
                      Criar Conta
                    </Link>
                  )}
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="darwin-focus-ring rounded-lg border border-transparent p-2 text-label-quaternary transition-colors hover:border-separator/70 hover:bg-surface-3/65 hover:text-label-primary md:hidden"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="mx-auto max-w-7xl">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring.snappy}
                className="darwin-panel-strong mt-2 overflow-hidden rounded-2xl md:hidden"
                role="menu"
              >
                <div className="space-y-1 px-4 py-4">
                  {mobileItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`darwin-focus-ring darwin-nav-link relative flex items-center gap-3 overflow-hidden rounded-lg px-4 py-3 text-sm font-medium ${
                          active
                            ? 'text-emerald-200'
                            : 'text-label-secondary hover:bg-surface-3/70 hover:text-label-primary'
                        }`}
                      >
                        {active ? (
                          <motion.span
                            layoutId="mobile-nav-active-row"
                            transition={spring.snappy}
                            className="absolute inset-0 rounded-lg bg-emerald-500/[0.14]"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Icon className="relative z-[1] h-5 w-5" />
                        <span className="relative z-[1]">{item.label}</span>
                      </Link>
                    )
                  })}
                  <div className="mt-4 space-y-2 border-t border-separator pt-4">
                    <ThemeToggle showLabels />
                    {user ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setMobileMenuOpen(false)
                          await handleSignOut()
                        }}
                        className="darwin-focus-ring darwin-nav-link inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/10 px-4 py-3 text-center font-medium text-rose-200 transition-colors hover:bg-rose-500/15"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Encerrar sessão
                      </button>
                    ) : (
                      <>
                        {pathname === '/login' ? null : (
                          <Link
                            href="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="darwin-focus-ring block rounded-lg px-4 py-3 text-center text-label-secondary transition-colors hover:bg-surface-3/70 hover:text-label-primary"
                          >
                            Entrar
                          </Link>
                        )}
                        {pathname === '/signup' ? null : (
                          <Link
                            href="/signup"
                            onClick={() => setMobileMenuOpen(false)}
                            className="darwin-focus-ring block rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-3 text-center font-medium text-white shadow-elevation-1 shadow-inner-shine transition-all hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98]"
                          >
                            Criar Conta
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}
