'use client'

interface QuestionCountProps {
  value: number
  onChange: (count: number) => void
  max: number
}

const presets = [10, 20, 40, 60, 90, 180]

export function QuestionCount({ value, onChange, max }: QuestionCountProps) {
  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isAvailable = preset <= max
          const isSelected = value === preset

          return (
            <button
              key={preset}
              onClick={() => isAvailable && onChange(preset)}
              disabled={!isAvailable}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-emerald-600 text-white'
                  : isAvailable
                  ? 'bg-surface-2 text-label-primary hover:bg-surface-3'
                  : 'bg-surface-2/50 text-label-quaternary cursor-not-allowed'
              }`}
            >
              {preset}
            </button>
          )
        })}
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min={5}
          max={Math.min(max, 180)}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-emerald-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:hover:bg-emerald-400
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-emerald-500
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-label-tertiary">
          <span>5</span>
          <span className="text-emerald-400 font-medium text-sm">{value} questões</span>
          <span>{Math.min(max, 180)}</span>
        </div>
      </div>

      {/* Comparison with ENAMED */}
      <div className="p-3 bg-surface-2/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-label-secondary">Equivale a:</span>
          <span className="text-label-primary">
            {Math.round((value / 180) * 100)}% do ENAMED
          </span>
        </div>
        <div className="mt-2 h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min((value / 180) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
