'use client'

interface ThetaTrajectoryProps {
  /** Array of exam_attempts ordered by completed_at ascending */
  attempts: Array<{
    id: string
    completed_at: string
    theta: number
    standard_error?: number
    is_adaptive?: boolean
  }>
}

const PASS_THETA = 1.0 // theta ≈ 1.0 → scaled score 600

export function ThetaTrajectory({ attempts }: ThetaTrajectoryProps) {
  const data = [...attempts]
    .filter((a) => typeof a.theta === 'number')
    .slice(-15)
    .reverse()

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-label-secondary text-sm">
        Nenhum dado de habilidade (θ) disponível ainda
      </div>
    )
  }

  const thetas = data.map((a) => a.theta)
  const ses = data.map((a) => a.standard_error ?? 0.5)

  const minY = Math.min(...thetas.map((t, i) => t - ses[i])) - 0.3
  const maxY = Math.max(...thetas.map((t, i) => t + ses[i])) + 0.3
  const range = maxY - minY || 1

  const toPercent = (v: number) => ((maxY - v) / range) * 100
  const passY = toPercent(PASS_THETA)

  const n = data.length

  return (
    <div className="h-48">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Passing threshold line */}
        {passY >= 0 && passY <= 100 && (
          <line
            x1="0" y1={passY} x2="100" y2={passY}
            stroke="rgb(16,185,129)" strokeWidth="0.5" strokeDasharray="2,1"
          />
        )}

        {/* SE confidence band */}
        <polygon
          fill="rgba(139,92,246,0.12)"
          points={[
            ...data.map((a, i) => {
              const x = (i / (n - 1 || 1)) * 100
              return `${x},${toPercent(a.theta + (a.standard_error ?? 0.5))}`
            }),
            ...data.map((a, i) => {
              const x = ((n - 1 - i) / (n - 1 || 1)) * 100
              return `${x},${toPercent(a.theta - (a.standard_error ?? 0.5))}`
            }),
          ].join(' ')}
        />

        {/* Theta line */}
        <polyline
          fill="none"
          stroke="rgb(139,92,246)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          points={data
            .map((a, i) => `${(i / (n - 1 || 1)) * 100},${toPercent(a.theta)}`)
            .join(' ')}
        />

        {/* Data points */}
        {data.map((a, i) => (
          <circle
            key={a.id}
            cx={(i / (n - 1 || 1)) * 100}
            cy={toPercent(a.theta)}
            r="1.8"
            fill={a.is_adaptive ? 'rgb(139,92,246)' : 'rgb(168,85,247)'}
          >
            <title>
              {new Date(a.completed_at).toLocaleDateString('pt-BR')}: θ={a.theta.toFixed(2)}
              {a.standard_error ? ` ±${a.standard_error.toFixed(2)}` : ''}
            </title>
          </circle>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-label-tertiary">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-purple-500" />
          θ estimado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 bg-purple-500/20 rounded-sm" />
          Intervalo de confiança (±SE)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-emerald-500" style={{ borderTop: '1px dashed' }} />
          Limiar aprovação
        </span>
      </div>
    </div>
  )
}

