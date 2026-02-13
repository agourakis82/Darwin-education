import { Info } from 'lucide-react'

type TheoryTopicMeta = {
  id: string
  topic_id: string | null
  version: number | null
  status: string | null
  source_type?: string | null
  source_disease_id?: string | null
  validation_score?: number | null
  generated_at?: string | null
  last_updated?: string | null
  published_at?: string | null
  updated_at?: string | null
}

function formatTimestamp(value?: string | null) {
  if (!value) return 'Não informado'
  return value
}

export function TheoryProvenanceBlock({
  source,
  meta,
}: {
  source: 'supabase' | 'fallback'
  meta?: TheoryTopicMeta | null
}) {
  const status = meta?.status || (source === 'fallback' ? 'fallback' : 'n/d')
  const version = meta?.version ?? null

  return (
    <div
      data-testid="theory-provenance-block"
      className="rounded-2xl border border-separator bg-surface-2/50 p-4 text-sm text-label-secondary"
    >
      <div data-testid="theory-provenance-title" className="flex items-center gap-2 text-label-primary font-semibold">
        <Info className="h-4 w-4" />
        Proveniência
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Fonte</dt>
          <dd className="mt-1 text-label-secondary">
            {source === 'supabase' ? 'Supabase (theory_topics_generated)' : 'Conteúdo local (fallback)'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Status • Versão</dt>
          <dd className="mt-1 text-label-secondary">
            {status}
            {version ? ` • v${version}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Gerado em</dt>
          <dd className="mt-1 text-label-secondary">{formatTimestamp(meta?.generated_at ?? null)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Atualizado em</dt>
          <dd className="mt-1 text-label-secondary">
            {formatTimestamp(meta?.updated_at ?? meta?.last_updated ?? null)}
          </dd>
        </div>
        {meta?.source_type ? (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Origem</dt>
            <dd className="mt-1 text-label-secondary">{meta.source_type}</dd>
          </div>
        ) : null}
        {meta?.source_disease_id ? (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Fonte (Doença)</dt>
            <dd className="mt-1 text-label-secondary">{meta.source_disease_id}</dd>
          </div>
        ) : null}
        {typeof meta?.validation_score === 'number' ? (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Score de validação</dt>
            <dd className="mt-1 text-label-secondary">{meta.validation_score.toFixed(2)}</dd>
          </div>
        ) : null}
        {meta?.published_at ? (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-label-tertiary">Publicado em</dt>
            <dd className="mt-1 text-label-secondary">{formatTimestamp(meta.published_at)}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs text-label-tertiary">
        Conteúdo educativo. Não substitui diretrizes oficiais nem decisão clínica.
      </p>
    </div>
  )
}

