import { createServerClient } from '@/lib/supabase/server'
import { getSessionUserSummary } from '@/lib/auth/session'
import Link from 'next/link'
import Image from 'next/image'
import { Puzzle, Scan, Trophy, BarChart3 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AnimatedList, AnimatedItem } from '@/components/ui/AnimatedList'
import { AREA_LABELS } from '@/lib/area-colors'
import { BibliographyBlock } from '@/components/content/BibliographyBlock'
import { STUDY_METHODS_BIBLIOGRAPHY } from '@/lib/references/bibliography'
import type { DifficultyLevel } from '@darwin-education/shared'

const difficultyLabels: Record<string, string> = {
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
}

const difficultyColors: Record<string, string> = {
  muito_facil: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  facil: 'bg-green-900/50 text-green-300 border-green-700',
  medio: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  dificil: 'bg-orange-900/50 text-orange-300 border-orange-700',
  muito_dificil: 'bg-red-900/50 text-red-300 border-red-700',
}

export default async function CIPPage() {
  const supabase = await createServerClient()

  // Fetch available CIP puzzles
  const { data: puzzles } = await supabase
    .from('cip_puzzles')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Fetch user's recent attempts
  const user = await getSessionUserSummary(supabase)
  let recentAttempts: any[] = []

  if (user) {
    const { data } = await supabase
      .from('cip_attempts')
      .select('*, cip_puzzles(title, difficulty)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5)

    recentAttempts = data || []
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Puzzle className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-label-primary">
              Quebra-Cabeça Clínico (CIP)
            </h1>
          </div>
          <p className="text-label-secondary max-w-3xl">
            Integre conhecimentos de anamnese, exame físico, laboratório, imagem e tratamento em
            um formato de puzzle. Associe achados clínicos aos diagnósticos corretos e teste
            sua capacidade de raciocínio clínico integrado.
          </p>
        </div>

        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/cip-cover-photo-01.png"
            alt="Banner da área de puzzle clínico"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/92 via-surface-0/75 to-surface-0/35" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Pensamento clínico integrado em formato imersivo.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Pratique associação de achados, diagnóstico e conduta com feedback imediato.
              </p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">1</span>
                </div>
                <h4 className="font-medium text-label-primary mb-1">Diagnósticos</h4>
                <p className="text-sm text-label-secondary">
                  Cada linha representa um diagnóstico diferente
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">2</span>
                </div>
                <h4 className="font-medium text-label-primary mb-1">Seções</h4>
                <p className="text-sm text-label-secondary">
                  Colunas: Anamnese, Exame Físico, Lab, Imagem, Tratamento
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">3</span>
                </div>
                <h4 className="font-medium text-label-primary mb-1">Associe</h4>
                <p className="text-sm text-label-secondary">
                  Clique em cada célula e escolha o achado correto
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">4</span>
                </div>
                <h4 className="font-medium text-label-primary mb-1">Pontue</h4>
                <p className="text-sm text-label-secondary">
                  Sua pontuação é calculada com base em TRI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <AnimatedList className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <AnimatedItem>
            <Link href="/cip/interpretacao">
              <Card hover className="h-full">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Scan className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-label-primary">Interpretação de Imagem</h3>
                      <p className="text-sm text-label-secondary">Raio-X, TC, ECG, USG, RMN</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedItem>

          <AnimatedItem>
            <Link href="/cip/pratica?difficulty=facil">
              <Card hover className="h-full">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-label-primary">Puzzle Rápido</h3>
                      <p className="text-sm text-label-secondary">4 diagnósticos, fácil</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedItem>

          <AnimatedItem>
            <Link href="/cip/pratica?difficulty=medio">
              <Card hover className="h-full">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-label-primary">Puzzle Médio</h3>
                      <p className="text-sm text-label-secondary">5 diagnósticos, médio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedItem>

          <AnimatedItem>
            <Link href="/cip/pratica?difficulty=dificil">
              <Card hover className="h-full">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-label-primary">Puzzle Desafio</h3>
                      <p className="text-sm text-label-secondary">6+ diagnósticos, difícil</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </AnimatedItem>
        </AnimatedList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Puzzles */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-label-primary mb-4">Puzzles Disponíveis</h2>
            <div className="space-y-4">
              {puzzles && puzzles.length > 0 ? (
                puzzles.map((puzzle: any) => (
                  <Card key={puzzle.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{puzzle.title}</CardTitle>
                          <CardDescription>{puzzle.description}</CardDescription>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[puzzle.difficulty]}`}
                        >
                          {difficultyLabels[puzzle.difficulty]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-label-secondary">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          {puzzle.diagnosis_ids?.length ?? 0} diagnósticos
                        </div>
                        <div className="flex items-center gap-2 text-label-secondary">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {puzzle.time_limit_minutes ? `${puzzle.time_limit_minutes} min` : 'Sem limite'}
                        </div>
                        {puzzle.areas && puzzle.areas.length > 0 && (
                          <div className="flex items-center gap-2 text-label-secondary">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            {puzzle.areas.map((a: string) => AREA_LABELS[a] || a).join(', ')}
                          </div>
                        )}
                      </div>
                      {puzzle.times_attempted > 0 && (
                        <div className="mt-3 text-xs text-label-tertiary">
                          {puzzle.times_attempted} tentativas • Média:{' '}
                          {puzzle.avg_score ? Math.round(puzzle.avg_score) : '-'} pontos
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Link href={`/cip/${puzzle.id}`}>
                        <Button>Iniciar Puzzle</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
                        <Puzzle className="w-8 h-8 text-label-secondary" />
                      </div>
                      <p className="text-label-secondary">Nenhum puzzle disponível no momento</p>
                      <p className="text-sm text-label-tertiary mt-2">
                        Use "Puzzle Rápido" acima para gerar um puzzle de prática
                      </p>
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
                    {recentAttempts.map((attempt: any) => (
                      <div
                        key={attempt.id}
                        className="border-b border-separator last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-label-primary">
                            {attempt.cip_puzzles?.title || 'Puzzle'}
                          </span>
                          {attempt.completed_at ? (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                attempt.passed
                                  ? 'bg-emerald-900/50 text-emerald-300'
                                  : 'bg-red-900/50 text-red-300'
                              }`}
                            >
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
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-label-tertiary">
                            {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                          </div>
                          {attempt.correct_count !== null && (
                            <div className="text-xs text-label-secondary">
                              {attempt.correct_count}/{attempt.total_cells} corretas
                            </div>
                          )}
                        </div>
                        {!attempt.completed_at && (
                          <Link href={`/cip/${attempt.puzzle_id}`}>
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
                    <p className="text-label-secondary text-sm">Nenhuma tentativa ainda</p>
                    <p className="text-label-tertiary text-xs mt-1">
                      Complete um puzzle para ver seu histórico
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard & Achievements */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/cip/leaderboard">
                <Card hover className="h-full">
                  <CardContent>
                    <div className="flex flex-col items-center gap-2 py-2">
                      <BarChart3 className="w-6 h-6 text-amber-400" />
                      <span className="text-sm font-medium text-label-primary">Ranking</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/cip/achievements">
                <Card hover className="h-full">
                  <CardContent>
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <span className="text-sm font-medium text-label-primary">Conquistas</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Tips Card */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Dicas para CIP</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-label-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Comece pelos diagnósticos que você conhece melhor
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Use processo de eliminação nas opções
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Atenção aos distratores: eles são semanticamente similares
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Revise as associações erradas no feedback
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <BibliographyBlock
            title="Referências (método de estudo)"
            entries={[...STUDY_METHODS_BIBLIOGRAPHY.active_recall, ...STUDY_METHODS_BIBLIOGRAPHY.spaced_repetition]}
          />
          <BibliographyBlock
            title="Referências (ENAMED/TRI)"
            entries={[...STUDY_METHODS_BIBLIOGRAPHY.inep_enamed, ...STUDY_METHODS_BIBLIOGRAPHY.psychometrics]}
          />
        </div>
      </div>
    </div>
  )
}
