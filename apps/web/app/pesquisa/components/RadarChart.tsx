'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { MIRTAbilityProfile, ENAMEDArea } from '@darwin-education/shared'

interface RadarChartProps {
  profile: MIRTAbilityProfile
}

const AREA_LABELS: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clinica Medica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saude Coletiva',
}

const AREA_COLORS: Record<ENAMEDArea, string> = {
  clinica_medica: '#3B82F6',
  cirurgia: '#EF4444',
  ginecologia_obstetricia: '#EC4899',
  pediatria: '#F59E0B',
  saude_coletiva: '#10B981',
}

const AREAS: ENAMEDArea[] = [
  'clinica_medica', 'cirurgia', 'ginecologia_obstetricia',
  'pediatria', 'saude_coletiva',
]

/**
 * 5-axis radar chart for MIRT multidimensional ability profile.
 * Each axis = one ENAMED area. Polygon shows ability level.
 */
export function RadarChart({ profile }: RadarChartProps) {
  const cx = 150
  const cy = 150
  const maxR = 100
  const levels = [0.25, 0.5, 0.75, 1.0]
  const ndim = AREAS.length

  // Normalize theta from [-4,4] to [0,1]
  const normalize = (theta: number) => (theta + 4) / 8

  // Polar coordinates
  const angleStep = (2 * Math.PI) / ndim
  const toPoint = (i: number, r: number) => ({
    x: cx + r * maxR * Math.sin(i * angleStep),
    y: cy - r * maxR * Math.cos(i * angleStep),
  })

  // Build polygon path for the profile
  const profilePoints = AREAS.map((area, i) => {
    const val = normalize(profile.theta[area] ?? 0)
    return toPoint(i, val)
  })
  const profilePath = profilePoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`
  ).join(' ') + 'Z'

  // Build CI polygon (inner + outer)
  const ciInnerPoints = AREAS.map((area, i) => {
    const ci = profile.confidenceIntervals[area]
    const val = ci ? normalize(ci[0]) : 0
    return toPoint(i, Math.max(0, val))
  })
  const ciOuterPoints = AREAS.map((area, i) => {
    const ci = profile.confidenceIntervals[area]
    const val = ci ? normalize(ci[1]) : 0
    return toPoint(i, Math.min(1, val))
  })
  const ciPath = ciOuterPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`
  ).join(' ') + 'L' + ciInnerPoints.map((p) =>
    `${p.x},${p.y}`
  ).reverse().join('L') + 'Z'

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-label-tertiary uppercase tracking-wider">
        Perfil MIRT 5D
      </h4>

      <div className="bg-surface-2 rounded-lg p-4">
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
          {/* Concentric level rings */}
          {levels.map((level) => {
            const ringPath = AREAS.map((_, i) => {
              const p = toPoint(i, level)
              return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`
            }).join(' ') + 'Z'
            return (
              <path
                key={level}
                d={ringPath}
                fill="none"
                stroke="currentColor"
                className="text-label-faint"
                strokeWidth={0.5}
              />
            )
          })}

          {/* Axis lines */}
          {AREAS.map((_, i) => {
            const p = toPoint(i, 1)
            return (
              <line
                key={i}
                x1={cx} y1={cy}
                x2={p.x} y2={p.y}
                stroke="currentColor"
                className="text-label-faint"
                strokeWidth={0.5}
              />
            )
          })}

          {/* CI band */}
          <motion.path
            d={ciPath}
            fill="#8b5cf6"
            opacity={0.1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Profile polygon */}
          <motion.path
            d={profilePath}
            fill="#8b5cf6"
            fillOpacity={0.2}
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2 }}
          />

          {/* Data points */}
          {profilePoints.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x} cy={p.y} r={4}
              fill={AREA_COLORS[AREAS[i]]}
              stroke="white" strokeWidth={1.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.5 + i * 0.1 }}
            />
          ))}

          {/* Axis labels */}
          {AREAS.map((area, i) => {
            const p = toPoint(i, 1.2)
            return (
              <text
                key={area}
                x={p.x} y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-label-secondary"
                fontSize={9}
                fontWeight={500}
              >
                {AREA_LABELS[area]}
              </text>
            )
          })}
        </svg>

        {/* Dimension table */}
        <div className="mt-3 space-y-1">
          {profile.dimensionProfiles.map((dim) => (
            <div key={dim.area} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: AREA_COLORS[dim.area] }}
                />
                <span className="text-label-secondary">{AREA_LABELS[dim.area]}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-label-primary font-mono">
                  {dim.theta.toFixed(2)}
                </span>
                <span className="text-label-quaternary">
                  ±{dim.se.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
