'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea, AreaPerformance } from '@darwin-education/shared'

interface ExamResultsProps {
  areaBreakdown: Record<ENAMEDArea, AreaPerformance>
}


export function ExamResults({ areaBreakdown }: ExamResultsProps) {
  const areas = Object.keys(areaBreakdown) as ENAMEDArea[]

  // Sort areas by performance (worst first)
  const sortedAreas = [...areas].sort(
    (a, b) => areaBreakdown[a].percentage - areaBreakdown[b].percentage
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho por Área</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAreas.map((area) => {
            const performance = areaBreakdown[area]
            const percentage = Math.round(performance.percentage)

            return (
              <div key={area}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-label-primary">
                    {AREA_LABELS[area]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-label-secondary">
                      {performance.correct}/{performance.total}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        percentage >= 70
                          ? 'text-emerald-400'
                          : percentage >= 50
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${AREA_COLORS[area]?.solid}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Performance Legend */}
        <div className="flex gap-4 mt-6 pt-4 border-t border-separator text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-label-secondary">Bom (70%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-label-secondary">Regular (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-label-secondary">Fraco (&lt;50%)</span>
          </div>
        </div>

        {/* Weak Areas Callout */}
        {sortedAreas.length > 0 && areaBreakdown[sortedAreas[0]].percentage < 50 && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-300">
                  Área que precisa de atenção: {AREA_LABELS[sortedAreas[0]]}
                </p>
                <p className="text-xs text-red-400 mt-1">
                  Recomendamos revisar esta área usando flashcards e trilhas de estudo.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
