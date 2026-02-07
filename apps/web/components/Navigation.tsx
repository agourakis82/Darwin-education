'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
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
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/simulado', label: 'Simulado', icon: ClipboardList },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/trilhas', label: 'Trilhas', icon: Map },
  { href: '/montar-prova', label: 'Montar Prova', icon: SlidersHorizontal },
  { href: '/gerar-questao', label: 'Gerar IA', icon: Lightbulb },
  { href: '/caso-clinico', label: 'Caso Clínico', icon: FileText },
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3 },
  { href: '/conteudo', label: 'Conteúdo', icon: BookOpen },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
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

      <nav
        className="sticky top-0 z-sticky bg-surface-1/80 backdrop-blur-xl border-b border-separator"
        style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)' }}
        aria-label="Navegação principal"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 rounded-lg">
              <span className="text-xl font-bold text-label-primary">
                Darwin <span className="gradient-text">Education</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1" role="menubar">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 ${
                      active
                        ? 'bg-emerald-500/[0.15] text-emerald-400'
                        : 'text-label-secondary hover:text-label-primary hover:bg-surface-3'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:block text-sm text-label-secondary hover:text-label-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2 py-1"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="hidden sm:block px-4 py-2 bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-elevation-1 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-medium rounded-md transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
              >
                Criar Conta
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-label-quaternary hover:text-label-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.snappy}
              className="md:hidden border-t border-separator bg-surface-1/95 backdrop-blur-xl overflow-hidden"
              role="menu"
            >
              <div className="px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        active
                          ? 'bg-emerald-500/[0.15] text-emerald-400'
                          : 'text-label-secondary hover:text-label-primary hover:bg-surface-3'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <div className="pt-4 border-t border-separator mt-4 space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-center text-label-secondary hover:text-label-primary transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-center bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-elevation-1 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 text-white font-medium rounded-md transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    Criar Conta
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
