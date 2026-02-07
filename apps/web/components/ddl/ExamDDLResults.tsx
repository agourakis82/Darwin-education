'use client'

// ============================================================
// EXAM DDL RESULTS COMPONENT
// Shows DDL analysis summary for an exam attempt
// ============================================================

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Target,
  BookOpen,
  MessageCircle,
  Link2,
  Shuffle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { LacunaType } from '@/lib/ddl/types'

interface ExamDDLSummary {
  total_ddl_questions: number
  analyzed_count: number
  le_count: number
  lem_count: number
  lie_count: number
  none_count: number
  avg_concept_coverage: number | null
  avg_integration_score: number | null
  avg_anxiety_score: number | null
  dominant_lacuna_type: LacunaType | null
}

interface DDLResponse {
  question_order: number
  ddl_question_id: string
  ddl_response_id: string
  ddl_questions: {
    question_code: string
    question_text: string
    topic: string
  }
  ddl_classification: {
    primary_lacuna_type: LacunaType
    primary_confidence: string
    primary_probability: number
  }[] | null
  ddl_feedback: {
    id: string
    feedback_type: LacunaType
  }[] | null
}

interface ExamDDLResultsProps {
  examAttemptId: string
}

const lacunaInfo: Record<LacunaType, { name: string; color: string; bgColor: string; icon: ReactNode }> = {
  LE: {
    name: 'Lacuna Epistemica',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
  },
  LEm: {
    name: 'Lacuna Emocional',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    icon: <MessageCircle className="w-5 h-5 text-purple-400" />,
  },
  LIE: {
    name: 'Lacuna de Integracao',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    icon: <Link2 className="w-5 h-5 text-orange-400" />,
  },
  MIXED: {
    name: 'Misto',
    color: 'text-label-secondary',
    bgColor: 'bg-surface-3/30',
    icon: <Shuffle className="w-5 h-5 text-label-secondary" />,
  },
  NONE: {
    name: 'Sem Lacunas',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
  },
}

