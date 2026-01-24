'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ENAMEDArea } from '@darwin-education/shared'

interface PathCardProps {
  id: string
  title: string
  description: string | null
  area: ENAMEDArea
  moduleCount: number
  estimatedHours: number
  progress: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

const areaColors: Record<ENAMEDArea, string> = {
  clinica_medica: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cirurgia: 'bg-red-500/20 text-red-400 border-red-500/30',
  ginecologia_obstetricia: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  pediatria: 'bg-green-500/20 text-green-400 border-green-500/30',
  saude_coletiva: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
}

export function PathCard({
  id,
  title,
  description,
  area,
  moduleCount,
  estimatedHours,
  progress,
  difficulty,
}: PathCardProps) {
  return (
    <Link href={`/trilhas/${id}`}>
      <Card className="h-full hover:border-slate-600 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {progress === 100 && (
              <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                Concluída
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 text-xs rounded border ${areaColors[area]}`}>
              {areaLabels[area]}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${difficultyColors[difficulty]}`}>
              {difficultyLabels[difficulty]}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              {description}
            </p>
          )}

          {progress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{moduleCount} módulos</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{estimatedHours}h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
