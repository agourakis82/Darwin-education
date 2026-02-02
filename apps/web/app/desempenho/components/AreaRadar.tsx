'use client'

import type { ENAMEDArea } from '@darwin-education/shared'

interface AreaRadarProps {
  performance: Record<ENAMEDArea, number>
}

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const areaColors: Record<ENAMEDArea, string> = {
  clinica_medica: '#3B82F6',
  cirurgia: '#EF4444',
  ginecologia_obstetricia: '#EC4899',
  pediatria: '#22C55E',
  saude_coletiva: '#8B5CF6',
}

export function AreaRadar({ performance }: AreaRadarProps) {
  const areas = Object.keys(areaLabels) as ENAMEDArea[]
  const n = areas.length
  const angleStep = (2 * Math.PI) / n
  const centerX = 150
  const centerY = 150
  const maxRadius = 120

  // Calculate points for the radar polygon
  const getPoint = (angle: number, value: number) => {
    const radius = (value / 100) * maxRadius
    return {
      x: centerX + radius * Math.sin(angle),
      y: centerY - radius * Math.cos(angle),
    }
  }

  const dataPoints = areas.map((area, i) => {
    const angle = i * angleStep
    const value = performance[area] || 0
    return getPoint(angle, value)
  })

  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Grid circles
  const gridLevels = [20, 40, 60, 80, 100]

  // Check if there's any data
  const hasData = Object.values(performance).some(v => v > 0)

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Radar Chart */}
      <div className="flex-shrink-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-4">
        <svg width="300" height="300" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
            </linearGradient>
          </defs>

          {/* Grid circles */}
          {gridLevels.map((level) => (
            <circle
              key={level}
              cx={centerX}
              cy={centerY}
              r={(level / 100) * maxRadius}
              fill="none"
              stroke="rgb(51, 65, 85)"
              strokeWidth={level === 60 ? '1.5' : '1'}
              strokeDasharray={level === 60 ? '4,4' : 'none'}
              opacity={0.6}
            />
          ))}

          {/* Axis lines */}
          {areas.map((_, i) => {
            const angle = i * angleStep
            const endPoint = getPoint(angle, 100)
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="rgb(51, 65, 85)"
                strokeWidth="1"
                opacity={0.5}
              />
            )
          })}

          {/* Data polygon */}
          {hasData && (
            <>
              <polygon
                points={polygonPoints}
                fill="url(#radarGradient)"
                stroke="rgb(16, 185, 129)"
                strokeWidth="2.5"
              />

              {/* Data points with glow */}
              {dataPoints.map((point, i) => {
                const value = performance[areas[i]] || 0
                return (
                  <g key={i}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="7"
                      fill={areaColors[areas[i]]}
                      opacity="0.2"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill={areaColors[areas[i]]}
                      stroke="white"
                      strokeWidth="2"
                      className="drop-shadow-lg"
                    />
                    <title>{areaLabels[areas[i]]}: {value}%</title>
                  </g>
                )
              })}
            </>
          )}

          {/* Labels */}
          {areas.map((area, i) => {
            const angle = i * angleStep
            const labelPoint = getPoint(angle, 115)
            const textAnchor =
              Math.abs(labelPoint.x - centerX) < 10 ? 'middle' :
              labelPoint.x > centerX ? 'start' : 'end'

            return (
              <text
                key={area}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-xs fill-slate-300 font-medium"
              >
                {areaLabels[area]}
              </text>
            )
          })}

          {/* Center label */}
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-slate-500"
          >
            60%
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-3">
        {areas.map((area) => {
          const value = performance[area] || 0
          const isWeak = value < 60
          const isGood = value >= 80

          return (
            <div key={area} className="p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-md"
                    style={{ backgroundColor: areaColors[area] }}
                  />
                  <span className="text-sm text-slate-300 font-medium">{areaLabels[area]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isGood ? 'text-emerald-400' : isWeak ? 'text-red-400' : 'text-yellow-400'}`}>
                    {value}%
                  </span>
                  {isGood && <span className="text-xs text-emerald-400">✓</span>}
                  {isWeak && <span className="text-xs text-red-400">!</span>}
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all shadow-lg"
                  style={{
                    width: `${value}%`,
                    backgroundColor: areaColors[area],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
