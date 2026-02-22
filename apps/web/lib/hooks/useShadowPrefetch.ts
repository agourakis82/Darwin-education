// ============================================================
// SHADOW PRE-FETCHING HOOK
// Background pre-fetching of next question for zero-latency transitions
// ============================================================

'use client'

import { useCallback, useRef, useState } from 'react'
import type { ENAMEDQuestion, CATConfig } from '@darwin-education/shared'

interface PrefetchState {
  isPrefetching: boolean
  error: string | null
}

interface UseShadowPrefetchReturn {
  isPrefetching: boolean
  prefetchError: string | null
  prefetchNextQuestion: (params: {
    sessionId: string
    attemptId: string
    config?: CATConfig
  }) => Promise<ENAMEDQuestion | null>
}

/**
 * useShadowPrefetch - Pre-fetches the next question while user reviews current answer.
 *
 * This eliminates visible latency between questions by fetching the next item
 * in the background during the feedback/review phase.
 */
export function useShadowPrefetch(): UseShadowPrefetchReturn {
  const [state, setState] = useState<PrefetchState>({
    isPrefetching: false,
    error: null,
  })

  // Use ref to prevent duplicate in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  const prefetchNextQuestion = useCallback(
    async ({
      sessionId,
      attemptId,
      config,
    }: {
      sessionId: string
      attemptId: string
      config?: CATConfig
    }): Promise<ENAMEDQuestion | null> => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setState({ isPrefetching: true, error: null })

      try {
        const response = await fetch('/api/cat/prefetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            attemptId,
            config,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to prefetch next question')
        }

        const data = await response.json()

        if (data.isComplete) {
          // No more questions, test is complete
          return null
        }

        // Set safe defaults for fields stripped by the API
        const nextQuestion: ENAMEDQuestion = {
          ...data.question,
          correctIndex: -1,
          explanation: '',
        }

        setState({ isPrefetching: false, error: null })
        return nextQuestion
      } catch (error) {
        // Don't treat abort as an error
        if (error instanceof DOMException && error.name === 'AbortError') {
          return null
        }

        const errorMessage = error instanceof Error ? error.message : 'Prefetch failed'
        setState({ isPrefetching: false, error: errorMessage })
        console.warn('Shadow prefetch failed:', errorMessage)
        return null
      }
    },
    []
  )

  return {
    isPrefetching: state.isPrefetching,
    prefetchError: state.error,
    prefetchNextQuestion,
  }
}
