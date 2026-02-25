'use client'

import { useState } from 'react'
import { Check, Lightbulb, BarChart3, BookOpen, Dice5, Loader2, Star, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/lib/hooks/useToast'
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
  const { error: toastError, success: toastSuccess } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [difficulty, setDifficulty] = useState(2)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [showResults, setShowResults] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationError(null)
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
      toastSuccess(`Questão gerada com sucesso sobre ${topic.title}.`)
    } catch (error) {
      console.error('Error generating questions:', error)
      const message = 'Erro ao gerar questões. Tente novamente.'
      setGenerationError(message)
      toastError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  if (showResults && generatedQuestions.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Questão Gerada sobre {topic.title}</span>
            <Button
              variant="tinted"
              size="sm"
              onClick={() => {
                setShowResults(false)
                setGeneratedQuestions([])
              }}
            >
              Gerar Outra
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {generatedQuestions.map((q) => (
            <div key={q.id} className="space-y-4">
              {/* Question Stem */}
              <div className="p-4 bg-surface-2/50 rounded-lg">
                <p className="text-label-secondary text-sm mb-2">Questão</p>
                <p className="text-label-primary leading-relaxed">{q.stem}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-label-secondary text-sm">Alternativas</p>
                {q.options.map((opt) => (
                  <label
                    key={opt.letter}
                    className="flex gap-3 p-3 bg-surface-2/50 rounded-lg cursor-pointer hover:bg-surface-2 transition-colors"
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
              <div className="flex gap-4 text-sm text-label-secondary p-3 bg-surface-2/30 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Bloom: <span className="text-label-primary">{q.bloomLevel}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Dificuldade: <span className="text-label-primary">Nível {q.difficulty}</span>
                </span>
              </div>

              {/* Explanation */}
              <details className="p-3 bg-surface-2/30 rounded-lg cursor-pointer hover:bg-surface-2/50 transition-colors">
                <summary className="font-medium text-label-primary flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Ver Explicação
                </summary>
                <p className="mt-3 text-label-primary leading-relaxed">{q.explanation}</p>
              </details>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  fullWidth
                  leftIcon={<Star className="w-4 h-4" />}
                  className="from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700"
                >
                  Marcar como Favorita
                </Button>
                <Button
                  fullWidth
                  leftIcon={<Heart className="w-4 h-4" />}
                >
                  Adicionar ao Flashcard
                </Button>
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
          <Dice5 className="w-5 h-5" /> Gerar Questões sobre {topic.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-label-primary">
          Use o gerador de questões IA para criar questões práticas sobre este tópico.
          A IA será instruída a gerar questões contextualizadas com base no conteúdo teórico que você acabou de estudar.
        </p>
        {generationError && (
          <div className="rounded-lg border border-red-700/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            <p>{generationError}</p>
            <Button
              variant="bordered"
              size="sm"
              className="mt-3"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-label-primary mb-2">
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
          <p className="text-sm text-label-secondary mt-1">{quantity} questão(ões)</p>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-label-primary mb-2">
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
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-label-secondary mt-2">
            Recomendado: Nível {
              topic.difficulty === 'basico' ? '2-3' :
              topic.difficulty === 'intermediario' ? '3-4' :
              '4-5'
            } para {topic.title}
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          loading={isGenerating}
          leftIcon={!isGenerating ? <Dice5 className="w-4 h-4" /> : undefined}
          fullWidth
          size="lg"
          className="from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {isGenerating ? 'Gerando questões...' : `Gerar ${quantity} Questão${quantity > 1 ? 's' : ''}`}
        </Button>

        {/* Info */}
        <div className="p-3 bg-blue-900/20 text-blue-300 rounded-lg text-sm">
          <p className="font-medium mb-1 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Dica:</p>
          <p>Após gerar as questões, você pode resolvê-las e depois voltar ao conteúdo teórico para consolidar o aprendizado.</p>
        </div>
      </CardContent>
    </Card>
  )
}
