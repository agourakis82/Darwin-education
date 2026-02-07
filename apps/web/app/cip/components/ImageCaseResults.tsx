'use client'

import { useState } from 'react'
import { Check, X, AlertTriangle, ChevronDown } from 'lucide-react'
import type {
  CIPImageScore,
  CIPImageCase,
  ImageStepResult,
} from '@darwin-education/shared'
import { IMAGE_MODALITY_LABELS_PT } from '@darwin-education/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ImageCaseResultsProps {
  score: CIPImageScore
  imageCase: CIPImageCase
}

function StepTeachingCard({ result }: { result: ImageStepResult }) {
  const [expanded, setExpanded] = useState(!result.correct)

  const isFindings = result.step === 'findings'
  const partial = result.partialCredit ?? 0
  const statusIcon = result.correct
    ? <Check className="w-3.5 h-3.5" />
    : isFindings && partial > 0
      ? '~'
      : <X className="w-3.5 h-3.5" />
  const statusBg = result.correct
    ? 'bg-green-500'
    : isFindings && partial > 0
      ? 'bg-yellow-500'
      : 'bg-red-500'

  const summaryText = result.correct
    ? `Correto — ${result.correctOptionText || result.correctAnswer}`
    : `Você: ${result.selectedOptionText || result.selectedAnswer} | Correto: ${result.correctOptionText || result.correctAnswer}`

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 ${statusBg}`}
        >
          {statusIcon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{result.label}</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(result.weightedScore * 100)}% / {Math.round(result.weight * 100)}%
            </span>
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {summaryText}
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {!result.correct && result.selectedOptionText && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <div className="text-xs font-medium text-red-400 mb-1">
                Sua resposta
              </div>
              <div className="text-sm text-red-200">
                {result.selectedOptionText}
              </div>
              {result.selectedExplanation && (
                <p className="text-xs text-red-300/80 mt-2">
                  {result.selectedExplanation}
                </p>
              )}
            </div>
          )}

          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
            <div className="text-xs font-medium text-green-400 mb-1">
              Resposta correta
            </div>
            <div className="text-sm text-green-200">
              {result.correctOptionText || (
                Array.isArray(result.correctAnswer)
                  ? result.correctAnswer.join(', ')
                  : result.correctAnswer
              )}
            </div>
            {result.correctExplanation && (
              <p className="text-xs text-green-300/80 mt-2">
                {result.correctExplanation}
              </p>
            )}
          </div>

          {result.clinicalPearl && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
              <div className="text-xs font-medium text-blue-400 mb-1">
                Pérola Clínica
              </div>
              <p className="text-xs text-blue-300/80">
                {result.clinicalPearl}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ImageCaseResults({ score, imageCase }: ImageCaseResultsProps) {
  const modalityLabel =
    IMAGE_MODALITY_LABELS_PT[imageCase.modality] || imageCase.modality

  const structured = imageCase.structuredExplanation

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  score.passed ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {score.scaledScore}
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {Math.round(score.percentageCorrect)}%
              </div>
              <div className="text-xs text-muted-foreground">Acerto</div>
            </div>
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  score.passed ? 'text-green-500' : 'text-yellow-500'
                }`}
              >
                {score.passed ? <Check className="w-8 h-8 mx-auto" /> : <X className="w-8 h-8 mx-auto" />}
              </div>
              <div className="text-xs text-muted-foreground">
                {score.passed ? 'Aprovado' : 'Não Aprovado'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {modalityLabel}
              </div>
              <div className="text-xs text-muted-foreground">Modalidade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Teaching Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Desempenho por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {score.stepResults.map((stepResult) => (
              <StepTeachingCard key={stepResult.step} result={stepResult} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Structured Explanation: Key Findings */}
      {structured?.keyFindings && structured.keyFindings.length > 0 && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-purple-400">
              Achados-Chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {structured.keyFindings.map((finding, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-purple-400 mt-0.5">→</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Structured Explanation: Systematic Approach */}
      {structured?.systematicApproach && (
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-cyan-400">
              Abordagem Sistemática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {structured.systematicApproach}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Common Mistakes */}
      {structured?.commonMistakes && structured.commonMistakes.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-400">
              Erros Comuns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {structured.commonMistakes.map((mistake, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Clinical Correlation */}
      {structured?.clinicalCorrelation && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-400">
              Correlação Clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {structured.clinicalCorrelation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {score.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.insights.map((insight, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Overall Explanation */}
      {imageCase.explanationPt && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-400">
              Explicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {imageCase.explanationPt}
            </p>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {structured?.references && structured.references.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">
              Referências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {structured.references.map((ref, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {i + 1}. {ref}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
