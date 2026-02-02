'use client'

// ============================================================
// DDL FEEDBACK DISPLAY COMPONENT
// Exibe feedback personalizado baseado no tipo de lacuna
// ============================================================

import { useEffect, useState } from 'react'
import type { FeedbackContent, LacunaType, ConfidenceLevel } from '@/lib/ddl/types'

interface DDLFeedbackProps {
  feedbackId: string
  classification: {
    type: LacunaType
    confidence: ConfidenceLevel
    probability: number
  }
  onRatingSubmit?: (rating: number, helpful: boolean, comments?: string) => void
}

const TYPE_CONFIG: Record<LacunaType, {
  color: string
  bgColor: string
  borderColor: string
  icon: string
  label: string
}> = {
  LE: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700',
    icon: '\uD83D\uDCDA',
    label: 'Lacuna Epistemica',
  },
  LEm: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700',
    icon: '\uD83D\uDCAD',
    label: 'Lacuna Emocional',
  },
  LIE: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-700',
    icon: '\uD83D\uDD17',
    label: 'Lacuna de Integracao',
  },
  MIXED: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700',
    icon: '\uD83D\uDD00',
    label: 'Lacunas Mistas',
  },
  NONE: {
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-700',
    icon: '\u2705',
    label: 'Resposta Adequada',
  },
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  LOW: 'Baixa',
  MODERATE: 'Moderada',
  HIGH: 'Alta',
  VERY_HIGH: 'Muito Alta',
}

export function DDLFeedback({
  feedbackId,
  classification,
  onRatingSubmit,
}: DDLFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [rating, setRating] = useState<number | null>(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  useEffect(() => {
    async function loadFeedback() {
      try {
        const res = await fetch(`/api/ddl/feedback/${feedbackId}`)
        if (!res.ok) {
          throw new Error('Failed to load feedback')
        }
        const data = await res.json()
        setFeedback(data.feedback_content)
      } catch (err) {
        console.error('Failed to load feedback:', err)
        setError('Nao foi possivel carregar o feedback.')
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [feedbackId])

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleRatingSubmit = async (selectedRating: number) => {
    setRating(selectedRating)
    setRatingSubmitted(true)

    if (onRatingSubmit) {
      onRatingSubmit(selectedRating, selectedRating >= 4)
    }

    try {
      await fetch(`/api/ddl/feedback/${feedbackId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          helpful: selectedRating >= 4,
        }),
      })
    } catch (err) {
      console.error('Failed to submit rating:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-800 rounded-lg border border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-700 rounded w-full mb-2" />
        <div className="h-4 bg-slate-700 rounded w-2/3" />
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="p-6 bg-slate-800 rounded-lg border border-red-700">
        <p className="text-red-400">{error || 'Feedback nao disponivel.'}</p>
      </div>
    )
  }

  const config = TYPE_CONFIG[classification.type] || TYPE_CONFIG.NONE

  return (
    <div className="ddl-feedback bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${config.bgColor} border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className={`font-semibold ${config.color}`}>
                {feedback.title}
              </h3>
              <span className="text-sm text-slate-400">
                {config.label} - {(classification.probability * 100).toFixed(0)}% confianca
              </span>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${config.bgColor} ${config.color}`}>
            {CONFIDENCE_LABELS[classification.confidence]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Greeting & Main Message */}
        <div>
          <p className="text-slate-300">{feedback.greeting}</p>
          <p className="mt-2 text-white font-medium">{feedback.main_message}</p>
        </div>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
              <span>\u2713</span> Pontos Fortes
            </h4>
            <ul className="space-y-1">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-green-500 mt-1">\u2022</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Growth */}
        {feedback.areas_for_growth && feedback.areas_for_growth.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-400 mb-2 flex items-center gap-2">
              <span>\u2191</span> Areas para Desenvolvimento
            </h4>
            <div className="space-y-2">
              {feedback.areas_for_growth.map((area, i) => (
                <div
                  key={i}
                  className="bg-amber-900/20 rounded-lg border border-amber-800/50"
                >
                  <button
                    onClick={() => toggleExpand(`growth-${i}`)}
                    className="flex items-center justify-between w-full p-3 text-left"
                  >
                    <span className="font-medium text-amber-300">
                      {area.area}
                    </span>
                    <span className="text-amber-400">
                      {expanded[`growth-${i}`] ? '\u2212' : '+'}
                    </span>
                  </button>
                  {expanded[`growth-${i}`] && (
                    <div className="px-3 pb-3 text-sm text-slate-300 border-t border-amber-800/30 pt-2">
                      <p>{area.explanation}</p>
                      <p className="mt-2 text-amber-300">
                        <strong>Sugestao:</strong> {area.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {feedback.action_items && feedback.action_items.length > 0 && (
          <div>
            <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
              <span>\uD83D\uDCCB</span> Proximos Passos
            </h4>
            <div className="space-y-2">
              {feedback.action_items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-800/50"
                >
                  <span className={`
                    px-2 py-0.5 text-xs font-medium rounded shrink-0
                    ${item.priority === 'high'
                      ? 'bg-red-900/50 text-red-400'
                      : item.priority === 'medium'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : 'bg-green-900/50 text-green-400'
                    }
                  `}>
                    {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baixa'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.action}</p>
                    <p className="text-sm text-slate-400 mt-1">{item.rationale}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      \u23F1 {item.estimated_time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {feedback.resources && feedback.resources.length > 0 && (
          <div>
            <h4 className="font-medium text-purple-400 mb-2 flex items-center gap-2">
              <span>\uD83D\uDCD6</span> Recursos Recomendados
            </h4>
            <div className="grid gap-2">
              {feedback.resources.map((resource, i) => (
                <div
                  key={i}
                  className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/50 flex items-center gap-3"
                >
                  <span className="text-purple-400">
                    {resource.type === 'concept_review' ? '\uD83D\uDCD6' :
                      resource.type === 'practice' ? '\u270F\uFE0F' : '\uD83E\uDDD8'}
                  </span>
                  <div>
                    <p className="font-medium text-purple-300">{resource.topic}</p>
                    <p className="text-sm text-slate-400">{resource.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement */}
        <div className="p-4 bg-green-900/20 rounded-lg border border-green-800/50">
          <p className="text-green-300">{feedback.encouragement}</p>
          <p className="mt-2 font-medium text-green-400">
            {feedback.next_steps}
          </p>
        </div>

        {/* Rating */}
        {!ratingSubmitted ? (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-3 text-center">
              Este feedback foi util para voce?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRatingSubmit(value)}
                  className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600
                           text-slate-300 hover:text-white transition-colors
                           flex items-center justify-center text-lg"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-700 text-center">
            <p className="text-sm text-green-400">
              Obrigado pelo seu feedback! Voce avaliou com {rating} estrelas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DDLFeedback
