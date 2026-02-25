import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'

const platformLinks = [
  { href: '/features', label: 'Funcionalidades' },
  { href: '/precos', label: 'Planos' },
  { href: '/sobre', label: 'Sobre' },
]

const accountLinks = [
  { href: '/login', label: 'Entrar' },
  { href: '/signup', label: 'Criar Conta' },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-separator/40 bg-secondary-system-background/60 px-4 py-12 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <BrandLogo variant="horizontal" size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-secondary-label max-w-xs">
              Plataforma de preparação para o ENAMED com TRI, repetição espaçada e inteligência artificial.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-tertiary-label">Plataforma</p>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-label transition-colors duration-ios-fast hover:text-label"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-tertiary-label">Conta</p>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-label transition-colors duration-ios-fast hover:text-label"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-separator/30 pt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-tertiary-label">
            © 2026 Darwin Education · Preparação para o ENAMED
          </p>
          <p className="text-xs text-quaternary-label">
            Construído com evidência científica e psicometria avançada.
          </p>
        </div>
      </div>
    </footer>
  )
}
