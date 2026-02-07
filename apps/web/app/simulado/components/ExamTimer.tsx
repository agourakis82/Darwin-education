'use client'

import { Timer } from '@/components/ui/Timer'

interface ExamTimerProps {
  initialTime: number
  onTimeUp: () => void
  onTick: (remainingTime: number) => void
}

export function ExamTimer({ initialTime, onTimeUp, onTick }: ExamTimerProps) {
  return (
    <div className="flex items-center gap-2 bg-surface-2 px-4 py-2 rounded-lg">
      <svg className="w-5 h-5 text-label-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <Timer
        initialTime={initialTime}
        onTimeUp={onTimeUp}
        onTick={onTick}
        showHours={true}
        size="md"
        warningThreshold={1800} // 30 minutes
        dangerThreshold={600} // 10 minutes
      />
    </div>
  )
}
