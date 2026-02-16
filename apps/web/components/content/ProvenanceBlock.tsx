import { Info } from 'lucide-react'

import { getDarwinMfcProvenance } from '@/lib/darwinMfc/provenance'

function shortSha(value?: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 10)
}

export function ProvenanceBlock({
  lastUpdate,
}: {
  lastUpdate: string | null
}) {
  const meta = getDarwinMfcProvenance()

  const timestamp = meta.timestamp_utc || null
  const submoduleCommit = shortSha(meta.submodule_commit || undefined)
  const repoCommit = shortSha(meta.repo_commit || undefined)

  return (
    <div
      data-testid="provenance-block"
      className="rounded-2xl border border-separator bg-surface-2/50 p-4 text-sm text-label-secondary"
    >
      <div data-testid="provenance-title" className="flex items-center gap-2 text-label-primary font-semibold">
        <Info className="h-4 w-4" />
        Proveniência
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Fonte</dt>
          <dd className="mt-1 text-label-secondary">Darwin‑MFC (registro interno)</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Atualização da entrada</dt>
          <dd className="mt-1 text-label-secondary">{lastUpdate || 'Não informado'}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Snapshot (UTC)</dt>
          <dd className="mt-1 text-label-secondary">{timestamp || 'Não disponível'}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Commits</dt>
          <dd className="mt-1 text-label-secondary">
            {submoduleCommit ? `darwin‑MFC@${submoduleCommit}` : 'darwin‑MFC: n/d'}
            {repoCommit ? ` • repo@${repoCommit}` : null}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-label-tertiary">
        Conteúdo de estudo. Não substitui diretrizes oficiais nem decisão clínica.
      </p>
    </div>
  )
}
