'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Puzzle, Layers, BarChart3 } from 'lucide-react'

const bottomNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/simulado', label: 'Simulado', icon: ClipboardList },
  { href: '/cip', label: 'CIP', icon: Puzzle },
  { href: '/flashcards', label: 'Cards', icon: Layers },
  { href: '/desempenho', label: 'Stats', icon: BarChart3 },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-sticky md:hidden bg-surface-1/95 backdrop-blur-xl border-t border-separator"
      style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)' }}
      aria-label="Navegação principal mobile"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-md transition-colors min-w-[56px] ${
                active
                  ? 'text-emerald-400'
                  : 'text-label-quaternary hover:text-label-secondary'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-emerald-400" aria-hidden="true" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
