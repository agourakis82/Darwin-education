'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ENAMEDArea } from '@darwin-education/shared'

interface WeakAreasProps {
  performance: Record<ENAMEDArea, number>
}

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

export function WeakAreas({ performance }: WeakAreasProps) {
  // Find areas with performance below 60%
  const weakAreas = (Object.entries(performance) as [ENAMEDArea, number][])
    .filter(([_, score]) => score < 60 && score > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)

  if (weakAreas.length === 0) {
    const hasData = Object.values(performance).some(v => v > 0)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Áreas para Melhorar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            {hasData ? (
              <>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-emerald-400 font-medium">Excelente!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Todas as áreas acima de 60%
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">Sem dados suficientes</p>
                <p className="text-xs text-slate-500 mt-1">
                  Complete mais simulados
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Áreas para Melhorar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weakAreas.map(([area, score]) => (
            <div key={area} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">{areaLabels[area]}</span>
                <span className="text-sm font-medium text-red-400">{score}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-4 space-y-2">
          <Link
            href={`/montar-prova?areas=${weakAreas.map(([a]) => a).join(',')}`}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Praticar estas áreas
          </Link>
          <Link
            href="/trilhas"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-slate-400 hover:text-slate-300 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Ver trilhas de estudo
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">Dica:</span> Foque nas áreas com menor
            desempenho primeiro. Questões de diferentes níveis de dificuldade ajudam a
            consolidar o conhecimento.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
