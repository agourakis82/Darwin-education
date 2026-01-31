'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { GeneratedQuestionData } from '@/lib/stores/questionGenStore'

const areaLabels: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const areaColors: Record<string, string> = {
  clinica_medica: 'bg-blue-500/20 text-blue-400',
  cirurgia: 'bg-red-500/20 text-red-400',
  ginecologia_obstetricia: 'bg-pink-500/20 text-pink-400',
  pediatria: 'bg-green-500/20 text-green-400',
  saude_coletiva: 'bg-purple-500/20 text-purple-400',
}

const difficultyLabels: Record<number, { label: string; color: string }> = {
  [-2]: { label: 'Muito Fácil', color: 'text-emerald-400' },
  [-1]: { label: 'Fácil', color: 'text-green-400' },
  [0]: { label: 'Médio', color: 'text-yellow-400' },
  [1]: { label: 'Difícil', color: 'text-orange-400' },
  [2]: { label: 'Muito Difícil', color: 'text-red-400' },
}

interface GeneratedQuestionPreviewProps {
  question: GeneratedQuestionData
  tokensUsed: number | null
  costBRL: number | null
  cached: boolean
  onSave: () => void
  onRegenerate: () => void
  saving: boolean
  saved: boolean
}

export function GeneratedQuestionPreview({
  question,
  tokensUsed,
  costBRL,
  cached,
  onSave,
  onRegenerate,
  saving,
  saved,
}: GeneratedQuestionPreviewProps) {
  const letters = ['A', 'B', 'C', 'D']
  const areaLabel = areaLabels[question.area] || question.area
  const areaColor = areaColors[question.area] || 'bg-slate-500/20 text-slate-400'

  return (
    <Card className="border-emerald-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle as="h3">Questão Gerada</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs rounded-full ${areaColor}`}>
              {areaLabel}
            </span>
            {cached && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
                Cache
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stem */}
        <div className="mb-6">
          <p className="text-white leading-relaxed">{question.stem}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isCorrect = index === question.correct_index
            const letter = option.letter || letters[index]

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-colors ${
                  isCorrect
                    ? 'border-emerald-600 bg-emerald-900/30'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      isCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {letter}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm ${isCorrect ? 'text-emerald-200' : 'text-slate-300'}`}>
                      {option.text}
                    </p>
                    {option.feedback && (
                      <p className="text-xs text-slate-500 mt-1 italic">{option.feedback}</p>
                    )}
                  </div>
                  {isCorrect && (
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2">Explicação</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{question.explanation}</p>
          </div>
        )}

        {/* IRT Parameters */}
        {question.irt && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-xs text-slate-500 mb-1">Dificuldade (b)</p>
              <p className={`text-lg font-bold ${getDifficultyColor(question.irt.difficulty)}`}>
                {question.irt.difficulty.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-xs text-slate-500 mb-1">Discriminação (a)</p>
              <p className="text-lg font-bold text-cyan-400">
                {question.irt.discrimination.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-xs text-slate-500 mb-1">Acerto Casual (c)</p>
              <p className="text-lg font-bold text-slate-300">
                {question.irt.guessing.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Cost/Token Info */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {tokensUsed != null && (
            <span>{tokensUsed.toLocaleString()} tokens</span>
          )}
          {costBRL != null && (
            <span>R$ {costBRL.toFixed(4)}</span>
          )}
          {question.topic && (
            <span>Tópico: {question.topic}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="primary"
          onClick={onSave}
          loading={saving}
          disabled={saved}
        >
          {saved ? 'Salvo no banco' : 'Salvar no banco de questões'}
        </Button>
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={saving}
        >
          Gerar outra
        </Button>
      </CardFooter>
    </Card>
  )
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty <= -1.5) return 'text-emerald-400'
  if (difficulty <= -0.5) return 'text-green-400'
  if (difficulty <= 0.5) return 'text-yellow-400'
  if (difficulty <= 1.5) return 'text-orange-400'
  return 'text-red-400'
}
