'use client'

type Difficulty = 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil'

interface DifficultySelectorProps {
  selected: Difficulty
  onChange: (difficulty: Difficulty) => void
}

const difficulties: { key: Difficulty; label: string; color: string; activeColor: string }[] = [
  {
    key: 'muito_facil',
    label: 'Muito Fácil',
    color: 'text-emerald-500',
    activeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  },
  {
    key: 'facil',
    label: 'Fácil',
    color: 'text-green-500',
    activeColor: 'bg-green-500/20 text-green-400 border-green-500/50',
  },
  {
    key: 'medio',
    label: 'Médio',
    color: 'text-yellow-500',
    activeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  },
  {
    key: 'dificil',
    label: 'Difícil',
    color: 'text-orange-500',
    activeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  },
  {
    key: 'muito_dificil',
    label: 'Muito Difícil',
    color: 'text-red-500',
    activeColor: 'bg-red-500/20 text-red-400 border-red-500/50',
  },
]

export function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {difficulties.map((diff) => {
        const isSelected = selected === diff.key

        return (
          <button
            key={diff.key}
            onClick={() => onChange(diff.key)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              isSelected
                ? diff.activeColor
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {diff.label}
          </button>
        )
      })}
    </div>
  )
}
