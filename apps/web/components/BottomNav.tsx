'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, ClipboardList, Puzzle, Layers, BarChart3 } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { spring } from '@/lib/motion'
import type { UserSummary } from '@/lib/auth/user'

const bottomNavItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/simulado', label: 'Simulado', icon: ClipboardList },
  { href: '/cip', label: 'CIP', icon: Puzzle },
  { href: '/flashcards', label: 'Flash', icon: Layers },
  { href: '/desempenho', label: 'Dados', icon: BarChart3 },
]

export function BottomNav({ user }: { user: UserSummary | null }) {
  const pathname = usePathname()

  if (!user) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-sticky px-3 pb-[max(env(safe-area-inset-bottom),0.55rem)] md:hidden"
      style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)' }}
      aria-label="Navegação principal mobile"
    >
      <div className="pointer-events-auto mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
          className="darwin-panel-strong flex h-16 items-center justify-around rounded-2xl px-1.5"
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`darwin-focus-ring darwin-nav-link relative flex min-w-[58px] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-3 py-1.5 ${
                  active
                    ? 'text-emerald-200'
                    : 'text-label-quaternary hover:bg-surface-3/70 hover:text-label-secondary'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-active-pill"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-xl bg-emerald-500/[0.14] shadow-inner-shine"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-[1]">
                  {item.href === '/' ? (
                    <BrandLogo variant="symbol" size="sm" />
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  )}
                </span>
                <span className="relative z-[1] text-[10px] font-medium">{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="bottom-nav-top-indicator"
                    className="absolute -top-[2px] h-1 w-7 rounded-full bg-emerald-400/90"
                    transition={spring.snappy}
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </motion.div>
      </div>
    </nav>
  )
}
