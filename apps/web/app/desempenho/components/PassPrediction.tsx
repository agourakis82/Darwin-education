'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ENAMEDArea } from '@darwin-education/shared'

interface ExamAttempt {
  id: string
  exam_id: string
  completed_at: string
  theta: number
  scaled_score: number
  passed: boolean
  correct_count: number
  area_breakdown: Record<ENAMEDArea, { correct: number; total: number }>
  total_time_seconds: number
}

interface PassPredictionProps {
  theta: number
  totalQuestions: number
  attempts?: ExamAttempt[]
}

export function PassPrediction({ theta, totalQuestions, attempts = [] }: PassPredictionProps) {
  // Estimate pass probability based on current theta
  // Using a simplified logistic model
  // The passing theta is approximately 0 (which maps to 600 on the 0-1000 scale)
  const passingTheta = 0
  const scale = 1.7 // Steepness of the curve

  // Logistic function: P(pass) = 1 / (1 + e^(-scale * (theta - passingTheta)))
  const passProbability = 1 / (1 + Math.exp(-scale * (theta - passingTheta)))
  const passPercentage = Math.round(passProbability * 100)

  // Calculate probability trend over time
  const getTrendData = () => {
    if (attempts.length === 0) return []

    return attempts
      .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
      .slice(-10)
      .map(attempt => {
        const prob = 1 / (1 + Math.exp(-scale * (attempt.theta - passingTheta)))
        return {
          date: new Date(attempt.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          probability: Math.round(prob * 100),
          passed: attempt.passed,
        }
      })
  }

  const trendData = getTrendData()

  // Get color based on probability
  const getColor = () => {
    if (passPercentage >= 70) return 'text-emerald-400'
    if (passPercentage >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getGradient = () => {
    if (passPercentage >= 70) return 'from-emerald-500 to-emerald-600'
    if (passPercentage >= 50) return 'from-yellow-500 to-yellow-600'
    return 'from-red-500 to-red-600'
  }

  const getMessage = () => {
    if (passPercentage >= 80) return 'Excelente! Continue assim.'
    if (passPercentage >= 60) return 'Bom progresso! Continue estudando.'
    if (passPercentage >= 40) return 'Precisa de mais prática.'
    return 'Foque nas áreas fracas.'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Probabilidade de Aprovação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {/* Circular progress */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#passGradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={352}
                strokeDashoffset={352 * (1 - passPercentage / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="passGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={passPercentage >= 70 ? '#10B981' : passPercentage >= 50 ? '#EAB308' : '#EF4444'} />
                  <stop offset="100%" stopColor={passPercentage >= 70 ? '#059669' : passPercentage >= 50 ? '#CA8A04' : '#DC2626'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-3xl font-bold ${getColor()}`}>{passPercentage}%</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">{getMessage()}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-300">
                {theta > 0 ? '+' : ''}{theta.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">Theta (TRI)</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-300">{totalQuestions}</p>
              <p className="text-xs text-slate-500">Questões</p>
            </div>
          </div>
        </div>

        {/* Probability Trend */}
        {trendData.length > 1 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-3">Evolução da Probabilidade</p>
            <div className="h-32 relative flex items-end justify-between gap-1">
              {trendData.map((data, i) => {
                const maxProb = Math.max(...trendData.map(d => d.probability), 100)
                const height = (data.probability / maxProb) * 100

                return (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div
                      className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${
                        data.passed
                          ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-t from-blue-500 to-blue-400'
                      }`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${data.date}: ${data.probability}%`}
                    />
                    <span className="text-xs text-slate-600 mt-1 whitespace-nowrap text-center hidden group-hover:inline">
                      {data.probability}%
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 mt-2 text-xs text-slate-500">
              <span>Primeiro</span>
              <span className="flex-1" />
              <span>Último</span>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">Como funciona:</span> A probabilidade é calculada
            usando TRI baseada em seu desempenho. Quanto maior seu theta, maior a probabilidade de aprovação.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
