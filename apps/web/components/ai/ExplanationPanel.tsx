'use client'

import { Button } from '@/components/ui/Button'
import { useAIExplanation } from '@/lib/hooks/useAIExplanation'

interface ExplanationPanelProps {
  stem: string
  options: { letter: string; text: string }[]
  correctIndex: number
  selectedIndex?: number
  staticExplanation?: string
}

export function ExplanationPanel({
  stem,
  options,
  correctIndex,
  selectedIndex,
  staticExplanation,
}: ExplanationPanelProps) {
  const { explanation, loading, error, fetchExplanation, reset } = useAIExplanation()

  const handleFetch = () => {
    fetchExplanation({ stem, options, correctIndex, selectedIndex })
  }

  // Show static explanation first if available
  if (!explanation && staticExplanation && !loading) {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-emerald-400">Explicação</h4>
          <Button variant="ghost" size="sm" onClick={handleFetch}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Explicação com IA
          </Button>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{staticExplanation}</p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-emerald-500" />
          <span className="text-sm text-slate-400">Gerando explicação com IA...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-800/50">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={reset}
              className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // AI Explanation result
  if (explanation) {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 rounded-lg border border-emerald-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h4 className="text-sm font-medium text-emerald-400">Explicação com IA</h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {explanation.cached && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Cache</span>
            )}
            {explanation.remaining != null && (
              <span>{explanation.remaining} crédito(s)</span>
            )}
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {explanation.text}
        </p>
      </div>
    )
  }

  // Default: Button to request AI explanation
  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={handleFetch}>
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Explicação com IA
      </Button>
    </div>
  )
}
