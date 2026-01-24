'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { CIPScore, CIPSection } from '@darwin-education/shared'
import { CIP_SECTION_LABELS_PT, generateCIPInsights } from '@darwin-education/shared'

interface CIPResultsProps {
  score: CIPScore
  onRetry?: () => void
  onBackToList?: () => void
}

const sectionColors: Record<CIPSection, string> = {
  medical_history: 'bg-blue-500',
  physical_exam: 'bg-purple-500',
  laboratory: 'bg-amber-500',
  imaging: 'bg-cyan-500',
  pathology: 'bg-rose-500',
  treatment: 'bg-emerald-500',
}

export function CIPResults({ score, onRetry, onBackToList }: CIPResultsProps) {
  // Generate insights
  const insights = useMemo(() => generateCIPInsights(score), [score])

  // Sort sections by performance (worst first)
  const sortedSections = useMemo(() => {
    return (Object.keys(score.sectionBreakdown) as CIPSection[])
      .filter((s) => score.sectionBreakdown[s].total > 0)
      .sort((a, b) => score.sectionBreakdown[a].percentage - score.sectionBreakdown[b].percentage)
  }, [score])

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            {/* Score display */}
            <div className="relative inline-flex items-center justify-center">
              {/* Circular progress background */}
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="fill-none stroke-slate-700"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className={`fill-none ${score.passed ? 'stroke-emerald-500' : 'stroke-red-500'}`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score.scaledScore / 1000) * 440} 440`}
                />
              </svg>
              {/* Score text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{score.scaledScore}</span>
                <span className="text-sm text-slate-400">pontos</span>
              </div>
            </div>

            {/* Pass/Fail indicator */}
            <div className="mt-4">
              <span
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  ${
                    score.passed
                      ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
                      : 'bg-red-900/40 text-red-300 border border-red-700'
                  }
                `}
              >
                {score.passed ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Aprovado
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Não aprovado
                  </>
                )}
              </span>
            </div>

            {/* Summary stats */}
            <div className="flex justify-center gap-8 mt-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-semibold text-white">
                  {score.correctCount}/{score.totalCells}
                </div>
                <div className="text-slate-400">Acertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-white">
                  {Math.round(score.percentageCorrect)}%
                </div>
                <div className="text-slate-400">Aproveitamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-white">{score.passThreshold}</div>
                <div className="text-slate-400">Mínimo p/ aprovação</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Card */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Section Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Seção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedSections.map((section) => {
              const perf = score.sectionBreakdown[section]
              const percentage = Math.round(perf.percentage)

              return (
                <div key={section}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {CIP_SECTION_LABELS_PT[section]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {perf.correct}/{perf.total}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          percentage >= 70
                            ? 'text-emerald-400'
                            : percentage >= 50
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${sectionColors[section]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {score.diagnosisBreakdown
              .sort((a, b) => a.percentage - b.percentage)
              .map((diag) => {
                const percentage = Math.round(diag.percentage)

                return (
                  <div
                    key={diag.diagnosisId}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-sm text-white flex-1 mr-4 line-clamp-1">
                      {diag.diagnosisName}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentage >= 70
                              ? 'bg-emerald-500'
                              : percentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">
                        {diag.correct}/{diag.total}
                      </span>
                      <span
                        className={`text-sm font-semibold w-12 text-right ${
                          percentage >= 70
                            ? 'text-emerald-400'
                            : percentage >= 50
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
        {onBackToList && (
          <Button variant="primary" onClick={onBackToList}>
            Voltar para lista
          </Button>
        )}
      </div>
    </div>
  )
}
