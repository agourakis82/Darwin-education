'use client'

import type { CIPImageScore, CIPImageCase } from '@darwin-education/shared'
import { IMAGE_MODALITY_LABELS_PT } from '@darwin-education/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ImageCaseResultsProps {
  score: CIPImageScore
  imageCase: CIPImageCase
}

export function ImageCaseResults({ score, imageCase }: ImageCaseResultsProps) {
  const modalityLabel =
    IMAGE_MODALITY_LABELS_PT[imageCase.modality] || imageCase.modality

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
                {score.passed ? '✓' : '✗'}
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

      {/* Step-by-Step Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Desempenho por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {score.stepResults.map((stepResult) => {
              const percentage = Math.round(stepResult.weightedScore * 100)
              const maxPercentage = Math.round(stepResult.weight * 100)

              return (
                <div key={stepResult.step} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                          stepResult.correct
                            ? 'bg-green-500'
                            : stepResult.partialCredit && stepResult.partialCredit > 0
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      >
                        {stepResult.correct
                          ? '✓'
                          : stepResult.partialCredit && stepResult.partialCredit > 0
                            ? '~'
                            : '✗'}
                      </span>
                      <span className="font-medium">{stepResult.label}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {percentage}% / {maxPercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stepResult.correct
                          ? 'bg-green-500'
                          : stepResult.partialCredit && stepResult.partialCredit > 0
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{
                        width: `${stepResult.weight > 0 ? (stepResult.weightedScore / stepResult.weight) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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

      {/* Explanation */}
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
    </div>
  )
}
