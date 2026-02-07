'use client'

// ============================================================
// DDL FEEDBACK DISPLAY COMPONENT
// Exibe feedback personalizado baseado no tipo de lacuna
// ============================================================

import { useEffect, useState, type ReactNode } from 'react'
import {
  BookOpen,
  MessageCircle,
  Link2,
  Shuffle,
  CheckCircle2,
  Check,
  ArrowUp,
  ClipboardList,
  Timer,
  BookMarked,
  Pencil,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
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
  icon: ReactNode
  label: string
}> = {
  LE: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700',
    icon: <BookOpen className="w-6 h-6 text-blue-400" />,
    label: 'Lacuna Epistemica',
  },
  LEm: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700',
    icon: <MessageCircle className="w-6 h-6 text-purple-400" />,
    label: 'Lacuna Emocional',
  },
  LIE: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-700',
    icon: <Link2 className="w-6 h-6 text-orange-400" />,
    label: 'Lacuna de Integracao',
  },
  MIXED: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700',
    icon: <Shuffle className="w-6 h-6 text-amber-400" />,
    label: 'Lacunas Mistas',
  },
  NONE: {
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-700',
    icon: <CheckCircle2 className="w-6 h-6 text-green-400" />,
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
      <div className="p-6 bg-surface-2 rounded-lg border border-separator animate-pulse">
        <div className="h-6 bg-surface-3 rounded w-1/3 mb-4" />
        <div className="h-4 bg-surface-3 rounded w-full mb-2" />
        <div className="h-4 bg-surface-3 rounded w-2/3" />
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="p-6 bg-surface-2 rounded-lg border border-red-700">
        <p className="text-red-400">{error || 'Feedback nao disponivel.'}</p>
      </div>
    )
  }

  const config = TYPE_CONFIG[classification.type] || TYPE_CONFIG.NONE

  return (
    <div className="ddl-feedback bg-surface-2 rounded-lg border border-separator overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${config.bgColor} border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <h3 className={`font-semibold ${config.color}`}>
                {feedback.title}
              </h3>
              <span className="text-sm text-label-secondary">
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
          <p className="text-label-primary">{feedback.greeting}</p>
          <p className="mt-2 text-white font-medium">{feedback.main_message}</p>
        </div>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" /> Pontos Fortes
            </h4>
            <ul className="space-y-1">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-label-primary">
                  <span className="text-green-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
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
              <ArrowUp className="w-4 h-4" /> Areas para Desenvolvimento
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
                      {expanded[`growth-${i}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {expanded[`growth-${i}`] && (
                    <div className="px-3 pb-3 text-sm text-label-primary border-t border-amber-800/30 pt-2">
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
              <ClipboardList className="w-4 h-4" /> Proximos Passos
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
                    <p className="text-sm text-label-secondary mt-1">{item.rationale}</p>
                    <p className="text-xs text-label-tertiary mt-1 flex items-center gap-1">
                      <Timer className="w-3 h-3" /> {item.estimated_time}
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
              <BookMarked className="w-4 h-4" /> Recursos Recomendados
            </h4>
            <div className="grid gap-2">
              {feedback.resources.map((resource, i) => (
                <div
                  key={i}
                  className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/50 flex items-center gap-3"
                >
                  <span className="text-purple-400">
                    {resource.type === 'concept_review' ? <BookMarked className="w-5 h-5" /> :
                      resource.type === 'practice' ? <Pencil className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                  </span>
                  <div>
                    <p className="font-medium text-purple-300">{resource.topic}</p>
                    <p className="text-sm text-label-secondary">{resource.description}</p>
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
          <div className="pt-4 border-t border-separator">
            <p className="text-sm text-label-secondary mb-3 text-center">
              Este feedback foi util para voce?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRatingSubmit(value)}
                  className="w-10 h-10 rounded-full bg-surface-3 hover:bg-surface-4
                           text-label-primary hover:text-white transition-colors
                           flex items-center justify-center text-lg"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-separator text-center">
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
