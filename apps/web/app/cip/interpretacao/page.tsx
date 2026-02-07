import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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

const modalityIcons: Record<string, string> = {
  xray: '🩻',
  ct: '🧠',
  ekg: '💓',
  ultrasound: '📡',
  mri: '🧲',
}

const modalityLabels: Record<string, string> = {
  xray: 'Raio-X',
  ct: 'Tomografia',
  ekg: 'ECG',
  ultrasound: 'Ultrassom',
  mri: 'Ressonância',
}

const areaLabels: Record<string, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
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
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🩻</span>
            <h1 className="text-3xl font-bold text-white">
              Interpretação de Imagem
            </h1>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Pratique a interpretação de exames de imagem: Raio-X, Tomografia, ECG,
            Ultrassonografia e Ressonância. Identifique achados, formule diagnósticos e
            proponha condutas em 4 etapas guiadas.
          </p>
          <Link href="/cip" className="text-sm text-purple-400 hover:underline mt-2 inline-block">
            ← Voltar ao CIP
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
                <p className="text-sm text-slate-400">
                  Identifique o tipo de exame de imagem
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">2</span>
                </div>
                <h4 className="font-medium text-white mb-1">Achados</h4>
                <p className="text-sm text-slate-400">
                  Selecione os achados presentes na imagem
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">3</span>
                </div>
                <h4 className="font-medium text-white mb-1">Diagnóstico</h4>
                <p className="text-sm text-slate-400">
                  Formule o diagnóstico mais provável
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">4</span>
                </div>
                <h4 className="font-medium text-white mb-1">Conduta</h4>
                <p className="text-sm text-slate-400">
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
              <span className="text-2xl block mb-1">{modalityIcons[key]}</span>
              <span className="text-sm text-slate-300">{label}</span>
              <span className="text-xs text-slate-500 block">
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
                          <span className="text-2xl">
                            {modalityIcons[imageCase.modality] || '🖼️'}
                          </span>
                          <div>
                            <CardTitle>{imageCase.title_pt}</CardTitle>
                            <CardDescription>
                              {modalityLabels[imageCase.modality] || imageCase.modality}
                              {imageCase.area && ` • ${areaLabels[imageCase.area] || imageCase.area}`}
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
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {imageCase.clinical_context_pt}
                      </p>
                      {imageCase.times_attempted > 0 && (
                        <div className="mt-3 text-xs text-slate-500">
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
                      <span className="text-5xl mb-4 block">🩻</span>
                      <p className="text-slate-400">Nenhum caso disponível no momento</p>
                      <p className="text-sm text-slate-500 mt-2">
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
                        className="border-b border-slate-800 last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span>
                              {modalityIcons[attempt.cip_image_cases?.modality] || '🖼️'}
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
                            <span className="text-sm font-normal text-slate-400">/1000</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
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
                    <p className="text-slate-400 text-sm">Nenhuma tentativa ainda</p>
                    <p className="text-slate-500 text-xs mt-1">
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
