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
  const recentAttempts = [...attempts].slice(0, 10).reverse()

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
  const maxYScore = Math.max(...recentAttempts.map(a => a.scaled_score))
  const chartMin = Math.max(0, Math.floor(minScore / 100) * 100 - 100)
  const chartMax = Math.min(1000, Math.ceil(maxYScore / 100) * 100 + 100)

  return (
    <div className="h-64">
      {/* Y-axis labels */}
      <div className="flex h-full">
        <div className="flex flex-col justify-between text-xs text-slate-500 pr-2 py-2 w-8">
          <span>{Math.max(chartMax, 1000)}</span>
          <span>{Math.max(chartMax - 200, 800)}</span>
          <span>600</span>
          <span>{Math.max(chartMin + 200, 400)}</span>
          <span>{Math.max(chartMin, 200)}</span>
          <span>{Math.max(chartMin - 200, 0)}</span>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden rounded-lg bg-slate-800/20">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-t border-slate-800/50" />
            ))}
          </div>

          {/* Passing line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500/60 z-10"
            style={{ top: `${((chartMax - passingScore) / (chartMax - Math.max(chartMin, 0))) * 100}%` }}
          >
            <span className="absolute -top-4 right-2 text-xs text-emerald-400 bg-slate-950 px-2 py-0.5 rounded">
              Aprovação (600)
            </span>
          </div>

          {/* Data points */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Gradient area under curve */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Line connecting points */}
            <polyline
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              points={recentAttempts
                .map((attempt, i) => {
                  const x = (i / (recentAttempts.length - 1 || 1)) * 100
                  const y = (1 - (attempt.scaled_score - Math.max(chartMin, 0)) / (chartMax - Math.max(chartMin, 0))) * 100
                  return `${x}%,${y}%`
                })
                .join(' ')}
            />

            {/* Area under curve */}
            <polygon
              fill="url(#scoreGradient)"
              points={`0%,100% ${recentAttempts
                .map((attempt, i) => {
                  const x = (i / (recentAttempts.length - 1 || 1)) * 100
                  const y = (1 - (attempt.scaled_score - Math.max(chartMin, 0)) / (chartMax - Math.max(chartMin, 0))) * 100
                  return `${x}%,${y}%`
                })
                .join(' ')} 100%,100%`}
            />

            {/* Data points */}
            {recentAttempts.map((attempt, i) => {
              const x = (i / (recentAttempts.length - 1 || 1)) * 100
              const y = (1 - (attempt.scaled_score - Math.max(chartMin, 0)) / (chartMax - Math.max(chartMin, 0))) * 100

              return (
                <g key={attempt.id} className="group">
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="5"
                    fill={attempt.passed ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                    className="cursor-pointer transition-all hover:r-7 group-hover:stroke-white group-hover:stroke-2"
                  />
                  <title>
                    {new Date(attempt.completed_at).toLocaleDateString('pt-BR')}: {Math.round(attempt.scaled_score)}
                  </title>
                </g>
              )
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between transform text-xs text-slate-500 px-1">
            {recentAttempts.map((attempt, i) => (
              <span key={attempt.id} className="transform -rotate-45 origin-top-left whitespace-nowrap inline-block text-center" style={{ width: '40px' }}>
                {new Date(attempt.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="h-8" />
    </div>
  )
}
