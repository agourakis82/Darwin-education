'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface FlashcardData {
  id: string
  intervalDays: number
  repetitions: number
  nextReviewAt: string
}

interface DeckStatsProps {
  cards: FlashcardData[]
}

export function DeckStats({ cards }: DeckStatsProps) {
  const now = new Date()

  // Categorize cards by learning status
  const stats = cards.reduce(
    (acc, card) => {
      const nextReview = new Date(card.nextReviewAt)
      const isDue = nextReview <= now

      if (card.repetitions === 0) {
        // New cards (never reviewed)
        acc.new++
      } else if (card.intervalDays < 21) {
        // Learning (interval less than 21 days)
        acc.learning++
      } else {
        // Mature (interval 21+ days)
        acc.mature++
      }

      if (isDue) {
        acc.due++
      }

      return acc
    },
    { new: 0, learning: 0, mature: 0, due: 0 }
  )

  const total = cards.length
  const masteryPercentage = total > 0 ? Math.round((stats.mature / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Estatísticas do Deck</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mastery Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-label-secondary">Domínio</span>
            <span className="text-xs font-medium text-emerald-400">
              {masteryPercentage}%
            </span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>
        </div>

        {/* Card Categories */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-2/50 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-400">{stats.new}</div>
            <div className="text-xs text-label-secondary">Novos</div>
          </div>
          <div className="p-3 bg-surface-2/50 rounded-lg text-center">
            <div className="text-xl font-bold text-yellow-400">{stats.learning}</div>
            <div className="text-xs text-label-secondary">Aprendendo</div>
          </div>
          <div className="p-3 bg-surface-2/50 rounded-lg text-center">
            <div className="text-xl font-bold text-emerald-400">{stats.mature}</div>
            <div className="text-xs text-label-secondary">Maduros</div>
          </div>
          <div className="p-3 bg-surface-2/50 rounded-lg text-center">
            <div className="text-xl font-bold text-red-400">{stats.due}</div>
            <div className="text-xs text-label-secondary">Para Revisar</div>
          </div>
        </div>

        {/* Card Status Legend */}
        <div className="pt-3 border-t border-separator">
          <div className="text-xs text-label-tertiary space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Novos: nunca revisados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>Aprendendo: intervalo {'<'} 21 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Maduros: intervalo {'≥'} 21 dias</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
