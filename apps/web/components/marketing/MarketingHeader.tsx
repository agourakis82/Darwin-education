'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Menu, X } from 'lucide-react'

const marketingLinks = [
  { href: '/features', label: 'Funcionalidades' },
  { href: '/precos', label: 'Planos' },
  { href: '/institucional', label: 'Institucional' },
  { href: '/sobre', label: 'Sobre' },
]

export function MarketingHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-sticky px-3 pt-2 md:px-4 md:pt-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-14 items-center justify-between rounded-2xl border-[0.5px] border-separator/35 bg-secondary-system-background/92 px-4 shadow-ios-modal backdrop-blur-material-chrome sm:px-5 lg:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darwin-emerald/50"
          >
            <BrandLogo variant="horizontal" size="md" priority />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Marketing">
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-ios-fast ${
                  isActive(link.href)
                    ? 'bg-darwin-emerald/10 text-darwin-emerald'
                    : 'text-secondary-label hover:bg-system-gray-5/50 hover:text-label'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-secondary-label transition-colors duration-ios-fast hover:bg-system-gray-5/50 hover:text-label sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-darwin-emerald px-4 py-2 text-sm font-semibold text-white shadow-ios-button transition-all duration-ios-fast hover:bg-darwin-emerald/90 active:scale-[0.96]"
            >
              Começar Grátis
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-tertiary-label transition-colors duration-ios-fast hover:bg-system-gray-5/50 hover:text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darwin-emerald/50 md:hidden"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="mx-auto max-w-7xl mt-2 md:hidden">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden rounded-2xl border-[0.5px] border-separator/30 bg-secondary-system-background/95 shadow-ios-modal backdrop-blur-material-thick"
            >
              <div className="py-2">
                {marketingLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 mx-2 px-4 py-3 text-base font-medium rounded-xl transition-colors duration-ios-fast ${
                      isActive(link.href)
                        ? 'bg-darwin-emerald/10 text-darwin-emerald'
                        : 'text-label hover:bg-tertiary-system-background'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mx-2 mt-2 border-t-[0.5px] border-separator/20 pt-2 space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-center text-label transition-colors duration-ios-fast hover:bg-tertiary-system-background"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl bg-darwin-emerald px-4 py-3 text-center font-semibold text-white shadow-ios-button transition-all duration-ios-fast hover:bg-darwin-emerald/90 active:scale-[0.98]"
                  >
                    Criar Conta
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
