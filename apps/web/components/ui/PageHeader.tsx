import { type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  action?: ReactNode
  backHref?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  backHref,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-4" />}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-3 hover:bg-surface-4 text-label-secondary hover:text-label-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-label-primary">{title}</h1>
            {description && (
              <p className="mt-1 text-label-secondary">{description}</p>
            )}
          </div>
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
