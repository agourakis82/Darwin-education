'use client'

import {
  useCIPStore,
  selectAnsweredCount,
  selectTotalCells,
  selectProgress,
} from '@/lib/stores/cipStore'

export function CIPProgress() {
  const state = useCIPStore()
  const answered = selectAnsweredCount(state)
  const total = selectTotalCells(state)
  const progress = selectProgress(state)

  return (
    <div className="flex items-center gap-4">
      {/* Progress bar */}
      <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress text */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-label-secondary">Progresso:</span>
        <span className="text-white font-medium">
          {answered}/{total}
        </span>
        <span className="text-label-tertiary">({Math.round(progress)}%)</span>
      </div>
    </div>
  )
}
