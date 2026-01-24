'use client'

import type { ENAMEDArea } from '@darwin-education/shared'

interface ExamAttempt {
  id: string
  completed_at: string
  scaled_score: number
  passed: boolean
}

interface ScoreHistoryProps {
  attempts: ExamAttempt[]
}

export function ScoreHistory({ attempts }: ScoreHistoryProps) {
  // Show last 10 attempts in reverse chronological order
  const recentAttempts = [...attempts].reverse().slice(-10)

  if (recentAttempts.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        Nenhum dado disponível
      </div>
    )
  }

  const maxScore = 1000
  const passingScore = 600
  const minScore = Math.min(...recentAttempts.map(a => a.scaled_score))
  const chartMin = Math.max(0, Math.floor(minScore / 100) * 100 - 100)

  return (
    <div className="h-64">
      {/* Y-axis labels */}
      <div className="flex h-full">
        <div className="flex flex-col justify-between text-xs text-slate-500 pr-2 py-2">
          <span>1000</span>
          <span>800</span>
          <span>600</span>
          <span>400</span>
          <span>200</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-t border-slate-800/50" />
            ))}
          </div>

          {/* Passing line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500/50"
            style={{ top: `${(1 - 600 / maxScore) * 100}%` }}
          >
            <span className="absolute -top-5 right-0 text-xs text-emerald-400">
              Aprovação (600)
            </span>
          </div>

          {/* Data points */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Line connecting points */}
            <polyline
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="2"
              points={recentAttempts
                .map((attempt, i) => {
                  const x = (i / (recentAttempts.length - 1 || 1)) * 100
                  const y = (1 - attempt.scaled_score / maxScore) * 100
                  return `${x}%,${y}%`
                })
                .join(' ')}
            />

            {/* Data points */}
            {recentAttempts.map((attempt, i) => {
              const x = (i / (recentAttempts.length - 1 || 1)) * 100
              const y = (1 - attempt.scaled_score / maxScore) * 100

              return (
                <g key={attempt.id}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="6"
                    fill={attempt.passed ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                    className="cursor-pointer hover:r-8 transition-all"
                  />
                  <title>
                    {new Date(attempt.completed_at).toLocaleDateString('pt-BR')}: {Math.round(attempt.scaled_score)}
                  </title>
                </g>
              )
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between transform translate-y-6 text-xs text-slate-500">
            {recentAttempts.map((attempt, i) => (
              <span key={attempt.id} className="transform -rotate-45 origin-top-left whitespace-nowrap">
                {new Date(attempt.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
