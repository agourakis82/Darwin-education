'use client'

// ============================================================
// DDL - DIAGNOSTICO DIFERENCIAL DE LACUNAS
// Main DDL page integrated into Darwin Education
// ============================================================

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DDLQuestion } from '@/components/ddl/DDLQuestion'
import { DDLFeedback } from '@/components/ddl/DDLFeedback'
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
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (err) {
      setError('Erro ao carregar questoes')
      console.error(err)
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
      // 1. Save response
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
        throw new Error(errData.error || 'Failed to save response')
      }

      const { responseId: newResponseId } = await createRes.json()
      setResponseId(newResponseId)

      // 2. Trigger DDL analysis
      const analyzeRes = await fetch('/api/ddl/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: newResponseId }),
      })

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json()
        throw new Error(errData.error || errData.details || 'Analysis failed')
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
    const info: Record<LacunaType, { name: string; color: string; icon: string; description: string }> = {
      LE: {
        name: 'Lacuna Epistemica',
        color: 'bg-blue-500',
        icon: '📚',
        description: 'Ausencia de conhecimento - o conteudo ainda nao foi estudado ou consolidado',
      },
      LEm: {
        name: 'Lacuna Emocional',
        color: 'bg-purple-500',
        icon: '💭',
        description: 'Conhecimento presente mas inacessivel sob pressao ou ansiedade',
      },
      LIE: {
        name: 'Lacuna de Integracao',
        color: 'bg-orange-500',
        icon: '🔗',
        description: 'Conceitos isolados sem conexao - dificuldade em relacionar conhecimentos',
      },
      MIXED: {
        name: 'Lacunas Mistas',
        color: 'bg-gray-500',
        icon: '🔀',
        description: 'Combinacao de diferentes tipos de lacunas',
      },
      NONE: {
        name: 'Sem Lacunas',
        color: 'bg-green-500',
        icon: '✅',
        description: 'Resposta completa demonstrando dominio do conteudo',
      },
    }
    return info[type]
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Header */}
      <header className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Inicio</span>
          </Link>
          <div className="text-teal-400 font-medium">DDL</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Phase: Intro */}
        {phase === 'intro' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Diagnostico Diferencial de Lacunas
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Responda questoes dissertativas e receba um diagnostico personalizado
              sobre seus padroes de aprendizagem. O sistema analisa sua resposta
              e seu comportamento durante a escrita para identificar o tipo de lacuna.
            </p>

            {/* Lacuna Types Explanation */}
            <div className="grid md:grid-cols-3 gap-4 mb-10 text-left">
              {(['LE', 'LEm', 'LIE'] as LacunaType[]).map((type) => {
                const info = getLacunaInfo(type)
                return (
                  <div
                    key={type}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${info.color}`}>
                        {type}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mb-1">{info.name}</h3>
                    <p className="text-sm text-gray-400">{info.description}</p>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="px-8 py-3 bg-teal-600 text-white font-medium rounded-lg
                       hover:bg-teal-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Iniciar Diagnostico'}
            </button>
          </div>
        )}

        {/* Phase: Select Question */}
        {phase === 'select' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Selecione uma Questao</h2>
              <p className="text-gray-400 mt-1">
                Escolha uma questao dissertativa para responder
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-800 rounded-lg">
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-2" />
                    <div className="h-6 bg-gray-700 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-gray-400">Nenhuma questao disponivel.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg
                             hover:border-teal-500 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500">{q.question_code}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty_level)}`}>
                        Nivel {q.difficulty_level}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                        {q.discipline}
                      </span>
                    </div>
                    <p className="text-white">{q.question_text}</p>
                    <p className="text-sm text-gray-500 mt-1">Topico: {q.topic}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: Answer */}
        {phase === 'answer' && selectedQuestion && (
          <div>
            <button
              onClick={() => setPhase('select')}
              className="mb-4 text-sm text-teal-400 hover:text-teal-300 hover:underline"
            >
              ← Voltar para selecao
            </button>
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white">Analisando sua resposta...</h2>
            <p className="text-gray-400 mt-2">Este processo pode levar alguns segundos</p>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <p>📝 Extraindo conceitos da resposta</p>
              <p>🔗 Avaliando integracoes conceituais</p>
              <p>📊 Analisando padroes comportamentais</p>
              <p>🎯 Classificando tipo de lacuna</p>
            </div>
          </div>
        )}

        {/* Phase: Feedback */}
        {phase === 'feedback' && feedbackId && classification && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Seu Diagnostico</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors"
              >
                Nova Questao
              </button>
            </div>

            {/* Classification Summary */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-medium text-gray-300 mb-3">Classificacao Detectada</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {(['LE', 'LEm', 'LIE'] as LacunaType[]).map((type) => {
                  const info = getLacunaInfo(type)
                  const isActive = classification.type === type
                  return (
                    <div
                      key={type}
                      className={`p-3 rounded-lg transition-all ${
                        isActive
                          ? `${info.color.replace('bg-', 'bg-').replace('-500', '-900/50')} ring-2 ring-${info.color.split('-')[1]}-500`
                          : 'bg-gray-700/50'
                      }`}
                    >
                      <div className="text-2xl">{info.icon}</div>
                      <div className="font-medium text-white">{type}</div>
                      <div className="text-xs text-gray-400">{info.name.split(' ')[1]}</div>
                    </div>
                  )
                })}
              </div>
              {classification.type === 'NONE' && (
                <div className="mt-4 p-3 bg-green-900/30 rounded-lg text-center">
                  <span className="text-2xl">✅</span>
                  <p className="text-green-400 font-medium">Excelente! Nenhuma lacuna significativa detectada.</p>
                </div>
              )}
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-400">
                  Confianca: {classification.confidence} ({(classification.probability * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <DDLFeedback feedbackId={feedbackId} classification={classification} />

            {/* Action buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/trilhas"
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Ver Trilhas de Estudo
              </Link>
              <Link
                href="/"
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Voltar ao Inicio
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
