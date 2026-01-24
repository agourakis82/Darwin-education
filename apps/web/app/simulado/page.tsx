import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const areaLabels: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

export default async function SimuladoPage() {
  const supabase = await createServerClient()

  // Fetch available exams
  const { data: exams } = await supabase
    .from('exams')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Fetch user's recent attempts
  const { data: { user } } = await supabase.auth.getUser()
  let recentAttempts: any[] = []

  if (user) {
    const { data } = await supabase
      .from('exam_attempts')
      .select('*, exams(title)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5)

    recentAttempts = data || []
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Simulados ENAMED</h1>
          <p className="text-slate-400">
            Pratique com questões no formato oficial do exame e acompanhe seu progresso com pontuação TRI
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/simulado/rapido">
            <Card hover className="h-full">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Simulado Rápido</h3>
                    <p className="text-sm text-slate-400">20 questões, 1 hora</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/simulado/completo">
            <Card hover className="h-full">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Simulado Completo</h3>
                    <p className="text-sm text-slate-400">100 questões, 5 horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/montar-prova">
            <Card hover className="h-full">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Montar Prova</h3>
                    <p className="text-sm text-slate-400">Personalize seu simulado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Exams */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Simulados Disponíveis</h2>
            <div className="space-y-4">
              {exams && exams.length > 0 ? (
                exams.map((exam: any) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {exam.question_count} questões
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {Math.floor(exam.time_limit_minutes / 60)}h {exam.time_limit_minutes % 60}min
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/simulado/${exam.id}`}>
                        <Button>Iniciar Simulado</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-slate-400">Nenhum simulado disponível no momento</p>
                      <p className="text-sm text-slate-500 mt-2">Use "Montar Prova" para criar um simulado personalizado</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Attempts Sidebar */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Histórico Recente</h2>
            <Card>
              <CardContent>
                {recentAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {recentAttempts.map((attempt: any) => (
                      <div key={attempt.id} className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-white">
                            {attempt.exams?.title || 'Simulado'}
                          </span>
                          {attempt.completed_at ? (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              attempt.passed
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : 'bg-red-900/50 text-red-300'
                            }`}>
                              {attempt.passed ? 'Aprovado' : 'Reprovado'}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/50 text-yellow-300">
                              Em andamento
                            </span>
                          )}
                        </div>
                        {attempt.scaled_score && (
                          <div className="text-2xl font-bold text-white mb-1">
                            {attempt.scaled_score}
                            <span className="text-sm font-normal text-slate-400">/1000</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                        </div>
                        {!attempt.completed_at && (
                          <Link href={`/simulado/${attempt.exam_id}`}>
                            <Button size="sm" variant="outline" className="mt-2">
                              Continuar
                            </Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">Nenhuma tentativa ainda</p>
                    <p className="text-slate-500 text-xs mt-1">Comece um simulado para ver seu histórico</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Dicas de Estudo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    Simule condições reais: faça provas completas sem pausas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    Revise questões erradas nos flashcards
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    Foque nas áreas com menor desempenho
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
