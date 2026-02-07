'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LeaderboardEntry } from './LeaderboardEntry'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/Skeleton'

interface LeaderboardData {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  scaled_score: number
  percentage_correct: number
  total_time_seconds: number | null
  difficulty: string
  completed_at: string
  rank: number
  total_entries: number
}

export function LeaderboardWeekly() {
  const [entries, setEntries] = useState<LeaderboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        // Fetch weekly leaderboard
        const { data, error: fetchError } = await supabase
          .from('cip_leaderboard_weekly')
          .select('*')
          .limit(50)

        if (fetchError) throw fetchError

        setEntries(data || [])
      } catch (err) {
        console.error('Error fetching weekly leaderboard:', err)
        setError('Erro ao carregar ranking semanal')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (entries.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nenhuma entrada no ranking desta semana. Seja o primeiro a completar um puzzle!
        </AlertDescription>
      </Alert>
    )
  }

  // Calculate time remaining until weekly reset (Sunday midnight)
  const now = new Date()
  const nextSunday = new Date(now)
  nextSunday.setDate(now.getDate() + (7 - now.getDay()))
  nextSunday.setHours(23, 59, 59, 999)
  const daysUntilReset = Math.ceil((nextSunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Entradas Esta Semana</div>
          <div className="text-2xl font-bold">{entries[0]?.total_entries || 0}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Líder da Semana</div>
          <div className="text-lg font-bold truncate">
            {entries[0]?.display_name || 'N/A'}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Reseta em</div>
          <div className="text-2xl font-bold text-blue-500">
            {daysUntilReset} {daysUntilReset === 1 ? 'dia' : 'dias'}
          </div>
        </div>
      </div>

      {/* Weekly Info */}
      <Alert>
        <AlertDescription>
          <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 inline" /> O ranking semanal reseta todo domingo à meia-noite. Últimos {daysUntilReset} dias para conquistar o topo!</span>
        </AlertDescription>
      </Alert>

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <LeaderboardEntry
            key={entry.id}
            rank={entry.rank}
            displayName={entry.display_name}
            avatarUrl={entry.avatar_url}
            score={entry.scaled_score}
            percentage={entry.percentage_correct}
            timeSeconds={entry.total_time_seconds}
            difficulty={entry.difficulty}
            completedAt={entry.completed_at}
            isCurrentUser={entry.user_id === currentUserId}
          />
        ))}
      </div>
    </div>
  )
}
