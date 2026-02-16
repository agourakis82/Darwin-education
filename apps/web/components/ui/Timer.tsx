'use client'

import { useState, useEffect, useCallback } from 'react'

interface TimerProps {
  /** Initial time in seconds */
  initialTime: number
  /** Called when timer reaches zero */
  onTimeUp?: () => void
  /** Called every second with remaining time */
  onTick?: (remainingSeconds: number) => void
  /** Whether the timer is running */
  isRunning?: boolean
  /** Show hours in display */
  showHours?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Warning threshold in seconds (turns yellow) */
  warningThreshold?: number
  /** Danger threshold in seconds (turns red) */
  dangerThreshold?: number
}

const sizeStyles = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
}

export function Timer({
  initialTime,
  onTimeUp,
  onTick,
  isRunning = true,
  showHours = true,
  size = 'md',
  warningThreshold = 600, // 10 minutes
  dangerThreshold = 120, // 2 minutes
}: TimerProps) {
  const [remainingTime, setRemainingTime] = useState(initialTime)

  useEffect(() => {
    setRemainingTime(initialTime)
  }, [initialTime])

  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1
        onTick?.(newTime)

        if (newTime <= 0) {
          onTimeUp?.()
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, remainingTime, onTick, onTimeUp])

  const formatTime = useCallback(
    (seconds: number) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      const pad = (n: number) => n.toString().padStart(2, '0')

      if (showHours || hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
      }
      return `${pad(minutes)}:${pad(secs)}`
    },
    [showHours]
  )

  const getColorClass = () => {
    if (remainingTime <= dangerThreshold) {
      return 'text-red-400'
    }
    if (remainingTime <= warningThreshold) {
      return 'text-yellow-400'
    }
    return 'text-label-primary'
  }

  return (
    <div
      className={`
        font-mono font-bold tabular-nums
        ${sizeStyles[size]}
        ${getColorClass()}
        ${remainingTime <= dangerThreshold && remainingTime > 0 ? 'animate-pulse' : ''}
      `}
    >
      {formatTime(remainingTime)}
    </div>
  )
}

// Hook for using timer logic without UI
export function useTimer(initialTime: number) {
  const [remainingTime, setRemainingTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setRemainingTime(initialTime)
    setIsRunning(false)
  }, [initialTime])

  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return

    const interval = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, remainingTime])

  return {
    remainingTime,
    isRunning,
    isExpired: remainingTime <= 0,
    start,
    pause,
    reset,
    setTime: setRemainingTime,
  }
}
