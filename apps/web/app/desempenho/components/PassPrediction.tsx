'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface PassPredictionProps {
  theta: number
  totalQuestions: number
}

export function PassPrediction({ theta, totalQuestions }: PassPredictionProps) {
  // Estimate pass probability based on current theta
  // Using a simplified logistic model
  // The passing theta is approximately 0 (which maps to 600 on the 0-1000 scale)
  const passingTheta = 0
  const scale = 1.7 // Steepness of the curve

  // Logistic function: P(pass) = 1 / (1 + e^(-scale * (theta - passingTheta)))
  const passProbability = 1 / (1 + Math.exp(-scale * (theta - passingTheta)))
  const passPercentage = Math.round(passProbability * 100)

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

        {/* Explanation */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">Como funciona:</span> A probabilidade é calculada
            usando TRI (Teoria de Resposta ao Item) baseada em seu desempenho histórico.
            Theta = 0 corresponde ao ponto de corte (600 pontos).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
