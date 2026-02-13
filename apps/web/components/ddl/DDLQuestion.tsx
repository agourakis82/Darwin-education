'use client'

// ============================================================
// DDL QUESTION COMPONENT
// Questão dissertativa com captura comportamental
// ============================================================

import { useState, useCallback } from 'react'
import { useBehavioralCapture } from '@/lib/hooks/useBehavioralCapture'
import type { BehavioralData } from '@/lib/ddl/types'

interface DDLQuestionProps {
  questionId: string
  questionText: string
  discipline: string
  topic: string
  onSubmit: (data: {
    responseText: string
    behavioralData: BehavioralData
  }) => Promise<void>
  disabled?: boolean
}

export function DDLQuestion({
  questionId,
  questionText,
  discipline,
  topic,
  onSubmit,
  disabled = false,
}: DDLQuestionProps) {
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    isCapturing,
    startCapture,
    stopCapture,
    handlers,
  } = useBehavioralCapture()

  const handleTextareaFocus = useCallback(() => {
    if (!hasStarted && !disabled) {
      startCapture()
      setHasStarted(true)
    }
    handlers.onFocus()
  }, [hasStarted, disabled, startCapture, handlers])

  const handleSubmit = async () => {
    if (response.trim().length < 10) {
      setError('Por favor, forneça uma resposta mais completa (mínimo 10 caracteres).')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const behavioralData = stopCapture()

      await onSubmit({
        responseText: response,
        behavioralData,
      })
    } catch (err) {
      console.error('Submission error:', err)
      setError('Erro ao enviar resposta. Tente novamente.')
      // Restart capture if submission failed
      startCapture()
    } finally {
      setIsSubmitting(false)
    }
  }

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="ddl-question p-6 bg-surface-2 rounded-lg border border-separator">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 text-xs font-medium rounded border border-emerald-400/35 bg-emerald-500/12 text-emerald-200">
            {discipline}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded border border-separator/80 bg-surface-1/70 text-label-primary">
            {topic}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-label-primary leading-relaxed">
          {questionText}
        </h2>
      </div>

      {/* Response Area */}
      <div className="mb-4">
        <label
          htmlFor={`response-${questionId}`}
          className="block text-sm font-medium text-label-primary mb-2"
        >
          Sua Resposta
        </label>
        <textarea
          id={`response-${questionId}`}
          rows={8}
          className="darwin-focus-ring w-full resize-none rounded-xl border border-separator bg-surface-1/70 p-4 text-label-primary placeholder:text-label-quaternary transition-colors focus:border-emerald-400/45 focus:ring-emerald-400/70"
          placeholder="Digite sua resposta aqui..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onFocus={handleTextareaFocus}
          onBlur={handlers.onBlur}
          onKeyDown={handlers.onKeyDown}
          onScroll={handlers.onScroll}
          onPaste={handlers.onPaste}
          disabled={isSubmitting || disabled}
        />

        {/* Word count and status */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-label-secondary">
            {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
          </p>
          {isCapturing && (
            <div className="flex items-center text-sm text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Capturando dados
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || disabled || response.trim().length < 10}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all
          ${isSubmitting || disabled || response.trim().length < 10
            ? 'bg-surface-3 text-label-tertiary cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Analisando resposta...
          </span>
        ) : (
          'Enviar Resposta'
        )}
      </button>

      {/* Help text */}
      <p className="mt-3 text-xs text-label-tertiary text-center">
        Sua resposta será analisada para identificar oportunidades de aprendizado
      </p>
    </div>
  )
}

export default DDLQuestion
