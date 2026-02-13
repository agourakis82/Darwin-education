'use client'

import { useState, useCallback } from 'react'

export interface CaseStudyData {
  case_summary: string
  question: string
  ideal_answer: string
  red_flags: string[]
  next_steps: string[]
}

export interface CaseStudyResult {
  text: string
  parsed: CaseStudyData | null
  cached: boolean
  remaining?: number
  tokensUsed?: number
  costBRL?: number
}

interface CaseStudyParams {
  area: string
  topic?: string
  difficulty?: string
}

export interface UseCaseStudyReturn {
  caseStudy: CaseStudyResult | null
  loading: boolean
  error: string | null
  fetchCaseStudy: (params: CaseStudyParams) => Promise<void>
  reset: () => void
}

export function useCaseStudy(): UseCaseStudyReturn {
  const [caseStudy, setCaseStudy] = useState<CaseStudyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCaseStudy = useCallback(async (params: CaseStudyParams) => {
    setLoading(true)
    setError(null)
    setCaseStudy(null)

    try {
      const res = await fetch('/api/ai/case-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (res.status === 401) {
        setError('Faça login para usar esta funcionalidade.')
        return
      }

      if (res.status === 429) {
        const data = await res.json()
        const resetAt = data.resetAt
          ? new Date(data.resetAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''
        setError(
          `Créditos de IA esgotados. Seus créditos serão renovados${resetAt ? ` às ${resetAt}` : ' em breve'}.`
        )
        return
      }

      if (res.status === 503) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Serviço de IA indisponível no momento.')
        return
      }

      if (!res.ok) {
        setError('Erro ao gerar caso clínico. Tente novamente.')
        return
      }

      const data = await res.json()
      setCaseStudy({
        text: data.text,
        parsed: data.parsed ?? null,
        cached: data.cached ?? false,
        remaining: data.remaining,
        tokensUsed: data.tokensUsed,
        costBRL: data.costBRL,
      })
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setCaseStudy(null)
    setError(null)
    setLoading(false)
  }, [])

  return { caseStudy, loading, error, fetchCaseStudy, reset }
}
