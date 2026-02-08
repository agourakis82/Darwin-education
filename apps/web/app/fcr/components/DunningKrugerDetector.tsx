'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { AlertTriangle, CheckCircle, Info, TrendingDown } from 'lucide-react'
import type { DunningKrugerZone } from '@darwin-education/shared'

interface DunningKrugerDetectorProps {
  zone: DunningKrugerZone
  index: number
  currentTheta: number
  avgOverconfidence: number
}

const ZONE_CONFIG: Record<DunningKrugerZone, {
  label: string
  description: string
  icon: typeof AlertTriangle
  color: string
  bgColor: string
  borderColor: string
  action: string
}> = {
  high_risk: {
    label: 'Pico do Monte da Estupidez',
    description: 'Padrao Dunning-Kruger detectado: alta confianca com baixo desempenho. Voce superestima sistematicamente seu conhecimento.',
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-700/50',
    action: 'Pratique autoavaliacao consciente. Antes de responder, pergunte-se: "Qual evidencia tenho para esta certeza?"',
  },
  moderate: {
    label: 'Zona de Atencao',
    description: 'Alguma miscalibracao detectada. Sua confianca nem sempre reflete seu conhecimento real.',
    icon: Info,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-700/50',
    action: 'Continue praticando calibracao. Tente usar a escala de confianca com mais intencionalidade.',
  },
  low_risk: {
    label: 'Bem Calibrado',
    description: 'Sua autoavaliacao de confianca esta alinhada com seu desempenho real. Excelente metacognicao!',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-700/50',
    action: 'Mantenha esta pratica reflexiva. Sua autoconsciencia e uma vantagem na pratica clinica.',
  },
  inverse: {
    label: 'Vale do Desespero',
    description: 'Padrao inverso: voce subestima seu conhecimento. Sua confianca e menor do que seu desempenho justifica.',
    icon: TrendingDown,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700/50',
    action: 'Confie mais no seu raciocinio! Voce sabe mais do que acredita. Pratique afirmacoes positivas ao estudar.',
  },
}

/**
 * Dunning-Kruger Zone Detector — visualizes the DK effect.
 *
 * Shows a simplified DK curve with the student's position highlighted.
 *
 * References:
 *   - Dunning & Kruger (1999): "Unskilled and Unaware of It"
 *   - Kruger & Dunning (2002): "Unskilled, Unaware, or Both?"
 */
export function DunningKrugerDetector({
  zone,
  index,
  currentTheta,
  avgOverconfidence,
}: DunningKrugerDetectorProps) {
  const config = ZONE_CONFIG[zone]
  const Icon = config.icon

  // DK curve SVG parameters
  const svgWidth = 300
  const svgHeight = 100
  const padding = 20

  // Map theta (-4 to +4) to x position
  const thetaToX = (t: number) =>
    padding + ((t + 4) / 8) * (svgWidth - padding * 2)

  // DK curve: confidence as a function of ability
  // Peaks at low ability, dips, then rises linearly for high ability
  const dkCurve = (x: number): number => {
    // x is 0-1 (ability)
    // Mt Stupid peak at ~0.2, Valley of Despair at ~0.5, then rise
    const peak = 0.85 * Math.exp(-((x - 0.15) ** 2) / 0.015)
    const valley = -0.3 * Math.exp(-((x - 0.45) ** 2) / 0.02)
    const rise = 0.5 * x
    return Math.min(1, Math.max(0, 0.3 + peak + valley + rise))
  }

  // Generate curve points
  const curvePoints: string[] = []
  for (let i = 0; i <= 50; i++) {
    const x = i / 50
    const px = padding + x * (svgWidth - padding * 2)
    const py = padding + (1 - dkCurve(x)) * (svgHeight - padding * 2)
    curvePoints.push(`${px},${py}`)
  }

  // Student's position on the curve
  const studentX = Math.max(0, Math.min(1, (currentTheta + 4) / 8))
  const studentPx = padding + studentX * (svgWidth - padding * 2)
  const studentConfidence = Math.max(0, Math.min(1, 0.5 + avgOverconfidence))
  const studentPy = padding + (1 - studentConfidence) * (svgHeight - padding * 2)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Detector Dunning-Kruger
      </h4>

      <motion.div
        className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        {/* DK Curve visualization */}
        <div className="bg-surface-0/50 rounded-md p-2 mb-3">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full">
            {/* Zone labels */}
            <text x={thetaToX(-2.5)} y={12} textAnchor="middle" className="fill-red-400/60" fontSize={7}>
              Monte
            </text>
            <text x={thetaToX(0)} y={12} textAnchor="middle" className="fill-blue-400/60" fontSize={7}>
              Vale
            </text>
            <text x={thetaToX(2.5)} y={12} textAnchor="middle" className="fill-emerald-400/60" fontSize={7}>
              Dominio
            </text>

            {/* DK curve */}
            <motion.polyline
              points={curvePoints.join(' ')}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2}
              opacity={0.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />

            {/* Perfect calibration line (flat at 0.5) */}
            <line
              x1={padding}
              y1={padding + 0.5 * (svgHeight - padding * 2)}
              x2={svgWidth - padding}
              y2={padding + 0.5 * (svgHeight - padding * 2)}
              stroke="currentColor"
              className="text-muted-foreground/20"
              strokeDasharray="3,3"
              strokeWidth={1}
            />

            {/* Student position */}
            <motion.circle
              cx={studentPx}
              cy={studentPy}
              r={6}
              fill="currentColor"
              className={config.color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.5 }}
            />
            <motion.circle
              cx={studentPx}
              cy={studentPy}
              r={12}
              fill="none"
              stroke="currentColor"
              className={config.color}
              strokeWidth={1.5}
              opacity={0.3}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.6 }}
            />

            {/* Y-axis label */}
            <text x={6} y={svgHeight / 2} textAnchor="middle" className="fill-muted-foreground" fontSize={7} transform={`rotate(-90 6 ${svgHeight / 2})`}>
              Confianca
            </text>
            <text x={svgWidth / 2} y={svgHeight - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={7}>
              Habilidade (theta)
            </text>
          </svg>
        </div>

        {/* Zone info */}
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
          <div>
            <div className={`text-sm font-semibold ${config.color} mb-1`}>
              {config.label}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {config.description}
            </p>
            <p className="text-xs text-white/70">
              {config.action}
            </p>
          </div>
        </div>

        {/* Numeric indicators */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-surface-0/30 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Indice DK</div>
            <div className={`text-sm font-bold ${config.color}`}>
              {index > 0 ? '+' : ''}{index.toFixed(2)}
            </div>
          </div>
          <div className="bg-surface-0/30 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Excesso Conf.</div>
            <div className={`text-sm font-bold ${avgOverconfidence > 0.1 ? 'text-red-400' : avgOverconfidence < -0.1 ? 'text-blue-400' : 'text-emerald-400'}`}>
              {avgOverconfidence > 0 ? '+' : ''}{avgOverconfidence.toFixed(2)}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
