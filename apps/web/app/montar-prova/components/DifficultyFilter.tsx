'use client'

import type { DifficultyLevel } from '@darwin-education/shared'

interface DifficultyFilterProps {
  selected: DifficultyLevel[]
  onChange: (difficulties: DifficultyLevel[]) => void
  stats?: Record<DifficultyLevel, number>
}

const difficulties: { key: DifficultyLevel; label: string; color: string }[] = [
  {
    key: 'muito_facil',
    label: 'Muito Fácil',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  },
  {
    key: 'facil',
    label: 'Fácil',
    color: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  },
  {
    key: 'medio',
    label: 'Médio',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  },
  {
    key: 'dificil',
    label: 'Difícil',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
  },
  {
    key: 'muito_dificil',
    label: 'Muito Difícil',
    color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  },
]

export function DifficultyFilter({ selected, onChange, stats }: DifficultyFilterProps) {
  const toggleDifficulty = (difficulty: DifficultyLevel) => {
    if (selected.includes(difficulty)) {
      onChange(selected.filter(d => d !== difficulty))
    } else {
      onChange([...selected, difficulty])
    }
  }

  const selectAll = () => {
    onChange(difficulties.map(d => d.key))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Selecionar todas
        </button>
        <span className="text-label-quaternary">|</span>
        <button
          onClick={clearAll}
          className="text-sm text-label-secondary hover:text-label-primary transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {difficulties.map((difficulty) => {
          const isSelected = selected.includes(difficulty.key)
          const count = stats?.[difficulty.key] || 0

          return (
            <button
              key={difficulty.key}
              onClick={() => toggleDifficulty(difficulty.key)}
              className={`px-4 py-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? `${difficulty.color} border-current`
                  : 'bg-surface-2/50 border-separator hover:border-surface-4 text-label-secondary'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium">{difficulty.label}</span>
                <span className="text-xs mt-1 opacity-70">{count} questões</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Visual difficulty scale */}
      <div className="mt-4 flex items-center gap-1">
        <span className="text-xs text-label-tertiary">Mais fácil</span>
        <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 opacity-30" />
        <span className="text-xs text-label-tertiary">Mais difícil</span>
      </div>
    </div>
  )
}
