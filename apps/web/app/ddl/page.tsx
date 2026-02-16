'use client'

// ============================================================
// DDL - DIAGNOSTICO DIFERENCIAL DE LACUNAS
// Main DDL page integrated into Darwin Education
// ============================================================

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Target,
  BookOpen,
  MessageCircle,
  Link2,
  Shuffle,
  CheckCircle2,
  FileText,
  BarChart3,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { Button } from '@/components/ui/Button'
import { DDLQuestion } from '@/components/ddl/DDLQuestion'
import { DDLFeedback } from '@/components/ddl/DDLFeedback'
import { FCRLacunaInsights } from '@/app/fcr/components/FCRLacunaInsights'
import type { LacunaType, ConfidenceLevel, BehavioralData } from '@/lib/ddl/types'

interface PilotQuestion {
  id: string
  question_code: string
  question_text: string
  discipline: string
  topic: string
  subtopic?: string
  difficulty_level: number
  cognitive_level?: string
}

interface ClassificationResult {
  type: LacunaType
  confidence: ConfidenceLevel
  probability: number
  secondary?: {
    type: LacunaType
    probability: number
  } | null
}

type DDLPhase = 'intro' | 'select' | 'answer' | 'analyzing' | 'feedback'

// Adaptive Question CTA Component
function AdaptiveQuestionCTA({ classification }: { classification: ClassificationResult }) {
  const [loading, setLoading] = useState(false)
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<{
    question: {
      stem: string
      options: Array<{ text: string; isCorrect: boolean }>
      explanation?: string
    }
    adaptiveRationale: string
    targetedMisconceptions: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateAdaptiveQuestion = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/qgen/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'current-user',
          ddlClassification: {
            primary_type: classification.type,
            primary_confidence: classification.confidence,
            confidence: classification.probability,
          },
          currentTheta: 0,
          preferences: {
            targetArea: 'clinica_medica',
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Falha ao gerar questão')
      }

      const data = await res.json()
      setAdaptiveQuestion(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (adaptiveQuestion) {
    return (
      <div className="mt-6 p-6 bg-indigo-900/30 border border-indigo-700 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <h3 className="text-lg font-semibold text-label-primary">Questão Adaptativa para Você</h3>
        </div>

        <p className="text-sm text-indigo-300 mb-4">{adaptiveQuestion.adaptiveRationale}</p>

        <div className="bg-surface-2/50 rounded-lg p-4 mb-4">
          <p className="text-label-primary mb-4">{adaptiveQuestion.question.stem}</p>
          <div className="space-y-2">
            {adaptiveQuestion.question.options.map((opt, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  opt.isCorrect
                    ? 'bg-green-900/30 border-green-700'
                    : 'bg-surface-3/50 border-surface-4'
                }`}
              >
                <span className="font-medium text-label-secondary mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className={opt.isCorrect ? 'text-green-300' : 'text-label-primary'}>{opt.text}</span>
              </div>
            ))}
          </div>
          {adaptiveQuestion.question.explanation && (
            <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-200">{adaptiveQuestion.question.explanation}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={generateAdaptiveQuestion}
          className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
        >
          Gerar outra questão
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-indigo-900/30 to-violet-900/30 border border-indigo-700/50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-label-primary mb-1">Pratique com Questões Adaptativas</h4>
          <p className="text-sm text-label-secondary">
            Com base no seu diagnóstico ({classification.type}), o QGen pode gerar questões
            personalizadas para ajudar a superar suas lacunas.
          </p>
        </div>
        <Button
          onClick={generateAdaptiveQuestion}
          disabled={loading}
          loading={loading}
          className="bg-indigo-600 hover:bg-indigo-500 from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500"
        >
          {loading ? 'Gerando...' : 'Gerar Questão'}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

export default function DDLPage() {
  const [phase, setPhase] = useState<DDLPhase>('intro')
  const [questions, setQuestions] = useState<PilotQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<PilotQuestion | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ddl/questions')
      if (!res.ok) throw new Error('Falha ao carregar questões')
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (err) {
      setError('Erro ao carregar questões')
      if (process.env.NODE_ENV !== 'production') console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    await loadQuestions()
    setPhase('select')
  }

  const handleSelectQuestion = (question: PilotQuestion) => {
    setSelectedQuestion(question)
    setPhase('answer')
    setError(null)
  }

  const handleSubmitResponse = async (data: { responseText: string; behavioralData: BehavioralData }) => {
    if (!selectedQuestion) return
    setPhase('analyzing')
    setError(null)

    try {
      const createRes = await fetch('/api/ddl/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          responseText: data.responseText,
          behavioralData: data.behavioralData,
        }),
      })

      if (!createRes.ok) {
        const errData = await createRes.json()
        throw new Error(errData.message || errData.error || 'Não foi possível salvar sua resposta. Tente novamente.')
      }

      const { responseId: newResponseId } = await createRes.json()
      setResponseId(newResponseId)

      const analyzeRes = await fetch('/api/ddl/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: newResponseId }),
      })

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json()
        throw new Error(
          errData.message ||
            errData.error ||
            errData.details ||
            'Falha ao analisar sua resposta. Tente novamente em alguns instantes.'
        )
      }

      const analysisResult = await analyzeRes.json()
      setFeedbackId(analysisResult.data.feedbackId)
      setClassification(analysisResult.data.classification)
      setPhase('feedback')

    } catch (err) {
      console.error('Error during submission:', err)
      setError((err as Error).message)
      setPhase('answer')
    }
  }

  const handleReset = () => {
    setPhase('select')
    setSelectedQuestion(null)
    setResponseId(null)
    setFeedbackId(null)
    setClassification(null)
    setError(null)
  }

  const getDifficultyColor = (level: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-900/50 text-green-400',
      2: 'bg-blue-900/50 text-blue-400',
      3: 'bg-yellow-900/50 text-yellow-400',
      4: 'bg-orange-900/50 text-orange-400',
      5: 'bg-red-900/50 text-red-400',
    }
    return colors[level] || colors[3]
  }

  const getLacunaInfo = (type: LacunaType) => {
    const info: Record<LacunaType, { name: string; color: string; icon: React.ReactNode; description: string }> = {
      LE: {
        name: 'Lacuna Epistêmica',
        color: 'bg-blue-500',
        icon: <BookOpen className="w-6 h-6 text-blue-400" />,
        description: 'Ausência de conhecimento — o conteúdo ainda não foi estudado ou consolidado',
      },
      LEm: {
        name: 'Lacuna Emocional',
        color: 'bg-purple-500',
        icon: <MessageCircle className="w-6 h-6 text-purple-400" />,
        description: 'Conhecimento presente, mas inacessível sob pressão ou ansiedade',
      },
      LIE: {
        name: 'Lacuna de Integração',
        color: 'bg-orange-500',
        icon: <Link2 className="w-6 h-6 text-orange-400" />,
        description: 'Conceitos isolados sem conexão — dificuldade em relacionar conhecimentos',
      },
      MIXED: {
        name: 'Lacunas mistas',
        color: 'bg-surface-5',
        icon: <Shuffle className="w-6 h-6 text-label-secondary" />,
        description: 'Combinação de diferentes tipos de lacunas',
      },
      NONE: {
        name: 'Sem lacunas',
        color: 'bg-green-500',
        icon: <CheckCircle2 className="w-6 h-6 text-green-400" />,
        description: 'Resposta completa demonstrando domínio do conteúdo',
      },
    }
    return info[type]
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
	      <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
	        <Image
	          src="/images/branding/ddl-hero-apple-v1.png"
	          alt="Visual de diagnóstico diferencial de lacunas"
	          fill
	          sizes="(max-width: 768px) 100vw, 1024px"
	          priority
	          className="object-cover object-center opacity-75"
	        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/30" />
        <div className="relative z-10 h-full flex items-end p-5 md:p-7">
          <div className="max-w-xl">
            <p className="text-xl md:text-2xl font-semibold text-label-primary">
              Diagnóstico de lacunas com contexto metacognitivo.
            </p>
            <p className="text-sm md:text-base text-label-secondary mt-1">
              Entenda o tipo de erro e receba recomendações direcionadas para evoluir.
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-400/35 bg-rose-500/12 p-4">
          <div className="flex items-center justify-between">
            <p className="text-label-primary">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-rose-200 hover:text-rose-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Intro */}
      {phase === 'intro' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-label-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-label-primary mb-4">
            Diagnóstico Diferencial de Lacunas
          </h1>
          <p className="text-label-secondary max-w-xl mx-auto mb-8">
            Responda questões dissertativas e receba um diagnóstico personalizado
            sobre seus padrões de aprendizagem. O sistema analisa sua resposta
            e seu comportamento durante a escrita para identificar o tipo de lacuna.
          </p>

          {/* Lacuna Types Explanation */}
          <AnimatedList className="grid md:grid-cols-3 gap-4 mb-10 text-left">
            {(['LE', 'LEm', 'LIE'] as LacunaType[]).map((type) => {
              const info = getLacunaInfo(type)
              return (
                <AnimatedItem key={type}>
                <div
                  className="p-4 bg-surface-2 rounded-lg shadow-elevation-1"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {info.icon}
                    <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${info.color}`}>
                      {type}
                    </span>
                  </div>
                  <h3 className="font-medium text-label-primary mb-1">{info.name}</h3>
                  <p className="text-sm text-label-secondary">{info.description}</p>
                </div>
                </AnimatedItem>
              )
            })}
          </AnimatedList>

          <Button
            size="lg"
            onClick={handleStart}
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Carregando...' : 'Iniciar Diagnóstico'}
          </Button>
        </div>
      )}

      {/* Phase: Select Question */}
      {phase === 'select' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-label-primary">Selecione uma Questão</h2>
            <p className="text-label-secondary mt-1">
              Escolha uma questão dissertativa para responder
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-surface-2 rounded-lg relative overflow-hidden">
                  <div className="h-4 bg-surface-3 rounded w-1/4 mb-2" />
                  <div className="h-6 bg-surface-3 rounded w-3/4" />
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 bg-surface-2 rounded-lg shadow-elevation-1">
              <p className="text-label-secondary">Nenhuma questão disponível.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className="w-full text-left p-4 bg-surface-2 rounded-lg shadow-elevation-1
                           hover:shadow-elevation-2 hover:bg-surface-3/80 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-label-tertiary">{q.question_code}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty_level)}`}>
                      Nível {q.difficulty_level}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-surface-3 text-label-secondary rounded">
                      {q.discipline}
                    </span>
                  </div>
                  <p className="text-label-primary">{q.question_text}</p>
                  <p className="text-sm text-label-tertiary mt-1">Tópico: {q.topic}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase: Answer */}
      {phase === 'answer' && selectedQuestion && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase('select')}
            className="mb-4 text-sm text-emerald-400 hover:text-emerald-300"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar para seleção
          </Button>
          <DDLQuestion
            questionId={selectedQuestion.id}
            questionText={selectedQuestion.question_text}
            discipline={selectedQuestion.discipline}
            topic={selectedQuestion.topic}
            onSubmit={handleSubmitResponse}
          />
        </div>
      )}

      {/* Phase: Analyzing */}
      {phase === 'analyzing' && (
        <div className="bg-surface-2 rounded-lg shadow-elevation-1 p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-label-primary">Analisando sua resposta...</h2>
          <p className="text-label-secondary mt-2">Este processo pode levar alguns segundos</p>
          <div className="mt-6 space-y-2 text-sm text-label-tertiary">
            <p className="flex items-center gap-2"><FileText className="w-4 h-4" /> Extraindo conceitos da resposta</p>
            <p className="flex items-center gap-2"><Link2 className="w-4 h-4" /> Avaliando integrações conceituais</p>
            <p className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Analisando padrões comportamentais</p>
            <p className="flex items-center gap-2"><Target className="w-4 h-4" /> Classificando tipo de lacuna</p>
          </div>
        </div>
      )}

      {/* Phase: Feedback */}
      {phase === 'feedback' && feedbackId && classification && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-label-primary">Seu Diagnóstico</h2>
            <Button onClick={handleReset}>
              Nova Questão
            </Button>
          </div>

          {/* Classification Summary */}
          <div className="mb-6 p-4 bg-surface-2 rounded-lg shadow-elevation-1">
            <h3 className="font-medium text-label-secondary mb-3">Classificação Detectada</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {(['LE', 'LEm', 'LIE'] as LacunaType[]).map((type) => {
                const info = getLacunaInfo(type)
                const isActive = classification.type === type
                const activeClassMap: Record<string, string> = {
                  LE: 'bg-blue-900/50 ring-2 ring-blue-500',
                  LEm: 'bg-purple-900/50 ring-2 ring-purple-500',
                  LIE: 'bg-orange-900/50 ring-2 ring-orange-500',
                }
                return (
                  <div
                    key={type}
                    className={`p-3 rounded-lg transition-all ${
                      isActive ? activeClassMap[type] : 'bg-surface-3/50'
                    }`}
                  >
                    <div className="flex justify-center">{info.icon}</div>
                    <div className="font-medium text-label-primary">{type}</div>
                    <div className="text-xs text-label-secondary">{info.name.split(' ')[1]}</div>
                  </div>
                )
              })}
            </div>
            {classification.type === 'NONE' && (
              <div className="mt-4 p-3 bg-green-900/30 rounded-lg text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <p className="text-green-400 font-medium">Excelente! Nenhuma lacuna significativa detectada.</p>
              </div>
            )}
            <div className="mt-4 text-center">
              <span className="text-sm text-label-secondary">
                Confiança: {classification.confidence} ({(classification.probability * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <DDLFeedback feedbackId={feedbackId} classification={classification} />

          {/* Adaptive Question CTA */}
          <AdaptiveQuestionCTA classification={classification} />

          {/* FCR-sourced lacuna insights (cross-system integration) */}
          <div className="mt-6">
            <FCRLacunaInsights />
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-500 from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500" asChild>
              <Link href="/qgen">Ir para QGen</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/trilhas">Ver Trilhas de Estudo</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Voltar ao Inicio</Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
