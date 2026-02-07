'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { CaseStudyData } from '@/lib/hooks/useCaseStudy'

interface CaseStudyCardProps {
  data: CaseStudyData
  cached?: boolean
  remaining?: number
  onNewCase: () => void
}

export function CaseStudyCard({ data, cached, remaining, onNewCase }: CaseStudyCardProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="space-y-6">
      {/* Case Summary */}
      <div className="bg-surface-1 border border-separator rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Apresentação do Caso</h3>
        </div>
        <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">
          {data.case_summary}
        </p>
      </div>

      {/* Question */}
      <div className="bg-surface-1 border border-emerald-800/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-emerald-400">Pergunta</h3>
        </div>
        <p className="text-white text-base leading-relaxed mb-4">{data.question}</p>

        {/* User Answer Input */}
        {!revealed && (
          <div className="space-y-3">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Escreva sua resposta aqui..."
              rows={4}
              className="w-full bg-surface-2 border border-separator rounded-lg p-3 text-sm text-white placeholder:text-label-tertiary focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => setRevealed(true)}
              disabled={userAnswer.trim().length === 0}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Revelar Resposta
            </Button>
          </div>
        )}
      </div>

      {/* Revealed Section */}
      {revealed && (
        <>
          {/* User answer recap */}
          <div className="bg-surface-2/50 border border-separator rounded-xl p-5">
            <h4 className="text-sm font-medium text-label-secondary mb-2">Sua Resposta</h4>
            <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">
              {userAnswer}
            </p>
          </div>

          {/* Ideal Answer */}
          <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-800/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-emerald-400">Resposta Ideal</h3>
            </div>
            <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">
              {data.ideal_answer}
            </p>
          </div>

          {/* Red Flags & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Red Flags */}
            {data.red_flags && data.red_flags.length > 0 && (
              <div className="bg-red-900/10 border border-red-800/40 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-red-400">Sinais de Alerta</h4>
                </div>
                <ul className="space-y-2">
                  {data.red_flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-label-primary">
                      <span className="text-red-400 mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {data.next_steps && data.next_steps.length > 0 && (
              <div className="bg-cyan-900/10 border border-cyan-800/40 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <h4 className="text-sm font-semibold text-cyan-400">Próximos Passos</h4>
                </div>
                <ol className="space-y-2">
                  {data.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-label-primary">
                      <span className="text-cyan-400 font-medium mt-0.5">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Meta + New Case */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-label-tertiary">
              {cached && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Cache</span>
              )}
              {remaining != null && <span>{remaining} crédito(s) restante(s)</span>}
            </div>
            <Button variant="outline" size="sm" onClick={onNewCase}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Novo Caso Clínico
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
