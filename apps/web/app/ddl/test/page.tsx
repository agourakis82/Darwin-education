'use client'

// ============================================================
// DDL TEST PAGE
// Pagina de teste do sistema DDL
// ============================================================

import { useState, useEffect } from 'react'
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

type TestPhase = 'select' | 'answer' | 'analyzing' | 'feedback'

export default function DDLTestPage() {
  const [phase, setPhase] = useState<TestPhase>('select')
  const [questions, setQuestions] = useState<PilotQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<PilotQuestion | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch('/api/ddl/questions')
        if (!res.ok) throw new Error('Failed to load questions')
        const data = await res.json()
        setQuestions(data.questions || [])
      } catch (err) {
        setError('Erro ao carregar questoes piloto')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [])

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

      // 2. Trigger analysis
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

  const phaseLabels: Record<TestPhase, string> = {
    select: 'Selecionar Questao',
    answer: 'Responder',
    analyzing: 'Analisando...',
    feedback: 'Feedback',
  }

  const phases: TestPhase[] = ['select', 'answer', 'analyzing', 'feedback']
  const currentPhaseIndex = phases.indexOf(phase)

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            DDL - Diagnostico Diferencial de Lacunas
          </h1>
          <p className="mt-2 text-slate-400">
            Sistema de analise semantica e comportamental para identificacao de lacunas de aprendizagem
          </p>

          {/* Phase indicator */}
          <div className="mt-6 flex items-center gap-2">
            {phases.map((p, i) => (
              <div key={p} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    phase === p
                      ? 'bg-emerald-600 text-white'
                      : i < currentPhaseIndex
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < phases.length - 1 && (
                  <div
                    className={`w-12 h-1 ${
                      i < currentPhaseIndex ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
            <span className="ml-4 text-sm text-slate-400">
              {phaseLabels[phase]}
            </span>
          </div>
        </div>

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

        {/* Phase: Select */}
        {phase === 'select' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Questoes Piloto</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-1/4 mb-2" />
                    <div className="h-6 bg-slate-700 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Nenhuma questao piloto encontrada.</p>
                <p className="text-sm text-slate-500 mt-2">
                  Execute o seed SQL no Supabase para adicionar as questoes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left p-4 bg-slate-900 border border-slate-600 rounded-lg
                             hover:border-emerald-500 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-slate-500">{q.question_code}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty_level)}`}>
                        Nivel {q.difficulty_level}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                        {q.discipline}
                      </span>
                    </div>
                    <p className="text-white">{q.question_text}</p>
                    <p className="text-sm text-slate-400 mt-1">Topico: {q.topic}</p>
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
              className="mb-4 text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white">Analisando sua resposta...</h2>
            <p className="text-slate-400 mt-2">Processando analise semantica e comportamental</p>
            <div className="mt-6 space-y-2 text-sm text-slate-500">
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
              <h2 className="text-xl font-semibold text-white">Resultado da Analise</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors"
              >
                Nova Questao
              </button>
            </div>

            {/* Classification Summary */}
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <h3 className="font-medium text-slate-300 mb-3">Classificacao Detectada</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div
                  className={`p-3 rounded-lg transition-all ${
                    classification.type === 'LE'
                      ? 'bg-blue-900/50 ring-2 ring-blue-500'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="text-2xl">📚</div>
                  <div className="font-medium text-white">LE</div>
                  <div className="text-xs text-slate-400">Epistemica</div>
                </div>
                <div
                  className={`p-3 rounded-lg transition-all ${
                    classification.type === 'LEm'
                      ? 'bg-purple-900/50 ring-2 ring-purple-500'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="text-2xl">💭</div>
                  <div className="font-medium text-white">LEm</div>
                  <div className="text-xs text-slate-400">Emocional</div>
                </div>
                <div
                  className={`p-3 rounded-lg transition-all ${
                    classification.type === 'LIE'
                      ? 'bg-orange-900/50 ring-2 ring-orange-500'
                      : 'bg-slate-700/50'
                  }`}
                >
                  <div className="text-2xl">🔗</div>
                  <div className="font-medium text-white">LIE</div>
                  <div className="text-xs text-slate-400">Integracao</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm text-slate-400">
                  Confianca: {classification.confidence} ({(classification.probability * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <DDLFeedback feedbackId={feedbackId} classification={classification} />
          </div>
        )}

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && responseId && (
          <div className="mt-8 p-4 bg-slate-950 text-slate-400 rounded-lg text-xs font-mono">
            <div>Response ID: {responseId}</div>
            <div>Feedback ID: {feedbackId}</div>
            <div>Classification: {JSON.stringify(classification)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
