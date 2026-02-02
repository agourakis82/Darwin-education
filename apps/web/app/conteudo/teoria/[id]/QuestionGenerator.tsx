'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { TheoryTopic } from '@/lib/data/theory-content'

interface GeneratedQuestion {
  id: string;
  stem: string;
  options: { letter: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  bloomLevel: string;
}

interface QuestionGeneratorProps {
  topic: TheoryTopic;
}

export function QuestionGenerator({ topic }: QuestionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [difficulty, setDifficulty] = useState(2)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // Call QGen API with topic context
      const response = await fetch('/api/qgen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            targetArea: 'clinica_medica', // This would be mapped from topic.area
            targetTopic: topic.title,
            targetDifficulty: difficulty,
            targetBloomLevel: 'Application',
            targetQuestionType: 'clinical_case',
            quantity: quantity,
            contextualInfo: {
              topicId: topic.id,
              topicTitle: topic.title,
              keyPoints: topic.keyPoints,
              relatedTopics: topic.relatedDiseases || []
            }
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate questions')

      const data = await response.json()
      // Transform response to our format
      if (data.question) {
        setGeneratedQuestions([{
          id: data.question.id,
          stem: data.question.stem,
          options: Object.entries(data.question.alternatives || {}).map(([letter, text]) => ({
            letter,
            text: text as string
          })),
          correctAnswer: data.question.correctAnswer,
          explanation: data.question.explanation || '',
          difficulty: data.question.estimatedDifficulty || difficulty,
          bloomLevel: data.question.targetBloomLevel || 'Application'
        }])
      }
      setShowResults(true)
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Erro ao gerar questões. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (showResults && generatedQuestions.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>✅ Questão Gerada sobre {topic.title}</span>
            <button
              onClick={() => {
                setShowResults(false)
                setGeneratedQuestions([])
              }}
              className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              Gerar Outra
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {generatedQuestions.map((q) => (
            <div key={q.id} className="space-y-4">
              {/* Question Stem */}
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Questão</p>
                <p className="text-white leading-relaxed">{q.stem}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-slate-400 text-sm">Alternativas</p>
                {q.options.map((opt) => (
                  <label
                    key={opt.letter}
                    className="flex gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={opt.letter}
                      defaultChecked={opt.letter === q.correctAnswer}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold">{opt.letter})</span>
                      <span className="ml-2">{opt.text}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Metadata */}
              <div className="flex gap-4 text-sm text-slate-400 p-3 bg-slate-800/30 rounded-lg">
                <span>
                  💡 Bloom: <span className="text-slate-300">{q.bloomLevel}</span>
                </span>
                <span>
                  📊 Dificuldade: <span className="text-slate-300">Nível {q.difficulty}</span>
                </span>
              </div>

              {/* Explanation */}
              <details className="p-3 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                <summary className="font-medium text-slate-300 flex items-center gap-2">
                  <span>📖</span> Ver Explicação
                </summary>
                <p className="mt-3 text-slate-300 leading-relaxed">{q.explanation}</p>
              </details>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium">
                  Marcar como Favorita
                </button>
                <button className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium">
                  Adicionar ao Flashcard
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎲</span> Gerar Questões sobre {topic.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Use o gerador de questões IA para criar questões práticas sobre este tópico.
          A IA será instruída a gerar questões contextualizadas com base no conteúdo teórico que você acabou de estudar.
        </p>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantas questões deseja gerar?
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-slate-400 mt-1">{quantity} questão(ões)</p>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nível de Dificuldade
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  difficulty === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Recomendado: Nível {
              topic.difficulty === 'basico' ? '2-3' :
              topic.difficulty === 'intermediario' ? '3-4' :
              '4-5'
            } para {topic.title}
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Gerando questões...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🎲</span>
              Gerar {quantity} Questão{quantity > 1 ? 's' : ''}
            </span>
          )}
        </button>

        {/* Info */}
        <div className="p-3 bg-blue-900/20 text-blue-300 rounded-lg text-sm">
          <p className="font-medium mb-1">💡 Dica:</p>
          <p>Após gerar as questões, você pode resolvê-las e depois voltar ao conteúdo teórico para consolidar o aprendizado.</p>
        </div>
      </CardContent>
    </Card>
  )
}
