import type { StudyType } from '../../darwin-MFC/lib/types/evidence'
import type { Reference } from '../../darwin-MFC/lib/types/references'

type CitationLike = {
  refId: string
  evidenceLevel?: unknown
  studyType?: unknown
  qualityScore?: unknown
}

function normalizeText(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function hasAnyEvidenceMetadata(citation: CitationLike) {
  return Boolean(citation.studyType || citation.evidenceLevel || citation.qualityScore != null)
}

function textForInference(ref: Reference) {
  return normalizeText([ref.title, ref.note].filter(Boolean).join(' '))
}

export function inferStudyTypeFromReference(ref: Reference): StudyType | null {
  const text = textForInference(ref)

  // Most-specific first.
  if (/(meta[- ]?analysis|metaanalysis)/.test(text)) return 'MetaAnalysis'
  if (/(systematic review|revisao sistematica|revisao sistem[áa]tica)/.test(text)) return 'SystematicReview'
  if (/(randomi[sz]ed|randomizado|trial|ensaio)/.test(text)) return 'RCT'
  if (/(case[- ]?control)/.test(text)) return 'CaseControl'
  if (/(cross[- ]?sectional)/.test(text)) return 'CrossSectional'
  if (/(cohort)/.test(text)) return 'Cohort'
  if (/(case report)/.test(text)) return 'CaseReport'
  if (/(case series)/.test(text)) return 'CaseSeries'

  if (/(consensus|consenso|position statement|international consensus)/.test(text)) return 'Consensus'
  if (/(guideline|guidelines|diretriz|diretrizes|recommendation|recommendations|recomenda)/.test(text)) return 'Guideline'
  if (/(diagnostic criteria|criterios diagnosticos|crite?rios diagn[óo]sticos|classification)/.test(text)) return 'Guideline'

  // Fallbacks by declared reference type.
  if (ref.type === 'diretriz') return 'Guideline'
  if (ref.type === 'artigo') return 'ExpertOpinion'
  if (ref.type === 'relatorio') return 'ExpertOpinion'
  if (ref.type === 'livro') return 'ExpertOpinion'
  if (ref.type === 'site') return 'ExpertOpinion'
  if (ref.type === 'lei') return 'ExpertOpinion'
  if (ref.type === 'portaria') return 'ExpertOpinion'
  if (ref.type === 'nota_tecnica') return 'ExpertOpinion'

  return null
}

export function inferAndApplyCitationEvidenceInPlace(
  citation: unknown,
  resolveRef: (refId: string) => Reference | null
) {
  if (!citation || typeof citation !== 'object') return false
  const record = citation as Record<string, unknown>
  const rawRefId = typeof record.refId === 'string' ? record.refId : ''
  const refId = rawRefId.trim()
  if (!refId) return false

  record.refId = refId

  if (hasAnyEvidenceMetadata(record as CitationLike)) return false

  const ref = resolveRef(refId)
  if (!ref) return false

  const inferred = inferStudyTypeFromReference(ref)
  if (!inferred) return false

  record.studyType = inferred
  return true
}

export function addInferredEvidenceToCitationsInPlace(
  payload: unknown,
  resolveRef: (refId: string) => Reference | null
) {
  const walk = (value: unknown) => {
    if (!value) return
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }
    if (typeof value !== 'object') return

    const record = value as Record<string, unknown>
    for (const [k, v] of Object.entries(record)) {
      if (k === 'citations' && Array.isArray(v)) {
        for (const entry of v) {
          inferAndApplyCitationEvidenceInPlace(entry, resolveRef)
        }
        continue
      }
      walk(v)
    }
  }

  walk(payload)
}

