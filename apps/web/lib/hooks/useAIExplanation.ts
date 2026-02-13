'use client'

import { useState, useCallback } from 'react'

export interface AIExplanationResult {
  text: string
  cached: boolean
  tokensUsed: number | null
  costBRL: number | null
  remaining: number | null
  resetAt: string | null
}

interface UseAIExplanationReturn {
  explanation: AIExplanationResult | null
  loading: boolean
  error: string | null
  fetchExplanation: (params: ExplanationParams) => Promise<void>
  reset: () => void
}

interface ExplanationParams {
  stem: string
  options: { letter: string; text: string }[]
  correctIndex: number
  selectedIndex?: number
}

export function useAIExplanation(): UseAIExplanationReturn {
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExplanation = useCallback(async (params: ExplanationParams) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem: params.stem,
          options: params.options,
          correctIndex: params.correctIndex,
          selectedIndex: params.selectedIndex,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 429) {
          setError(
            `Créditos de IA esgotados. Reinicia em: ${
              errorData.resetAt
                ? new Date(errorData.resetAt).toLocaleString('pt-BR')
                : 'amanhã'
            }`
          )
          return
        }

        if (response.status === 401) {
          setError('Faça login para usar explicações com IA.')
          return
        }

        setError(errorData.message || errorData.error || 'Erro ao buscar explicação.')
        return
      }

      const data = await response.json()

      setExplanation({
        text: data.text,
        cached: data.cached ?? false,
        tokensUsed: data.tokensUsed ?? null,
        costBRL: data.costBRL ?? null,
        remaining: data.remaining ?? null,
        resetAt: data.resetAt ?? null,
      })
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setExplanation(null)
    setError(null)
    setLoading(false)
  }, [])

  return { explanation, loading, error, fetchExplanation, reset }
}
