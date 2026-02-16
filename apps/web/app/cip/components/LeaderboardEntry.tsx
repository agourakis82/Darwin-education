import { cn } from '@/lib/utils'
import { Medal, Award, CircleDot, Scan } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntryProps {
  rank: number
  displayName: string
  avatarUrl: string | null
  score: number
  percentage: number
  timeSeconds: number | null
  difficulty: string
  completedAt: string
  isCurrentUser?: boolean
  entryType?: 'puzzle' | 'image'
}

const difficultyLabels: Record<string, string> = {
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
}

const difficultyColors: Record<string, string> = {
  muito_facil: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  facil: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200',
  medio: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  dificil: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-200',
  muito_dificil: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200',
}

function getRankMedal(rank: number): React.ReactNode | null {
  if (rank === 1) return <Medal className="w-7 h-7 text-yellow-400" />
  if (rank === 2) return <Award className="w-7 h-7 text-label-tertiary" />
  if (rank === 3) return <CircleDot className="w-7 h-7 text-amber-600" />
  return null
}

function formatTime(seconds: number | null): string {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`
  return date.toLocaleDateString('pt-BR')
}

export function LeaderboardEntry({
  rank,
  displayName,
  avatarUrl,
  score,
  percentage,
  timeSeconds,
  difficulty,
  completedAt,
  isCurrentUser = false,
  entryType = 'puzzle',
}: LeaderboardEntryProps) {
  const medal = getRankMedal(rank)

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-separator/80 bg-surface-1/60 p-4 shadow-elevation-1 backdrop-blur-md transition-colors',
        isCurrentUser && 'border-emerald-500/40 bg-emerald-500/10',
        rank <= 3 && 'border-yellow-500/50 bg-yellow-500/5'
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
        {medal ? (
          <span>{medal}</span>
        ) : (
          <span className="text-xl font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="w-12 h-12 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('font-semibold truncate', isCurrentUser && 'text-emerald-600 dark:text-emerald-200')}>
            {displayName}
          </span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">
              Você
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {entryType === 'image' && (
            <>
              <Badge variant="outline" className="text-xs bg-blue-900/50 text-blue-300 border-blue-700 inline-flex items-center gap-1">
                <Scan className="w-3 h-3" /> Imagem
              </Badge>
              <span>•</span>
            </>
          )}
          <Badge variant="outline" className={cn('text-xs', difficultyColors[difficulty])}>
            {difficultyLabels[difficulty] || difficulty}
          </Badge>
          <span>•</span>
          <span>{formatDate(completedAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
        <div className="text-sm text-muted-foreground">Tempo</div>
        <div className="font-mono text-sm">{formatTime(timeSeconds)}</div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
        <div className="text-sm text-muted-foreground">Acertos</div>
        <div className="font-semibold text-sm">{percentage.toFixed(0)}%</div>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[80px]">
        <div className="text-sm text-muted-foreground">Score</div>
        <div className={cn('text-2xl font-bold', rank <= 3 && 'text-yellow-500')}>
          {score}
        </div>
      </div>
    </div>
  )
}
