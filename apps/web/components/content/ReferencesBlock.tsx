import Link from 'next/link'
import { ExternalLink, BookMarked, AlertTriangle } from 'lucide-react'

import {
  formatDarwinReference,
  getDarwinReferenceUrl,
  resolveDarwinReference,
  type DarwinCitation,
} from '@/lib/darwinMfc/references'
import { isBlockedCitationRefId } from '@/lib/darwinMfc/blocked-sources'

function formatCitationLabel(citation: DarwinCitation) {
  const bits = [citation.page ? `p. ${citation.page}` : null, citation.note || null].filter(Boolean)
  return bits.length ? `(${bits.join(' — ')})` : null
}

function formatEvidenceLabel(citation: DarwinCitation) {
  const items = [
    citation.studyType ? `estudo: ${citation.studyType}` : null,
    citation.evidenceLevel ? `evidência: ${citation.evidenceLevel}` : null,
    citation.qualityScore !== undefined ? `qualidade: ${citation.qualityScore}/10` : null,
  ].filter(Boolean)

  if (items.length === 0) return null
  return items.join(' • ')
}

function hasEvidenceMetadata(citation: DarwinCitation) {
  return Boolean(
    citation.studyType || citation.evidenceLevel || citation.qualityScore != null || citation.limitations?.length
  )
}

export function ReferencesBlock({
  citations,
  emptyLabel = 'Sem referências bibliográficas registradas para esta entrada.',
  showTitle = true,
}: {
  citations: DarwinCitation[]
  emptyLabel?: string
  showTitle?: boolean
}) {
  if (!citations || citations.length === 0) {
    return (
      <div
        data-testid="references-block"
        className="rounded-2xl border border-separator bg-surface-2/50 p-4 text-sm text-label-secondary"
      >
        {showTitle ? (
          <div data-testid="references-title" className="flex items-center gap-2 text-label-primary font-semibold">
            <BookMarked className="h-4 w-4" />
            Referências
          </div>
        ) : null}
        <p className="mt-2">{emptyLabel}</p>
      </div>
    )
  }

  const blockedCount = citations.filter((citation) => isBlockedCitationRefId(citation.refId)).length
  const visibleCitations = citations.filter((citation) => !isBlockedCitationRefId(citation.refId))

  if (visibleCitations.length === 0) {
    const suffix = blockedCount > 0 ? ` (${blockedCount} fonte(s) proprietária(s) omitida(s))` : ''
    return (
      <div
        data-testid="references-block"
        className="rounded-2xl border border-separator bg-surface-2/50 p-4 text-sm text-label-secondary"
      >
        {showTitle ? (
          <div data-testid="references-title" className="flex items-center gap-2 text-label-primary font-semibold">
            <BookMarked className="h-4 w-4" />
            Referências
          </div>
        ) : null}
        <p className="mt-2">
          {emptyLabel}
          {suffix}
        </p>
      </div>
    )
  }

  const resolved = visibleCitations.map((citation) => {
    const ref = resolveDarwinReference(citation.refId)
    return {
      citation,
      ref,
      url: ref ? getDarwinReferenceUrl(ref) : null,
      text: ref ? formatDarwinReference(ref) : citation.refId,
    }
  })

  const dedupedResolved = []
  const seen = new Set<string>()

  for (const item of resolved) {
    const key = `${(item.citation.refId || '').trim().toLowerCase()}|${item.citation.page?.trim() || ''}|${
      item.citation.note?.trim() || ''
    }`
    if (seen.has(key)) continue
    seen.add(key)
    dedupedResolved.push(item)
  }

  const missingCount = dedupedResolved.filter((item) => !item.ref).length
  const missingEvidenceCount = dedupedResolved.filter((item) => item.ref && !hasEvidenceMetadata(item.citation)).length

  return (
    <div data-testid="references-block" className="rounded-2xl border border-separator bg-surface-2/50 p-4">
      {showTitle ? (
        <div className="flex items-center justify-between gap-3">
          <div data-testid="references-title" className="flex items-center gap-2 text-label-primary font-semibold">
            <BookMarked className="h-4 w-4" />
            Referências
          </div>
          <div className="flex items-center gap-2">
            {blockedCount > 0 ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-500/35 bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                {blockedCount} omitidas
              </div>
            ) : null}
            {missingCount > 0 ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                {missingCount} sem metadados
              </div>
            ) : null}
            {missingEvidenceCount > 0 ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-blue-500/35 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-200">
                <BookMarked className="h-3.5 w-3.5" />
                {missingEvidenceCount} sem evidência estruturada
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ol className="mt-3 space-y-2 text-sm text-label-secondary">
        {dedupedResolved.map(({ citation, ref, url, text }, idx) => {
          const label = formatCitationLabel(citation)
              return (
                <li key={`${citation.refId}-${idx}`} className="flex gap-2">
                  <span className="text-label-tertiary">{idx + 1}.</span>
                  <div className="min-w-0">
                    <p className="break-words text-label-secondary">
                      {text}
                      {label ? <span className="text-label-tertiary"> {label}</span> : null}
                    </p>
                    {formatEvidenceLabel(citation) ? (
                      <p className="mt-1 text-[11px] text-label-tertiary">{formatEvidenceLabel(citation)}</p>
                    ) : null}
                    {ref && url ? (
                      <Link
                        href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:underline"
                  >
                    Abrir fonte <ExternalLink className="h-3.5 w-3.5" />
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
