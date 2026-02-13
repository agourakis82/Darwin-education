'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import {
  BookOpen,
  MessageCircle,
  Link2,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { ScoreReveal } from '@/components/ui/ScoreReveal'
import { CalibrationMatrix } from './CalibrationMatrix'
import type { FCRScore, FCRLevelResult, FCRDetectedLacuna } from '@darwin-education/shared'
import { FCR_LEVEL_LABELS_PT, CALIBRATION_QUADRANT_LABELS_PT } from '@darwin-education/shared'

interface FCRResultsProps {
  score: FCRScore
}

const LACUNA_CONFIG: Record<string, { name: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  LE: {
    name: 'Lacuna Epistemica',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    icon: <BookOpen className="w-4 h-4 text-blue-400" />,
  },
  LEm: {
    name: 'Lacuna Metacognitiva',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    icon: <MessageCircle className="w-4 h-4 text-purple-400" />,
  },
  LIE: {
    name: 'Lacuna de Integracao',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    icon: <Link2 className="w-4 h-4 text-orange-400" />,
  },
}

const QUADRANT_COLORS: Record<string, string> = {
  mastery: 'text-emerald-400',
  illusion_of_knowing: 'text-red-400',
  unconscious_competence: 'text-blue-400',
  known_unknown: 'text-yellow-400',
}

export function FCRResults({ score }: FCRResultsProps) {
  return (
    <div className="space-y-8">
      {/* Score reveal */}
      <ScoreReveal
        score={score.scaledScore}
        passed={score.passed}
        stats={[
          {
            value: score.calibrationScore,
            label: 'Calibração',
            color: score.calibrationScore >= 70 ? 'text-emerald-400' : 'text-yellow-400',
            suffix: '%',
          },
          {
            value: Math.round(score.percentageCorrect),
            label: 'Acertos',
            color: score.percentageCorrect >= 60 ? 'text-emerald-400' : 'text-red-400',
            suffix: '%',
          },
          {
            value: score.levelResults.filter((r) => r.quadrant === 'illusion_of_knowing').length,
            label: 'Ilusoes de Saber',
            color: 'text-red-400',
          },
        ]}
      />

      {/* Overconfidence gauge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 1.6 }}
        className="bg-surface-2/50 rounded-xl p-4"
      >
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          {score.overconfidenceIndex > 0 ? (
            <TrendingUp className="w-4 h-4 text-red-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-blue-400" />
          )}
          Indice de Overconfidence
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-muted rounded-full relative overflow-hidden">
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted-foreground/50 z-10" />
            {/* Indicator */}
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.abs(score.overconfidenceIndex) * 50}%`,
              }}
              transition={{ duration: 1, delay: 1.8 }}
              className={`absolute top-0 bottom-0 rounded-full ${
                score.overconfidenceIndex > 0
                  ? 'right-1/2 origin-right bg-red-500/60'
                  : 'left-1/2 origin-left bg-blue-500/60'
              }`}
              style={{
                [score.overconfidenceIndex > 0 ? 'right' : 'left']: '50%',
              }}
            />
          </div>
          <span
            className={`text-sm font-mono font-bold min-w-[60px] text-right ${
              score.overconfidenceIndex > 0.2
                ? 'text-red-400'
                : score.overconfidenceIndex < -0.2
                  ? 'text-blue-400'
                  : 'text-emerald-400'
            }`}
          >
            {score.overconfidenceIndex > 0 ? '+' : ''}
            {score.overconfidenceIndex.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Subconfiante</span>
          <span>Calibrado</span>
          <span>Overconfidente</span>
        </div>
      </motion.div>

      {/* Calibration Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 2.0 }}
        className="bg-surface-2/50 rounded-xl p-4"
      >
        <CalibrationMatrix levelResults={score.levelResults} />
      </motion.div>

      {/* Per-level breakdown */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 2.4 } },
        }}
        className="space-y-3"
      >
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Resultado por Nivel
        </h4>
        {score.levelResults.map((result) => (
          <LevelResultCard key={result.level} result={result} />
        ))}
      </motion.div>

      {/* Detected Lacunas */}
      {score.detectedLacunas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 3.0 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Lacunas Detectadas
          </h4>
          {score.detectedLacunas.map((lacuna, i) => (
            <LacunaCard key={i} lacuna={lacuna} />
          ))}
        </motion.div>
      )}

      {/* Educational Insights */}
      {score.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 3.4 }}
          className="bg-surface-2/50 rounded-xl p-4 space-y-2"
        >
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Insights Educacionais
          </h4>
          {score.insights.map((insight, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              {insight}
            </p>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function LevelResultCard({ result }: { result: FCRLevelResult }) {
  const quadrantLabel = CALIBRATION_QUADRANT_LABELS_PT[result.quadrant]
  const quadrantColor = QUADRANT_COLORS[result.quadrant] || 'text-muted-foreground'

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: spring.gentle },
      }}
      className={`rounded-lg border p-4 ${
        result.correct ? 'border-green-700/50 bg-green-900/10' : 'border-red-700/50 bg-red-900/10'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{result.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${quadrantColor} bg-surface-2/50`}>
            {quadrantLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={result.correct ? 'text-green-400' : 'text-red-400'}>
            {result.correct
              ? result.partialCredit !== undefined
                ? `${Math.round(result.partialCredit * 100)}%`
                : 'Correto'
              : 'Incorreto'}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">
            Conf: {result.confidence}/5
          </span>
        </div>
      </div>

      {/* Option details */}
      {result.selectedOptionText && (
        <div className="text-xs space-y-1 mt-2">
          <div className={result.correct ? 'text-green-400/70' : 'text-red-400/70'}>
            Sua resposta: {result.selectedOptionText}
          </div>
          {!result.correct && result.correctOptionText && (
            <div className="text-green-400/70">
              Correto: {result.correctOptionText}
            </div>
          )}
          {result.correctExplanation && (
            <div className="text-muted-foreground mt-1">{result.correctExplanation}</div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function LacunaCard({ lacuna }: { lacuna: FCRDetectedLacuna }) {
  const config = LACUNA_CONFIG[lacuna.type] || LACUNA_CONFIG.LE

  return (
    <div className={`rounded-lg ${config.bgColor} border border-border/50 p-3`}>
      <div className="flex items-center gap-2 mb-1">
        {config.icon}
        <span className={`text-sm font-medium ${config.color}`}>{config.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {FCR_LEVEL_LABELS_PT[lacuna.level]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{lacuna.evidence}</p>
    </div>
  )
}