export function ExamDDLResults({ examAttemptId }: ExamDDLResultsProps) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ExamDDLSummary | null>(null)
  const [responses, setResponses] = useState<DDLResponse[]>([])
  const [hasAnalysis, setHasAnalysis] = useState(false)

  const loadDDLResults = async () => {
    try {
      const res = await fetch(`/api/ddl/exam/${examAttemptId}`)
      if (!res.ok) {
        // DDL system may not be configured — silently hide the section
        console.warn('DDL API returned', res.status)
        setHasAnalysis(false)
        setLoading(false)
        return
      }

      const data = await res.json()

      if (data.data?.hasAnalysis) {
        setHasAnalysis(true)
        setSummary(data.data.summary)
        setResponses(data.data.responses || [])
      } else {
        setHasAnalysis(false)
      }
    } catch (err) {
      // Network or parse error — DDL is optional, just hide section
      console.warn('DDL unavailable:', err)
      setHasAnalysis(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDDLResults()
  }, [examAttemptId])

  if (loading) {
    return (
      <div className="bg-surface-2 rounded-lg shadow-elevation-1 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-3 rounded w-1/3 mb-4" />
          <div className="h-4 bg-surface-3 rounded w-2/3" />
        </div>
      </div>
    )
  }

  // DDL system not available or no DDL data for this exam — render nothing
  if (!hasAnalysis && !loading) {
    return null
  }

  if (!summary) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-2 rounded-lg shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-semibold text-label-primary">
            Diagnostico de Lacunas de Aprendizagem
          </h3>
        </div>

        {/* Classification Breakdown */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(['LE', 'LEm', 'LIE', 'NONE'] as LacunaType[]).map((type) => {
            const info = lacunaInfo[type]
            const count =
              type === 'LE' ? summary.le_count :
              type === 'LEm' ? summary.lem_count :
              type === 'LIE' ? summary.lie_count :
              summary.none_count
            const isActive = summary.dominant_lacuna_type === type
            const activeRingMap: Record<string, string> = {
              LE: 'ring-blue-500',
              LEm: 'ring-purple-500',
              LIE: 'ring-orange-500',
              NONE: 'ring-green-500',
            }

            return (
              <div
                key={type}
                className={`p-4 rounded-lg text-center transition-all ${
                  isActive ? `${info.bgColor} ring-2 ${activeRingMap[type]}` : 'bg-surface-3/50'
                }`}
              >
                <div className="flex justify-center mb-1">{info.icon}</div>
                <div className="text-2xl font-bold text-label-primary">{count}</div>
                <div className={`text-xs ${info.color}`}>{type}</div>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-surface-3/30 rounded-lg p-3">
            <div className="text-lg font-semibold text-label-primary">
              {summary.avg_concept_coverage
                ? `${(summary.avg_concept_coverage * 100).toFixed(0)}%`
                : '-'}
            </div>
            <div className="text-xs text-label-secondary">Cobertura Conceitual</div>
          </div>
          <div className="bg-surface-3/30 rounded-lg p-3">
            <div className="text-lg font-semibold text-label-primary">
              {summary.avg_integration_score
                ? `${(summary.avg_integration_score * 100).toFixed(0)}%`
                : '-'}
            </div>
            <div className="text-xs text-label-secondary">Score de Integracao</div>
          </div>
          <div className="bg-surface-3/30 rounded-lg p-3">
            <div className="text-lg font-semibold text-label-primary">
              {summary.analyzed_count}/{summary.total_ddl_questions}
            </div>
            <div className="text-xs text-label-secondary">Questoes Analisadas</div>
          </div>
        </div>

        {/* Dominant Pattern */}
        {summary.dominant_lacuna_type && summary.dominant_lacuna_type !== 'NONE' && (
          <div className={`mt-4 p-4 rounded-lg ${lacunaInfo[summary.dominant_lacuna_type].bgColor}`}>
            <div className="flex items-center gap-3">
              {lacunaInfo[summary.dominant_lacuna_type].icon}
              <div>
                <p className={`font-medium ${lacunaInfo[summary.dominant_lacuna_type].color}`}>
                  Padrao Dominante: {lacunaInfo[summary.dominant_lacuna_type].name}
                </p>
                <p className="text-sm text-label-secondary">
                  {summary.dominant_lacuna_type === 'LE' && 'Foque em consolidar os conceitos basicos antes de avancar.'}
                  {summary.dominant_lacuna_type === 'LEm' && 'Pratique tecnicas de gerenciamento de ansiedade durante provas.'}
                  {summary.dominant_lacuna_type === 'LIE' && 'Trabalhe em conectar os conceitos atraves de mapas mentais.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Responses */}
      {responses.length > 0 && (
        <div className="bg-surface-2 rounded-lg shadow-elevation-1 p-6">
          <h4 className="font-semibold text-label-primary mb-4">Detalhes por Questao</h4>
          <div className="space-y-3">
            {responses.map((response, idx) => {
              const classification = response.ddl_classification?.[0]
              const feedback = response.ddl_feedback?.[0]
              const lacuna = classification?.primary_lacuna_type || 'NONE'
              const info = lacunaInfo[lacuna]

              return (
                <div
                  key={response.ddl_response_id}
                  className="flex items-center gap-4 p-3 bg-surface-3/30 rounded-lg"
                >
                  <div className="w-8 h-8 bg-surface-4 rounded-full flex items-center justify-center text-sm font-medium text-label-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-label-primary truncate">
                      {response.ddl_questions.question_text}
                    </p>
                    <p className="text-xs text-label-secondary">
                      {response.ddl_questions.topic}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${info.bgColor}`}>
                    {info.icon}
                    <span className={`text-sm font-medium ${info.color}`}>{lacuna}</span>
                  </div>
                  {feedback && (
                    <Link
                      href={`/ddl/feedback/${feedback.id}`}
                      className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Ver Feedback
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-lg border border-emerald-800/50 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-label-primary mb-1">
              Continue seu diagnostico
            </h4>
            <p className="text-sm text-label-secondary">
              Use o DDL standalone para analisar respostas individuais e receber feedback detalhado.
            </p>
          </div>
          <Button asChild>
            <Link href="/ddl">Ir para DDL</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
