'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AchievementBadge, type Achievement } from '../components/AchievementBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CIPAchievementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length
  const totalCount = achievements.length
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  useEffect(() => {
    async function loadAchievements() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/cip/achievements')
        return
      }

      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('cip_achievements' as never)
        .select('*')
        .eq('is_active', true)
        .order('sort_order') as unknown as {
          data: { id: string; title_pt: string; description_pt: string; icon: string; tier: string; xp_reward: number; is_active: boolean; sort_order: number }[] | null
          error: { message: string } | null
        }

      if (achievementsError) {
        console.error('Error loading achievements:', achievementsError)
        setLoading(false)
        return
      }

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_cip_achievements' as never)
        .select('achievement_id, unlocked_at, metadata')
        .eq('user_id', user.id) as unknown as {
          data: { achievement_id: string; unlocked_at: string; metadata: unknown }[] | null
          error: { message: string } | null
        }

      if (userError) {
        console.error('Error loading user achievements:', userError)
      }

      // Map user achievements
      const userAchievementMap = new Map(
        (userAchievements || []).map((ua) => [ua.achievement_id, ua])
      )

      // Combine data
      const combinedAchievements: Achievement[] = (achievementsData || []).map((a) => {
        const userAchievement = userAchievementMap.get(a.id)
        return {
          id: a.id,
          title_pt: a.title_pt,
          description_pt: a.description_pt,
          icon: a.icon,
          tier: a.tier as 'bronze' | 'silver' | 'gold' | 'platinum',
          xp_reward: a.xp_reward,
          is_unlocked: !!userAchievement,
          unlocked_at: userAchievement?.unlocked_at,
        }
      })

      setAchievements(combinedAchievements)
      setLoading(false)
    }

    loadAchievements()
  }, [router])

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'unlocked') return a.is_unlocked
    if (filter === 'locked') return !a.is_unlocked
    return true
  })

  // Group achievements by tier for display
  const groupedByTier = {
    platinum: filteredAchievements.filter((a) => a.tier === 'platinum'),
    gold: filteredAchievements.filter((a) => a.tier === 'gold'),
    silver: filteredAchievements.filter((a) => a.tier === 'silver'),
    bronze: filteredAchievements.filter((a) => a.tier === 'bronze'),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Carregando conquistas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <h1 className="text-3xl font-bold text-white">Conquistas CIP</h1>
                <p className="text-label-secondary">Desbloqueie conquistas completando puzzles</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/cip')}>
              Voltar
            </Button>
          </div>

          {/* Progress Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {unlockedCount} / {totalCount}
                  </p>
                  <p className="text-sm text-label-secondary">Conquistas desbloqueadas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">{completionPercentage}%</p>
                  <p className="text-sm text-label-secondary">Completude</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-3 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todas ({totalCount})
          </Button>
          <Button
            variant={filter === 'unlocked' ? 'primary' : 'outline'}
            onClick={() => setFilter('unlocked')}
            size="sm"
          >
            Desbloqueadas ({unlockedCount})
          </Button>
          <Button
            variant={filter === 'locked' ? 'primary' : 'outline'}
            onClick={() => setFilter('locked')}
            size="sm"
          >
            Bloqueadas ({totalCount - unlockedCount})
          </Button>
        </div>

        {/* Achievements by Tier */}
        <div className="space-y-8">
          {groupedByTier.platinum.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💎</span>
                  <span>Platina</span>
                  <span className="text-sm text-label-secondary font-normal ml-2">
                    ({groupedByTier.platinum.filter((a) => a.is_unlocked).length} /{' '}
                    {groupedByTier.platinum.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {groupedByTier.platinum.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      size="lg"
                      showDetails
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {groupedByTier.gold.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🥇</span>
                  <span>Ouro</span>
                  <span className="text-sm text-label-secondary font-normal ml-2">
                    ({groupedByTier.gold.filter((a) => a.is_unlocked).length} /{' '}
                    {groupedByTier.gold.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {groupedByTier.gold.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      size="md"
                      showDetails
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {groupedByTier.silver.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🥈</span>
                  <span>Prata</span>
                  <span className="text-sm text-label-secondary font-normal ml-2">
                    ({groupedByTier.silver.filter((a) => a.is_unlocked).length} /{' '}
                    {groupedByTier.silver.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {groupedByTier.silver.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      size="md"
                      showDetails
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {groupedByTier.bronze.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🥉</span>
                  <span>Bronze</span>
                  <span className="text-sm text-label-secondary font-normal ml-2">
                    ({groupedByTier.bronze.filter((a) => a.is_unlocked).length} /{' '}
                    {groupedByTier.bronze.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {groupedByTier.bronze.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      size="sm"
                      showDetails
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredAchievements.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-label-secondary text-lg">
                  {filter === 'unlocked'
                    ? 'Você ainda não desbloqueou nenhuma conquista. Complete puzzles para começar!'
                    : filter === 'locked'
                    ? 'Todas as conquistas foram desbloqueadas! 🎉'
                    : 'Nenhuma conquista disponível no momento.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
