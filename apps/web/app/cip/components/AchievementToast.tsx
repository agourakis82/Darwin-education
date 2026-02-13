'use client'

import { useEffect, useState } from 'react'
import { CircleDot, Award, Medal, Gem, Star } from 'lucide-react'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'
import type { Achievement } from './AchievementBadge'

interface AchievementToastProps {
  achievements: Achievement[]
  onClose?: () => void
}

const tierColors = {
  bronze: {
    bg: 'bg-amber-900/90',
    border: 'border-amber-500',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/50',
  },
  silver: {
    bg: 'bg-surface-3/90',
    border: 'border-label-secondary',
    text: 'text-label-primary',
    glow: 'shadow-label-secondary/50',
  },
  gold: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-400',
    text: 'text-yellow-200',
    glow: 'shadow-yellow-400/50',
  },
  platinum: {
    bg: 'bg-cyan-900/90',
    border: 'border-cyan-400',
    text: 'text-cyan-200',
    glow: 'shadow-cyan-400/50',
  },
}

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const currentAchievement = achievements[currentIndex]

  useEffect(() => {
    if (!currentAchievement) return

    // Trigger confetti for each achievement
    const tierConfetti = {
      bronze: { colors: ['#D97706', '#F59E0B', '#FBBF24'] },
      silver: { colors: ['#64748B', '#94A3B8', '#CBD5E1'] },
      gold: { colors: ['#FBBF24', '#FCD34D', '#FDE68A'] },
      platinum: { colors: ['#06B6D4', '#22D3EE', '#67E8F9'] },
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.5, y: 0.3 },
      colors: tierConfetti[currentAchievement.tier].colors,
      zIndex: 99999,
    })

    // Auto-advance to next achievement after 4 seconds
    if (currentIndex < achievements.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 4000)

      return () => clearTimeout(timer)
    } else {
      // Close toast after last achievement
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, currentAchievement, achievements.length, onClose])

  if (!currentAchievement || !isVisible) return null

  const colors = tierColors[currentAchievement.tier]

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none">
      <div
        className={cn(
          'transform transition-all duration-500',
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <div
          className={cn(
            'max-w-md px-6 py-4 rounded-2xl border-2 backdrop-blur-md shadow-2xl',
            colors.bg,
            colors.border,
            colors.glow,
            'animate-bounce-in'
          )}
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 border-2 border-white/20">
                  <span className="text-4xl">{currentAchievement.icon}</span>
                </div>
                {/* Tier Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-surface-1/90 border border-separator/80 shadow-elevation-2 backdrop-blur-md">
                  <span className="text-xs flex items-center justify-center">
                    {currentAchievement.tier === 'bronze' && <CircleDot className="w-3 h-3 text-amber-600" />}
                    {currentAchievement.tier === 'silver' && <Award className="w-3 h-3 text-label-tertiary" />}
                    {currentAchievement.tier === 'gold' && <Medal className="w-3 h-3 text-yellow-400" />}
                    {currentAchievement.tier === 'platinum' && <Gem className="w-3 h-3 text-cyan-400" />}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
                Conquista Desbloqueada!
              </p>
              <h3 className={cn('text-lg font-bold mb-1', colors.text)}>
                {currentAchievement.title_pt}
              </h3>
              <p className="text-sm text-white/70">{currentAchievement.description_pt}</p>
              {currentAchievement.xp_reward > 0 && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
                  <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-semibold text-white">
                    +{currentAchievement.xp_reward} XP
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {achievements.length > 1 && (
            <div className="mt-4 flex gap-1">
              {achievements.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all',
                    idx <= currentIndex ? 'bg-white' : 'bg-white/20'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AchievementToast
