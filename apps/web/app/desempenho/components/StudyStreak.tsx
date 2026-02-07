'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface StudyActivity {
  activity_date: string
  exams_completed: number
  flashcards_reviewed: number
  questions_answered: number
}

interface StudyStreakProps {
  streak: number
  lastDate: string | null
  /** Actual daily activity data for calendar display */
  activityData?: StudyActivity[]
}

export function StudyStreak({ streak, lastDate, activityData = [] }: StudyStreakProps) {
  const today = new Date()
  const lastStudy = lastDate ? new Date(lastDate) : null

  // Check if streak is active (studied today or yesterday)
  const isActive = lastStudy
    ? (today.getTime() - lastStudy.getTime()) < 2 * 24 * 60 * 60 * 1000
    : false

  // Generate last 7 days for the calendar view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  // Use actual activity data if available, otherwise fall back to streak-based calculation
  const studiedDays = activityData.length > 0
    ? last7Days.filter(d => {
        const dateStr = d.toISOString().split('T')[0]
        const activity = activityData.find(a => a.activity_date === dateStr)
        return activity && (
          activity.exams_completed > 0 ||
          activity.flashcards_reviewed > 0 ||
          activity.questions_answered > 0
        )
      })
    : lastStudy
      ? last7Days.filter(d => {
          const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
          return diff < streak
        })
      : []

  const getMessage = () => {
    if (streak === 0) return 'Comece sua sequência hoje!'
    if (streak === 1) return 'Bom começo! Continue amanhã.'
    if (streak < 7) return `${streak} dias! Continue assim!`
    if (streak < 30) return `${streak} dias! Impressionante!`
    return `${streak} dias! Você é incrível!`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Sequência de Estudos
          {streak >= 7 && (
            <span className="text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Streak count */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl">🔥</span>
            <span className={`text-4xl font-bold ${isActive ? 'text-orange-400' : 'text-label-tertiary'}`}>
              {streak}
            </span>
          </div>
          <p className="text-sm text-label-secondary">{getMessage()}</p>
        </div>

        {/* Weekly calendar */}
        <div className="grid grid-cols-7 gap-1">
          {last7Days.map((date, i) => {
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
            const isToday = date.toDateString() === today.toDateString()
            const hasStudied = studiedDays.some(d => d.toDateString() === date.toDateString())

            return (
              <div key={i} className="text-center">
                <p className="text-xs text-label-tertiary mb-1 capitalize">{dayName}</p>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                    hasStudied
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isToday
                      ? 'bg-surface-3 text-label-primary'
                      : 'bg-surface-2/50 text-label-quaternary'
                  }`}
                >
                  {hasStudied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs">{date.getDate()}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Motivational message */}
        {!isActive && streak > 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">
              Estude hoje para não perder sua sequência!
            </p>
          </div>
        )}

        {streak === 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400 text-center">
              Complete um simulado ou revise flashcards para iniciar sua sequência!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
