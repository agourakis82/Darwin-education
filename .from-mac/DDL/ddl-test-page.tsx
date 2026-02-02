'use client';

// ============================================================
// DDL TEST PAGE
// apps/web/src/app/ddl/test/page.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { DDLQuestion } from '@/components/ddl/DDLQuestion';
import { DDLFeedback } from '@/components/ddl/DDLFeedback';

interface PilotQuestion {
  id: string;
  question_code: string;
  question_text: string;
  discipline: string;
  topic: string;
  difficulty_level: number;
}

type TestPhase = 'select' | 'answer' | 'analyzing' | 'feedback';

export default function DDLTestPage() {
  const [phase, setPhase] = useState<TestPhase>('select');
  const [questions, setQuestions] = useState<PilotQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<PilotQuestion | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load pilot questions on mount
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch('/api/ddl/questions');
        if (!res.ok) throw new Error('Failed to load questions');
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError('Erro ao carregar questões piloto');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  // Handle question selection
  const handleSelectQuestion = (question: PilotQuestion) => {
    setSelectedQuestion(question);
    setPhase('answer');
    setError(null);
  };

  // Handle response submission
  const handleSubmitResponse = async (data: {
    responseText: string;
    behavioralData: any;
  }) => {
    if (!selectedQuestion) return;

    setPhase('analyzing');
    setError(null);

    try {
      // 1. Create response record
      const createRes = await fetch('/api/ddl/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          responseText: data.responseText,
          behavioralData: data.behavioralData,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || 'Failed to save response');
      }

      const { responseId: newResponseId } = await createRes.json();
      setResponseId(newResponseId);

      // 2. Trigger DDL analysis
      const analyzeRes = await fetch('/api/ddl/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: newResponseId }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const analysisResult = await analyzeRes.json();
      
      setFeedbackId(analysisResult.data.feedbackId);
      setClassification(analysisResult.data.classification);
      setPhase('feedback');

    } catch (err) {
      setError((err as Error).message);
      setPhase('answer'); // Allow retry
    }
  };

  // Reset to start
  const handleReset = () => {
    setPhase('select');
    setSelectedQuestion(null);
    setResponseId(null);
    setFeedbackId(null);
    setClassification(null);
    setError(null);
  };

  // Difficulty badge color
  const getDifficultyColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || colors[3];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            DDL - Diagnóstico Diferencial de Lacunas
          </h1>
          <p className="mt-2 text-gray-600">
            Sistema de análise semântica e comportamental para identificação de lacunas de aprendizagem
          </p>
          
          {/* Phase indicator */}
          <div className="mt-4 flex items-center gap-2">
            {['select', 'answer', 'analyzing', 'feedback'].map((p, i) => (
              <div key={p} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${phase === p 
                    ? 'bg-blue-600 text-white' 
                    : i < ['select', 'answer', 'analyzing', 'feedback'].indexOf(phase)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className={`w-12 h-1 ${
                    i < ['select', 'answer', 'analyzing', 'feedback'].indexOf(phase)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {phase === 'select' && 'Selecionar Questão'}
              {phase === 'answer' && 'Responder'}
              {phase === 'analyzing' && 'Analisando...'}
              {phase === 'feedback' && 'Feedback'}
            </span>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Phase: Select Question */}
        {phase === 'select' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Questões Piloto</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <p className="text-gray-500">Nenhuma questão piloto encontrada.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-400">
                        {q.question_code}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty_level)}`}>
                        Nível {q.difficulty_level}
                      </span>
                      <span className="text-xs text-gray-500">
                        {q.discipline}
                      </span>
                    </div>
                    <p className="text-gray-800">{q.question_text}</p>
                    <p className="text-sm text-gray-500 mt-1">Tópico: {q.topic}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: Answer Question */}
        {phase === 'answer' && selectedQuestion && (
          <div>
            <button
              onClick={() => setPhase('select')}
              className="mb-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              ← Voltar para seleção
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
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Analisando sua resposta...</h2>
            <p className="text-gray-600 mt-2">
              Processando análise semântica e comportamental
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <p>📝 Extraindo conceitos da resposta</p>
              <p>🔗 Avaliando integrações conceituais</p>
              <p>📊 Analisando padrões comportamentais</p>
              <p>🎯 Classificando tipo de lacuna</p>
            </div>
          </div>
        )}

        {/* Phase: Feedback */}
        {phase === 'feedback' && feedbackId && classification && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Resultado da Análise</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Nova Questão
              </button>
            </div>

            {/* Classification Summary */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
              <h3 className="font-medium text-gray-700 mb-3">Classificação</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className={`p-3 rounded-lg ${
                  classification.type === 'LE' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl">📚</div>
                  <div className="font-medium">LE</div>
                  <div className="text-xs text-gray-500">Epistêmica</div>
                </div>
                <div className={`p-3 rounded-lg ${
                  classification.type === 'LEm' ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl">💭</div>
                  <div className="font-medium">LEm</div>
                  <div className="text-xs text-gray-500">Emocional</div>
                </div>
                <div className={`p-3 rounded-lg ${
                  classification.type === 'LIE' ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl">🔗</div>
                  <div className="font-medium">LIE</div>
                  <div className="text-xs text-gray-500">Integração</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  Confiança: {classification.confidence} ({(classification.probability * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Detailed Feedback */}
            <DDLFeedback 
              feedbackId={feedbackId} 
              classification={classification}
            />
          </div>
        )}

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && responseId && (
          <div className="mt-8 p-4 bg-gray-800 text-gray-200 rounded-lg text-xs font-mono">
            <div>Response ID: {responseId}</div>
            <div>Feedback ID: {feedbackId}</div>
            <div>Classification: {JSON.stringify(classification)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
