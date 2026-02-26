'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
import { MarketingHeader } from '@/components/marketing/MarketingHeader'

const MARKETING_ROUTES = ['/', '/features', '/precos', '/sobre']

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

// iOS-style spring animation
const iosSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

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

  // No navigation chrome on login/signup — fullscreen auth experience
  if (isAuthPage) return null

  // Render clean marketing header for unauthenticated visitors on public marketing pages
  if (MARKETING_ROUTES.includes(pathname) && !user) {
    return <MarketingHeader />
  }
  const desktopNavItems = primaryNavItems
  const mobileItems = allNavItems

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
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-system-blue focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Pular para o conteúdo
      </a>

      <motion.nav
        initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={iosSpring}
        className="sticky top-0 z-sticky px-3 pt-2 md:px-4 md:pt-3"
        aria-label="Navegação principal"
      >
        {/* Main Navigation Bar - iOS/macOS Chrome Style */}
        <div className="mx-auto max-w-7xl">
          <div className={`
            flex h-14 items-center justify-between px-4 sm:px-5 lg:px-6
            bg-secondary-system-background/92
            backdrop-blur-material-chrome
            rounded-2xl
            border-[0.5px] border-separator/35
            shadow-ios-modal
          `}>
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-blue/50"
            >
              <BrandLogo variant="horizontal" size="md" priority />
            </Link>

            {/* Desktop Navigation */}
            {desktopNavItems.length > 0 ? (
              <div 
                className="hidden items-center gap-1 rounded-xl bg-system-gray-6/50 p-1 md:flex" 
                role="menubar"
              >
                {desktopNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                      className={`
                        relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                        transition-all duration-ios-fast ease-ios
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-blue/50
                        ${active
                          ? 'text-darwin-emerald'
                          : 'text-secondary-label hover:text-label hover:bg-system-gray-5/50'
                        }
                      `}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active-pill"
                          transition={iosSpring}
                          className="absolute inset-0 rounded-lg bg-darwin-emerald/10"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  )
                })}
                
                {/* More Menu */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setMoreMenuOpen((open) => !open)}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="menu"
                    className={`
                      relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg
                      transition-all duration-ios-fast ease-ios
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-blue/50
                      ${isMoreActive
                        ? 'text-darwin-emerald'
                        : 'text-secondary-label hover:text-label hover:bg-system-gray-5/50'
                      }
                    `}
                  >
                    {isMoreActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={iosSpring}
                        className="absolute inset-0 rounded-lg bg-darwin-emerald/10"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">Mais</span>
                    <ChevronDown className={`relative z-10 w-4 h-4 transition-transform duration-ios-fast ${moreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {moreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={iosSpring}
                        className="
                          absolute right-0 z-dropdown mt-2 w-56 overflow-hidden
                          bg-secondary-system-background/95
                          backdrop-blur-material-thick
                          rounded-2xl
                          border-[0.5px] border-separator/30
                          shadow-ios-modal
                        "
                        role="menu"
                      >
                        <div className="py-2">
                          {moreNavItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                aria-current={active ? 'page' : undefined}
                                className={`
                                  flex items-center gap-3 px-4 py-2.5 text-sm
                                  transition-colors duration-ios-fast
                                  ${active
                                    ? 'text-darwin-emerald bg-darwin-emerald/10'
                                    : 'text-label hover:bg-tertiary-system-background'
                                  }
                                `}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
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

            {/* Right Side Actions */}
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
                      className="hidden px-3 py-2 text-sm font-medium text-secondary-label hover:text-label rounded-lg hover:bg-system-gray-5/50 transition-colors duration-ios-fast sm:block"
                    >
                      Entrar
                    </Link>
                  )}
                  {pathname === '/signup' ? null : (
                    <Link
                      href="/signup"
                      className="hidden px-4 py-2 text-sm font-semibold text-white bg-darwin-emerald rounded-xl shadow-ios-button hover:bg-darwin-emerald/90 active:scale-[0.96] transition-all duration-ios-fast sm:block"
                    >
                      Criar Conta
                    </Link>
                  )}
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="
                  flex items-center justify-center w-9 h-9 rounded-lg
                  text-tertiary-label
                  hover:text-label hover:bg-system-gray-5/50
                  transition-colors duration-ios-fast
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-blue/50
                  md:hidden
                "
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="mx-auto max-w-7xl mt-2 md:hidden">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={iosSpring}
                className="
                  overflow-hidden rounded-2xl
                  bg-secondary-system-background/95
                  backdrop-blur-material-thick
                  border-[0.5px] border-separator/30
                  shadow-ios-modal
                "
                role="menu"
              >
                <div className="py-2">
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
                        className={`
                          flex items-center gap-3 mx-2 px-4 py-3 text-base font-medium rounded-xl
                          transition-colors duration-ios-fast
                          ${active
                            ? 'text-darwin-emerald bg-darwin-emerald/10'
                            : 'text-label hover:bg-tertiary-system-background'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                  
                  <div className="mt-2 pt-2 mx-2 border-t-[0.5px] border-separator/20 space-y-2">
                    <div className="px-2">
                      <ThemeToggle showLabels />
                    </div>
                    {user ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setMobileMenuOpen(false)
                          await handleSignOut()
                        }}
                        className="
                          flex w-full items-center justify-center gap-2 
                          px-4 py-3 text-base font-medium 
                          text-system-red
                          hover:bg-system-red/10
                          rounded-xl
                          transition-colors duration-ios-fast
                        "
                      >
                        <LogOut className="w-5 h-5" aria-hidden="true" />
                        Encerrar sessão
                      </button>
                    ) : (
                      <>
                        {pathname === '/login' ? null : (
                          <Link
                            href="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="
                              block px-4 py-3 text-center text-label 
                              hover:bg-tertiary-system-background
                              rounded-xl
                              transition-colors duration-ios-fast
                            "
                          >
                            Entrar
                          </Link>
                        )}
                        {pathname === '/signup' ? null : (
                          <Link
                            href="/signup"
                            onClick={() => setMobileMenuOpen(false)}
                            className="
                              block px-4 py-3 text-center 
                              font-semibold text-white 
                              bg-darwin-emerald rounded-xl 
                              shadow-ios-button
                              hover:bg-darwin-emerald/90
                              active:scale-[0.98]
                              transition-all duration-ios-fast
                            "
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
