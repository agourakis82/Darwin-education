import Link from 'next/link'
import { BookMarked, ExternalLink } from 'lucide-react'

import { formatBibliographyEntry, type BibliographyEntry } from '@/lib/references/bibliography'

export function BibliographyBlock({
  title = 'Referências',
  entries,
}: {
  title?: string
  entries: BibliographyEntry[]
}) {
  if (!entries || entries.length === 0) return null

  return (
    <div className="rounded-2xl border border-separator bg-surface-2/50 p-4">
      <div className="flex items-center gap-2 text-label-primary font-semibold">
        <BookMarked className="h-4 w-4" />
        {title}
      </div>
      <ol className="mt-3 space-y-2 text-sm text-label-secondary">
        {entries.map((entry, idx) => {
          const text = formatBibliographyEntry(entry)
          return (
            <li key={entry.id} className="flex gap-2">
              <span className="text-label-tertiary">{idx + 1}.</span>
              <div className="min-w-0">
                <p className="break-words">{text}</p>
                {entry.url ? (
                  <Link
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:underline"
                  >
                    Abrir referência <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

