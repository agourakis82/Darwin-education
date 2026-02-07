import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Scan, Brain, HeartPulse, Radio, Magnet, Image, ArrowLeft } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AREA_LABELS } from '@/lib/area-colors'

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

const modalityIconComponents: Record<string, React.ReactNode> = {
  xray: <Scan className="w-6 h-6 text-blue-400" />,
  ct: <Brain className="w-6 h-6 text-purple-400" />,
  ekg: <HeartPulse className="w-6 h-6 text-red-400" />,
  ultrasound: <Radio className="w-6 h-6 text-cyan-400" />,
  mri: <Magnet className="w-6 h-6 text-orange-400" />,
}

const defaultModalityIcon = <Image className="w-6 h-6 text-label-secondary" />

const modalityLabels: Record<string, string> = {
  xray: 'Raio-X',
  ct: 'Tomografia',
  ekg: 'ECG',
  ultrasound: 'Ultrassom',
  mri: 'Ressonância',
}

export default async function InterpretacaoPage() {
  const supabase = await createServerClient()

  // Fetch available image cases
  const { data: casesRaw } = await supabase
    .from('cip_image_cases')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const cases = (casesRaw || []) as any[]

  // Fetch user's recent image attempts
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let recentAttempts: any[] = []

  if (user) {
    const { data } = await supabase
      .from('cip_image_attempts')
      .select('*, cip_image_cases(title_pt, modality, difficulty)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5)

    recentAttempts = (data || []) as any[]
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scan className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">
              Interpretação de Imagem
            </h1>
          </div>
          <p className="text-label-secondary max-w-3xl">
            Pratique a interpretação de exames de imagem: Raio-X, Tomografia, ECG,
            Ultrassonografia e Ressonância. Identifique achados, formule diagnósticos e
            proponha condutas em 4 etapas guiadas.
          </p>
          <Link href="/cip" className="text-sm text-purple-400 hover:underline mt-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar ao CIP
          </Link>
        </div>

        {/* How it Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">1</span>
                </div>
                <h4 className="font-medium text-white mb-1">Modalidade</h4>
                <p className="text-sm text-label-secondary">
                  Identifique o tipo de exame de imagem
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">2</span>
                </div>
                <h4 className="font-medium text-white mb-1">Achados</h4>
                <p className="text-sm text-label-secondary">
                  Selecione os achados presentes na imagem
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">3</span>
                </div>
                <h4 className="font-medium text-white mb-1">Diagnóstico</h4>
                <p className="text-sm text-label-secondary">
                  Formule o diagnóstico mais provável
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">4</span>
                </div>
                <h4 className="font-medium text-white mb-1">Conduta</h4>
                <p className="text-sm text-label-secondary">
                  Escolha a conduta mais adequada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {Object.entries(modalityLabels).map(([key, label]) => (
            <div
              key={key}
              className="bg-card border rounded-lg p-3 text-center"
            >
              <span className="block mb-1">{modalityIconComponents[key]}</span>
              <span className="text-sm text-label-primary">{label}</span>
              <span className="text-xs text-label-tertiary block">
                {cases?.filter((c: any) => c.modality === key).length || 0} casos
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Cases */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Casos Disponíveis</h2>
            <div className="space-y-4">
              {cases && cases.length > 0 ? (
                cases.map((imageCase: any) => (
                  <Card key={imageCase.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span>
                            {modalityIconComponents[imageCase.modality] || defaultModalityIcon}
                          </span>
                          <div>
                            <CardTitle>{imageCase.title_pt}</CardTitle>
                            <CardDescription>
                              {modalityLabels[imageCase.modality] || imageCase.modality}
                              {imageCase.area && ` • ${AREA_LABELS[imageCase.area] || imageCase.area}`}
                            </CardDescription>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[imageCase.difficulty]}`}
                        >
                          {difficultyLabels[imageCase.difficulty]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-label-secondary line-clamp-2">
                        {imageCase.clinical_context_pt}
                      </p>
                      {imageCase.times_attempted > 0 && (
                        <div className="mt-3 text-xs text-label-tertiary">
                          {imageCase.times_attempted} tentativas • Média:{' '}
                          {imageCase.avg_score ? Math.round(imageCase.avg_score) : '-'} pontos
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Link href={`/cip/interpretacao/${imageCase.id}`}>
                        <Button>Iniciar Caso</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
                        <Scan className="w-8 h-8 text-label-secondary" />
                      </div>
                      <p className="text-label-secondary">Nenhum caso disponível no momento</p>
                      <p className="text-sm text-label-tertiary mt-2">
                        Execute os scripts SQL para carregar os casos de interpretação
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Histórico Recente</h2>
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
                          <div className="flex items-center gap-2">
                            <span>
                              {modalityIconComponents[attempt.cip_image_cases?.modality] || defaultModalityIcon}
                            </span>
                            <span className="text-sm font-medium text-white">
                              {attempt.cip_image_cases?.title_pt || 'Caso'}
                            </span>
                          </div>
                          {attempt.completed_at ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/50 text-emerald-300">
                              Concluído
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
                            <span className="text-sm font-normal text-label-secondary">/1000</span>
                          </div>
                        )}
                        <div className="text-xs text-label-tertiary">
                          {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                        </div>
                        {!attempt.completed_at && (
                          <Link href={`/cip/interpretacao/${attempt.case_id}`}>
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
                      Complete um caso para ver seu histórico
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
