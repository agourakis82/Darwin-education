'use client'

import { cn } from '@/lib/utils'

export interface Achievement {
  id: string
  title_pt: string
  description_pt: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  xp_reward: number
  is_unlocked: boolean
  unlocked_at?: string
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  onClick?: () => void
}

const tierStyles = {
  bronze: {
    border: 'border-amber-700',
    bg: 'bg-amber-900/20',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
  },
  silver: {
    border: 'border-slate-400',
    bg: 'bg-slate-400/10',
    glow: 'shadow-slate-400/20',
    text: 'text-slate-300',
  },
  gold: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-500/10',
    glow: 'shadow-yellow-400/30',
    text: 'text-yellow-300',
  },
  platinum: {
    border: 'border-cyan-400',
    bg: 'bg-cyan-500/10',
    glow: 'shadow-cyan-400/30',
    text: 'text-cyan-300',
  },
}

const sizeStyles = {
  sm: {
    container: 'w-16 h-16',
    icon: 'text-2xl',
    badge: 'text-xs',
  },
  md: {
    container: 'w-24 h-24',
    icon: 'text-4xl',
    badge: 'text-sm',
  },
  lg: {
    container: 'w-32 h-32',
    icon: 'text-6xl',
    badge: 'text-base',
  },
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showDetails = false,
  onClick,
}: AchievementBadgeProps) {
  const tierStyle = tierStyles[achievement.tier]
  const sizeStyle = sizeStyles[size]

  const isLocked = !achievement.is_unlocked

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-300',
        showDetails && 'flex flex-col items-center gap-2',
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      {/* Badge Container */}
      <div
        className={cn(
          sizeStyle.container,
          'relative flex items-center justify-center rounded-full border-2 transition-all',
          isLocked
            ? 'border-slate-700 bg-slate-800/20 grayscale opacity-50'
            : `${tierStyle.border} ${tierStyle.bg} shadow-lg ${tierStyle.glow}`,
          !isLocked && 'hover:shadow-xl'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            sizeStyle.icon,
            'transition-transform group-hover:scale-110',
            isLocked ? 'opacity-40' : ''
          )}
        >
          {isLocked ? '🔒' : achievement.icon}
        </div>

        {/* Tier Badge (Top Right Corner) */}
        {!isLocked && (
          <div
            className={cn(
              'absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
              tierStyle.border,
              tierStyle.bg,
              tierStyle.text,
              'border'
            )}
          >
            {achievement.tier === 'bronze' && '🥉'}
            {achievement.tier === 'silver' && '🥈'}
            {achievement.tier === 'gold' && '🥇'}
            {achievement.tier === 'platinum' && '💎'}
          </div>
        )}

        {/* XP Reward (Bottom) */}
        {!isLocked && achievement.xp_reward > 0 && (
          <div className="absolute -bottom-2 px-2 py-0.5 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-300 font-medium">
            +{achievement.xp_reward} XP
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center max-w-[200px]">
          <h3
            className={cn(
              'font-semibold text-sm',
              isLocked ? 'text-slate-500' : 'text-white'
            )}
          >
            {isLocked ? '???' : achievement.title_pt}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isLocked ? 'Conquista bloqueada' : achievement.description_pt}
          </p>
          {!isLocked && achievement.unlocked_at && (
            <p className="text-xs text-slate-500 mt-1">
              Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {/* Tooltip on Hover */}
      {!showDetails && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="font-semibold">
            {isLocked ? '??? (Bloqueado)' : achievement.title_pt}
          </div>
          <div className="text-slate-400 mt-1">{achievement.description_pt}</div>
        </div>
      )}
    </div>
  )
}

export default AchievementBadge
