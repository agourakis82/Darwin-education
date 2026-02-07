'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'

export type ModuleType = 'reading' | 'video' | 'quiz' | 'flashcards' | 'case_study'

export interface Module {
  id: string
  title: string
  description: string | null
  type: ModuleType
  order_index: number
  estimated_minutes: number
  is_completed: boolean
  is_locked: boolean
}

interface ModuleListProps {
  pathId: string
  modules: Module[]
  currentModuleId?: string
}

const moduleIcons: Record<ModuleType, React.ReactNode> = {
  reading: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  quiz: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  flashcards: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  case_study: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

const moduleTypeLabels: Record<ModuleType, string> = {
  reading: 'Leitura',
  video: 'Vídeo',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  case_study: 'Caso Clínico',
}

export function ModuleList({ pathId, modules, currentModuleId }: ModuleListProps) {
  return (
    <div className="space-y-2">
      {modules.map((module, index) => {
        const isActive = module.id === currentModuleId
        const canAccess = !module.is_locked

        const content = (
          <Card
            className={`transition-colors ${
              isActive
                ? 'border-emerald-500 bg-emerald-500/10'
                : module.is_completed
                ? 'border-separator bg-surface-2/50'
                : canAccess
                ? 'border-separator hover:border-surface-4 cursor-pointer'
                : 'border-surface-2 bg-surface-1/50 opacity-60'
            }`}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    module.is_completed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isActive
                      ? 'bg-emerald-500 text-white'
                      : canAccess
                      ? 'bg-surface-3 text-label-secondary'
                      : 'bg-surface-2 text-label-quaternary'
                  }`}
                >
                  {module.is_completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : module.is_locked ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-label-secondary ${isActive ? 'text-emerald-400' : ''}`}>
                      {moduleIcons[module.type]}
                    </span>
                    <h4 className={`font-medium truncate ${isActive ? 'text-white' : 'text-label-primary'}`}>
                      {module.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-label-tertiary">
                    <span>{moduleTypeLabels[module.type]}</span>
                    <span>•</span>
                    <span>{module.estimated_minutes} min</span>
                  </div>
                </div>

                {/* Arrow for accessible modules */}
                {canAccess && !module.is_completed && (
                  <svg className="w-5 h-5 text-label-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </CardContent>
          </Card>
        )

        if (canAccess) {
          return (
            <Link key={module.id} href={`/trilhas/${pathId}/${module.id}`}>
              {content}
            </Link>
          )
        }

        return <div key={module.id}>{content}</div>
      })}
    </div>
  )
}
