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

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

export function CaseStudyCard({ data, cached, remaining, onNewCase }: CaseStudyCardProps) {
  const [selected, setSelected] = useState<number | null>(null)

  // Normalize: support both new MCQ schema and legacy schema
  const caso = data.caso ?? data.case_summary ?? ''
  const pergunta = data.pergunta ?? data.question ?? ''
  const alternativas = data.alternativas ?? []
  const respostaCorreta = data.resposta_correta ?? -1
  const explicacao = data.explicacao ?? data.ideal_answer ?? ''
  const sinaisAlerta = data.sinais_alerta ?? data.red_flags ?? []
  const proximosPassos = data.proximos_passos ?? data.next_steps ?? []

  const hasMCQ = alternativas.length === 4
  const revealed = selected !== null

  function handleSelect(idx: number) {
    if (revealed) return
    setSelected(idx)
  }

  function getOptionStyle(idx: number) {
    if (!revealed) {
      return 'border-separator hover:border-emerald-500/60 hover:bg-emerald-900/10 cursor-pointer'
    }
    if (idx === respostaCorreta) {
      return 'border-emerald-500 bg-emerald-900/20 cursor-default'
    }
    if (idx === selected) {
      return 'border-red-500 bg-red-900/20 cursor-default'
    }
    return 'border-separator opacity-50 cursor-default'
  }

  function getOptionLabel(idx: number) {
    if (!revealed) return null
    if (idx === respostaCorreta) return (
      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
    if (idx === selected && idx !== respostaCorreta) return (
      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
    return null
  }

  return (
    <div className="space-y-6">
      {/* Case Presentation */}
      <div className="bg-surface-1 border border-separator rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-label-primary">Apresentação do Caso</h3>
        </div>
        <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">{caso}</p>
      </div>

      {/* Question */}
      {pergunta && (
        <div className="bg-surface-1 border border-emerald-800/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-emerald-400">Questão</h3>
          </div>
          <p className="text-label-primary text-base leading-relaxed mb-5">{pergunta}</p>

          {/* MCQ Options */}
          {hasMCQ ? (
            <div className="space-y-3">
              {alternativas.map((alt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={revealed}
                  className={`w-full text-left flex items-start gap-3 border rounded-lg p-4 transition-all duration-150 ${getOptionStyle(idx)}`}
                >
                  <span className="font-bold text-sm text-label-secondary w-5 flex-shrink-0 mt-0.5">
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="text-sm text-label-primary flex-1">{alt.replace(/^[A-D]\.\s*/, '')}</span>
                  {getOptionLabel(idx)}
                </button>
              ))}
            </div>
          ) : (
            /* Legacy: no options — just show reveal button */
            !revealed && (
              <Button variant="filled" size="small" onClick={() => setSelected(0)}>
                Revelar Resposta
              </Button>
            )
          )}
        </div>
      )}

      {/* Result Section — shown after selection */}
      {revealed && (
        <>
          {/* Feedback banner */}
          {hasMCQ && (
            <div className={`rounded-xl p-4 border ${selected === respostaCorreta ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
              <p className={`font-semibold text-sm ${selected === respostaCorreta ? 'text-emerald-400' : 'text-red-400'}`}>
                {selected === respostaCorreta ? '✓ Correto!' : `✗ Incorreto — a resposta certa é ${OPTION_LETTERS[respostaCorreta]}`}
              </p>
            </div>
          )}

          {/* Explanation */}
          {explicacao && (
            <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-800/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-emerald-400">Explicação</h3>
              </div>
              <p className="text-label-primary text-sm leading-relaxed whitespace-pre-wrap">{explicacao}</p>
            </div>
          )}

          {/* Red Flags & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sinaisAlerta.length > 0 && (
              <div className="bg-red-900/10 border border-red-800/40 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-red-400">Sinais de Alerta</h4>
                </div>
                <ul className="space-y-2">
                  {sinaisAlerta.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-label-primary">
                      <span className="text-red-400 mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {proximosPassos.length > 0 && (
              <div className="bg-cyan-900/10 border border-cyan-800/40 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <h4 className="text-sm font-semibold text-cyan-400">Próximos Passos</h4>
                </div>
                <ol className="space-y-2">
                  {proximosPassos.map((step, i) => (
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
            <Button variant="bordered" size="small" onClick={onNewCase}>
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
