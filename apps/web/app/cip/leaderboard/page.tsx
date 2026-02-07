import { Metadata } from 'next'
import { Suspense } from 'react'
import { Trophy } from 'lucide-react'
import { LeaderboardTabs } from '../components/LeaderboardTabs'
import { LeaderboardSkeleton } from '../components/LeaderboardSkeleton'

export const metadata: Metadata = {
  title: 'Ranking | CIP',
  description: 'Ranking dos melhores desempenhos nos puzzles clínicos',
}

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3"><Trophy className="w-8 h-8 text-amber-400 inline" /> Ranking CIP</h1>
        <p className="text-muted-foreground">
          Veja os melhores desempenhos nos puzzles de integração clínica
        </p>
      </div>

      {/* Leaderboard Tabs */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardTabs />
      </Suspense>
    </div>
  )
}
