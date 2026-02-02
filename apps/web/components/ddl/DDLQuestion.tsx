'use client'

// ============================================================
// DDL QUESTION COMPONENT
// Questao dissertativa com captura comportamental
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
      setError('Por favor, forneca uma resposta mais completa (minimo 10 caracteres).')
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
    <div className="ddl-question p-6 bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 text-xs font-medium bg-emerald-900/50 text-emerald-400 rounded">
            {discipline}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded">
            {topic}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-white leading-relaxed">
          {questionText}
        </h2>
      </div>

      {/* Response Area */}
      <div className="mb-4">
        <label
          htmlFor={`response-${questionId}`}
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Sua Resposta
        </label>
        <textarea
          id={`response-${questionId}`}
          rows={8}
          className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg
                     text-white placeholder-slate-500
                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                     resize-none transition-colors"
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
          <p className="text-sm text-slate-400">
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
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
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
      <p className="mt-3 text-xs text-slate-500 text-center">
        Sua resposta sera analisada para identificar oportunidades de aprendizado
      </p>
    </div>
  )
}

export default DDLQuestion
