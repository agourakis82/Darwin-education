'use client'

import type { ENAMEDArea } from '@darwin-education/shared'

interface AreaFilterProps {
  selected: ENAMEDArea[]
  onChange: (areas: ENAMEDArea[]) => void
  stats?: Record<ENAMEDArea, number>
}

const areas: { key: ENAMEDArea; label: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'clinica_medica',
    label: 'Clínica Médica',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  },
  {
    key: 'cirurgia',
    label: 'Cirurgia',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  },
  {
    key: 'ginecologia_obstetricia',
    label: 'GO',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30',
  },
  {
    key: 'pediatria',
    label: 'Pediatria',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  },
  {
    key: 'saude_coletiva',
    label: 'Saúde Coletiva',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  },
]

export function AreaFilter({ selected, onChange, stats }: AreaFilterProps) {
  const toggleArea = (area: ENAMEDArea) => {
    if (selected.includes(area)) {
      onChange(selected.filter(a => a !== area))
    } else {
      onChange([...selected, area])
    }
  }

  const selectAll = () => {
    onChange(areas.map(a => a.key))
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {areas.map((area) => {
          const isSelected = selected.includes(area.key)
          const count = stats?.[area.key] || 0

          return (
            <button
              key={area.key}
              onClick={() => toggleArea(area.key)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? `${area.color} border-current`
                  : 'bg-surface-2/50 border-separator hover:border-surface-4 text-label-secondary'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`mb-2 ${isSelected ? '' : 'text-label-tertiary'}`}>
                  {area.icon}
                </div>
                <span className="text-sm font-medium">{area.label}</span>
                <span className="text-xs mt-1 opacity-70">{count} questões</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
