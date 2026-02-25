import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { BibliographyBlock } from '@/components/content/BibliographyBlock'
import { STUDY_METHODS_BIBLIOGRAPHY } from '@/lib/references/bibliography'

interface ExamRow {
  id: string
  title: string
  description: string | null
  question_count: number
  time_limit_minutes: number
  question_ids: string[]
  type: 'official_simulation' | 'custom' | 'practice' | 'review' | 'adaptive'
}

interface AttemptRow {
  id: string
  exam_id: string
  started_at: string
  completed_at: string | null
  passed: boolean | null
  scaled_score: number | null
  exams: { title: string } | null
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`
}

function formatQuestionDuration(questionCount: number, timeLimitMinutes: number) {
  return `${questionCount} questões, ${formatDuration(timeLimitMinutes)}`
}

export default async function SimuladoPage() {
  const supabase = await createServerClient()

  // Fetch available exams (only those with questions)
  const { data: allExams } = await supabase
    .from('exams')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Filter out exams with empty question_ids
  const exams = (allExams || []).filter(
    (exam: any) => exam.question_ids && exam.question_ids.length > 0
  ) as ExamRow[]

  const orderedByCount = [...exams].sort((left, right) => left.question_count - right.question_count)
  const quickExam = orderedByCount.find((exam) => exam.question_count > 0)
  const fullExam = [...orderedByCount].reverse().find((exam) => exam.question_count > 0)

  const quickPreset = quickExam
    ? {
        count: quickExam.question_count,
        time: quickExam.time_limit_minutes,
      }
    : { count: 20, time: 60 }

  const fullPreset = fullExam
    ? {
        count: fullExam.question_count,
        time: fullExam.time_limit_minutes,
      }
    : { count: 100, time: 300 }

  // Fetch user's recent attempts
  const user = await getSessionUserSummary(supabase)
  let recentAttempts: AttemptRow[] = []

  if (user) {
    const { data } = await supabase
      .from('exam_attempts')
      .select('*, exams(title)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5)

    recentAttempts = (data || []) as unknown as AttemptRow[]
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-label-primary mb-2">Simulados ENAMED</h1>
          <p className="text-label-secondary">
            Pratique com questões no formato oficial do exame e acompanhe seu progresso com pontuação TRI
          </p>
        </div>

        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/simulado-banner-v2.png"
            alt="Banner de simulados ENAMED"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/30" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Treino com ritmo de prova real.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Use modos rápido, completo e adaptativo para evoluir com consistência.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnimatedItem>
          <Link href={`/montar-prova?count=${quickPreset.count}&time=${quickPreset.time}`}>
            <Card hover className="h-full">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">Simulado Rápido</h3>
                    <p className="text-sm text-label-secondary">
                      {formatQuestionDuration(quickPreset.count, quickPreset.time)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          </AnimatedItem>

          <AnimatedItem>
          <Link href={`/montar-prova?count=${fullPreset.count}&time=${fullPreset.time}`}>
            <Card hover className="h-full">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">Simulado Completo</h3>
                    <p className="text-sm text-label-secondary">
                      {formatQuestionDuration(fullPreset.count, fullPreset.time)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          </AnimatedItem>

          <AnimatedItem>
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
                    <h3 className="font-semibold text-label-primary">Montar Prova</h3>
                    <p className="text-sm text-label-secondary">Personalize seu simulado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          </AnimatedItem>

          <AnimatedItem>
          <Link href="/simulado/adaptive">
            <Card hover className="h-full">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-label-primary">Adaptativo</h3>
                    <p className="text-sm text-label-secondary">IA ajusta a dificuldade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          </AnimatedItem>
        </AnimatedList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Exams */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-label-primary mb-4">Simulados Disponíveis</h2>
            <div className="space-y-4">
              {exams && exams.length > 0 ? (
                exams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-label-secondary">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {exam.question_count} questões
                        </div>
                        <div className="flex items-center gap-2 text-label-secondary">
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
                      <svg className="w-12 h-12 text-label-quaternary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
	                      <p className="text-label-secondary">Nenhum simulado disponível no momento</p>
	                      <p className="text-sm text-label-tertiary mt-2">Use “Montar Prova” para criar um simulado personalizado</p>
	                    </div>
	                  </CardContent>
	                </Card>
              )}
            </div>
          </div>

          {/* Recent Attempts Sidebar */}
          <div>
            <h2 className="text-xl font-semibold text-label-primary mb-4">Histórico Recente</h2>
            <Card>
              <CardContent>
                {recentAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {recentAttempts.map((attempt) => (
                      <div key={attempt.id} className="border-b border-separator last:border-0 pb-4 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-label-primary">
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
                          <div className="text-2xl font-bold text-label-primary mb-1">
                            {attempt.scaled_score}
                            <span className="text-sm font-normal text-label-secondary">/1000</span>
                          </div>
                        )}
                        <div className="text-xs text-label-tertiary">
                          {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                        </div>
                        {!attempt.completed_at && (
                          <Link href={`/simulado/${attempt.exam_id}`}>
                            <Button size="small" variant="bordered" className="mt-2">
                              Continuar
                            </Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-label-secondary text-sm">Nenhuma tentativa ainda</p>
                    <p className="text-label-tertiary text-xs mt-1">Comece um simulado para ver seu histórico</p>
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
                <ul className="space-y-2 text-sm text-label-secondary">
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

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <BibliographyBlock
            title="Referências (ENAMED/TRI)"
            entries={[...STUDY_METHODS_BIBLIOGRAPHY.inep_enamed, ...STUDY_METHODS_BIBLIOGRAPHY.psychometrics]}
          />
          <BibliographyBlock
            title="Referências (método de estudo)"
            entries={[...STUDY_METHODS_BIBLIOGRAPHY.active_recall, ...STUDY_METHODS_BIBLIOGRAPHY.spaced_repetition]}
          />
        </div>
      </div>
    </div>
  )
}
