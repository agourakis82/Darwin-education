'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Phase = 'work' | 'short_break' | 'long_break'

interface PomodoroConfig {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLong: number
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
}

const PHASE_LABELS: Record<Phase, string> = {
  work: 'Foco',
  short_break: 'Pausa Curta',
  long_break: 'Pausa Longa',
}

const PHASE_COLORS: Record<Phase, string> = {
  work: 'text-emerald-400',
  short_break: 'text-blue-400',
  long_break: 'text-purple-400',
}

const PHASE_BG: Record<Phase, string> = {
  work: 'from-emerald-900/30',
  short_break: 'from-blue-900/30',
  long_break: 'from-purple-900/30',
}

const PHASE_RING: Record<Phase, string> = {
  work: 'stroke-emerald-500',
  short_break: 'stroke-blue-500',
  long_break: 'stroke-purple-500',
}

export function PomodoroTimer() {
  const [config, setConfig] = useState<PomodoroConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG
    const saved = localStorage.getItem('darwin-pomodoro-config')
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG
  })
  const [phase, setPhase] = useState<Phase>('work')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalSessionsToday, setTotalSessionsToday] = useState(0)
  const [remainingTime, setRemainingTime] = useState(config.workMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getPhaseTime = useCallback((p: Phase) => {
    switch (p) {
      case 'work': return config.workMinutes * 60
      case 'short_break': return config.shortBreakMinutes * 60
      case 'long_break': return config.longBreakMinutes * 60
    }
  }, [config])

  const totalTime = getPhaseTime(phase)
  const progress = 1 - remainingTime / totalTime

  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return
    const interval = setInterval(() => {
      setRemainingTime(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, remainingTime])

  useEffect(() => {
    if (remainingTime === 0 && isRunning) {
      setIsRunning(false)
      playNotification()
      advancePhase()
    }
  }, [remainingTime, isRunning])

  function playNotification() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.3
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.stop(ctx.currentTime + 0.8)
    } catch {
      // Audio not available
    }
  }

  function advancePhase() {
    if (phase === 'work') {
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)
      setTotalSessionsToday(prev => prev + 1)
      if (newCompleted >= config.sessionsBeforeLong) {
        setPhase('long_break')
        setRemainingTime(config.longBreakMinutes * 60)
        setCompletedSessions(0)
      } else {
        setPhase('short_break')
        setRemainingTime(config.shortBreakMinutes * 60)
      }
    } else {
      setPhase('work')
      setRemainingTime(config.workMinutes * 60)
    }
  }

  function handleSkip() {
    setIsRunning(false)
    advancePhase()
  }

  function handleReset() {
    setIsRunning(false)
    setRemainingTime(getPhaseTime(phase))
  }

  function handleConfigSave(newConfig: PomodoroConfig) {
    setConfig(newConfig)
    localStorage.setItem('darwin-pomodoro-config', JSON.stringify(newConfig))
    setShowSettings(false)
    setPhase('work')
    setRemainingTime(newConfig.workMinutes * 60)
    setIsRunning(false)
    setCompletedSessions(0)
  }

  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60
  const pad = (n: number) => n.toString().padStart(2, '0')

  // SVG circle for progress ring
  const size = 240
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={`rounded-xl bg-gradient-to-b ${PHASE_BG[phase]} to-surface-1 p-8`}>
      <div className="flex flex-col items-center">
        {/* Phase indicator */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`text-sm font-medium ${PHASE_COLORS[phase]}`}>
            {PHASE_LABELS[phase]}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: config.sessionsBeforeLong }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < completedSessions ? 'bg-emerald-500' : 'bg-surface-3'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Timer ring */}
        <div className="relative mb-8">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-surface-3"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={PHASE_RING[phase]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-mono font-bold tabular-nums text-label-primary">
              {pad(minutes)}:{pad(seconds)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors text-label-secondary hover:text-label-primary"
            title="Reiniciar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <motion.button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-4 rounded-full text-white transition-colors ${
              phase === 'work'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : phase === 'short_break'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
            whileTap={{ scale: 0.95 }}
            transition={spring.snappy}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>

          <button
            onClick={handleSkip}
            className="p-3 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors text-label-secondary hover:text-label-primary"
            title="Pular"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Settings */}
        <div className="flex items-center gap-6 mt-6 text-sm text-label-secondary">
          <span>{totalSessionsToday} sessões hoje</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 hover:text-label-primary transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel config={config} onSave={handleConfigSave} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingsPanel({
  config,
  onSave,
  onClose,
}: {
  config: PomodoroConfig
  onSave: (c: PomodoroConfig) => void
  onClose: () => void
}) {
  const [local, setLocal] = useState(config)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring.gentle}
      className="overflow-hidden"
    >
      <div className="mt-8 pt-6 border-t border-separator space-y-4">
        <h3 className="text-sm font-medium text-label-primary">Configurações</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs text-label-secondary">Foco (min)</span>
            <input
              type="number"
              min={1}
              max={90}
              value={local.workMinutes}
              onChange={e => setLocal({ ...local, workMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-label-secondary">Pausa curta (min)</span>
            <input
              type="number"
              min={1}
              max={30}
              value={local.shortBreakMinutes}
              onChange={e => setLocal({ ...local, shortBreakMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-label-secondary">Pausa longa (min)</span>
            <input
              type="number"
              min={1}
              max={60}
              value={local.longBreakMinutes}
              onChange={e => setLocal({ ...local, longBreakMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-label-secondary">Sessões até longa</span>
            <input
              type="number"
              min={1}
              max={10}
              value={local.sessionsBeforeLong}
              onChange={e => setLocal({ ...local, sessionsBeforeLong: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => onSave(local)}>Salvar</Button>
        </div>
      </div>
    </motion.div>
  )
}
