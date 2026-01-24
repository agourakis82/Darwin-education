'use client'

import { useEffect, useRef } from 'react'
import { useCIPStore } from '@/lib/stores/cipStore'

interface CIPTimerProps {
  onTimeUp?: () => void
}

export function CIPTimer({ onTimeUp }: CIPTimerProps) {
  const { remainingTime, updateRemainingTime, isSubmitted } = useCIPStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onTimeUpRef = useRef(onTimeUp)

  // Update ref when callback changes
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    if (isSubmitted || remainingTime <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      const newTime = remainingTime - 1
      updateRemainingTime(newTime)

      if (newTime <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        onTimeUpRef.current?.()
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [remainingTime, isSubmitted, updateRemainingTime])

  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60

  const isLowTime = remainingTime < 300 // Less than 5 minutes
  const isCriticalTime = remainingTime < 60 // Less than 1 minute

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg
        ${
          isCriticalTime
            ? 'bg-red-900/50 text-red-300 border border-red-700 animate-pulse'
            : isLowTime
              ? 'bg-amber-900/50 text-amber-300 border border-amber-700'
              : 'bg-slate-800 text-slate-200 border border-slate-700'
        }
      `}
    >
      <svg
        className={`w-5 h-5 ${isCriticalTime ? 'text-red-400' : isLowTime ? 'text-amber-400' : 'text-slate-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
