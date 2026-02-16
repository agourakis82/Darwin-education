import Link from 'next/link'
import { BookMarked, ExternalLink } from 'lucide-react'

type TheoryCitation = {
  section: string
  url: string
  title?: string | null
  source?: string | null
  evidence_level?: string | null
  publication_year?: number | null
  authors?: string | null
  journal?: string | null
  doi?: string | null
}

const SECTION_LABELS: Record<string, string> = {
  definition: 'Definição',
  epidemiology: 'Epidemiologia',
  pathophysiology: 'Fisiopatologia',
  clinicalPresentation: 'Apresentação clínica',
  clinical_presentation: 'Apresentação clínica',
  diagnosis: 'Diagnóstico',
  treatment: 'Tratamento',
  complications: 'Complicações',
  prognosis: 'Prognóstico',
  unknown: 'Geral',
}

function formatCitation(citation: TheoryCitation) {
  const parts: string[] = []
  if (citation.authors) parts.push(citation.authors)
  if (citation.publication_year) parts.push(String(citation.publication_year))
  if (citation.title) parts.push(citation.title)
  if (citation.journal) parts.push(citation.journal)
  if (citation.source && citation.source !== citation.journal) parts.push(citation.source)
  if (citation.doi) parts.push(`DOI: ${citation.doi}`)
  if (citation.evidence_level && citation.evidence_level !== 'unknown') parts.push(`Nível: ${citation.evidence_level}`)
  return parts.join('. ').replaceAll('..', '.').trim()
}

function groupBySection(citations: TheoryCitation[]) {
  const groups: Record<string, TheoryCitation[]> = {}
  for (const citation of citations) {
    const key = citation.section || 'unknown'
    groups[key] = groups[key] || []
    groups[key].push(citation)
  }
  return groups
}

export function TheoryReferencesBlock({
  citations,
  fallbackReferences,
}: {
  citations?: TheoryCitation[]
  fallbackReferences?: string[] | null
}) {
  const normalizedCitations = (citations || []).filter((c) => c.url)
  const hasCitations = normalizedCitations.length > 0
  const hasFallback = Boolean(fallbackReferences && fallbackReferences.length > 0)

  if (!hasCitations && !hasFallback) {
    return (
      <div
        data-testid="theory-references-block"
        className="rounded-2xl border border-separator bg-surface-2/50 p-4 text-sm text-label-secondary"
      >
        <div data-testid="theory-references-title" className="flex items-center gap-2 text-label-primary font-semibold">
          <BookMarked className="h-4 w-4" />
          Referências
        </div>
        <p className="mt-2">Sem referências bibliográficas registradas para este tópico.</p>
      </div>
    )
  }

  if (hasCitations) {
    const groups = groupBySection(normalizedCitations)
    const orderedSections = Object.keys(groups).sort((a, b) => a.localeCompare(b))

    return (
      <div data-testid="theory-references-block" className="rounded-2xl border border-separator bg-surface-2/50 p-4">
        <div data-testid="theory-references-title" className="flex items-center gap-2 text-label-primary font-semibold">
          <BookMarked className="h-4 w-4" />
          Referências
        </div>
        <div className="mt-3 space-y-4">
          {orderedSections.map((sectionKey) => {
            const list = groups[sectionKey] || []
            const label = SECTION_LABELS[sectionKey] || sectionKey
            return (
              <div key={sectionKey}>
                <p className="text-xs uppercase tracking-[0.08em] text-label-tertiary">{label}</p>
                <ol className="mt-2 space-y-2 text-sm text-label-secondary">
                  {list.map((citation, idx) => (
                    <li key={`${citation.url}-${idx}`} className="flex gap-2">
                      <span className="text-label-tertiary">{idx + 1}.</span>
                      <div className="min-w-0">
                        <p className="break-words">{formatCitation(citation) || citation.url}</p>
                        <Link
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:underline"
                        >
                          Abrir fonte <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div data-testid="theory-references-block" className="rounded-2xl border border-separator bg-surface-2/50 p-4">
      <div data-testid="theory-references-title" className="flex items-center gap-2 text-label-primary font-semibold">
        <BookMarked className="h-4 w-4" />
        Referências
      </div>
      <ol className="mt-3 space-y-2 text-sm text-label-secondary">
        {(fallbackReferences || []).map((reference, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-label-tertiary">{idx + 1}.</span>
            <span className="break-words">{reference}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

