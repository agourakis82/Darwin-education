import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ENAMEDArea } from '@darwin-education/shared'

interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  createdAt: Date
}

interface UserStats {
  totalExams: number
  averageScore: number
  highestScore: number
  totalStudyTime: number // minutes
  currentStreak: number
  longestStreak: number
  lastStudyDate: Date | null
}

interface AreaPerformance {
  area: ENAMEDArea
  questionsAnswered: number
  correctAnswers: number
  accuracy: number
  averageTime: number // seconds per question
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  examTimerSound: boolean
  flashcardAutoFlip: boolean
  studyReminders: boolean
  reminderTime: string // HH:MM format
  dailyGoal: number // minutes
}

interface UserState {
  // Profile
  profile: UserProfile | null
  isLoading: boolean
  error: string | null

  // Stats
  stats: UserStats | null
  areaPerformance: AreaPerformance[]

  // Preferences
  preferences: UserPreferences

  // Actions
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setStats: (stats: UserStats) => void
  updateStats: (updates: Partial<UserStats>) => void
  setAreaPerformance: (performance: AreaPerformance[]) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  examTimerSound: true,
  flashcardAutoFlip: false,
  studyReminders: false,
  reminderTime: '20:00',
  dailyGoal: 60,
}

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
  stats: null,
  areaPerformance: [],
  preferences: defaultPreferences,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => {
        set({ profile, error: null })
      },

      updateProfile: (updates) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        }))
      },

      setStats: (stats) => {
        set({ stats })
      },

      updateStats: (updates) => {
        set((state) => ({
          stats: state.stats ? { ...state.stats, ...updates } : null,
        }))
      },

      setAreaPerformance: (performance) => {
        set({ areaPerformance: performance })
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }))
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error })
      },

      logout: () => {
        set(initialState)
      },
    }),
    {
      name: 'darwin-user-store',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
)

// Selectors
export const selectIsAuthenticated = (state: UserState) => state.profile !== null

export const selectUserInitials = (state: UserState) => {
  if (!state.profile?.fullName) return '?'
  const names = state.profile.fullName.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return names[0][0].toUpperCase()
}

export const selectDailyProgress = (state: UserState) => {
  if (!state.stats || !state.preferences.dailyGoal) return 0
  const today = new Date()
  const lastStudy = state.stats.lastStudyDate
  if (!lastStudy || lastStudy.toDateString() !== today.toDateString()) {
    return 0
  }
  return Math.min(100, (state.stats.totalStudyTime / state.preferences.dailyGoal) * 100)
}

export const selectWeakestAreas = (state: UserState, count = 2): ENAMEDArea[] => {
  return state.areaPerformance
    .filter((p) => p.questionsAnswered >= 5) // Only consider areas with enough data
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count)
    .map((p) => p.area)
}

export const selectStrongestAreas = (state: UserState, count = 2): ENAMEDArea[] => {
  return state.areaPerformance
    .filter((p) => p.questionsAnswered >= 5)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, count)
    .map((p) => p.area)
}
