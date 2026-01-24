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

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Radar Chart */}
      <div className="flex-shrink-0">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Grid circles */}
          {gridLevels.map((level) => (
            <circle
              key={level}
              cx={centerX}
              cy={centerY}
              r={(level / 100) * maxRadius}
              fill="none"
              stroke="rgb(51, 65, 85)"
              strokeWidth="1"
              strokeDasharray={level === 60 ? '4,4' : 'none'}
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
              />
            )
          })}

          {/* Data polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(16, 185, 129, 0.2)"
            stroke="rgb(16, 185, 129)"
            strokeWidth="2"
          />

          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={areaColors[areas[i]]}
              stroke="white"
              strokeWidth="2"
            />
          ))}

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
                className="text-xs fill-slate-400"
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

          return (
            <div key={area} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: areaColors[area] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 truncate">{areaLabels[area]}</span>
                  <span className={`text-sm font-medium ${isWeak ? 'text-red-400' : 'text-emerald-400'}`}>
                    {value}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${value}%`,
                      backgroundColor: areaColors[area],
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
