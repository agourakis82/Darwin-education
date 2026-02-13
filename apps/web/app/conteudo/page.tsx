import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getMedicalCounts, getTheoryTopicCount } from '@/lib/medical'
import { getDarwinMfcProvenance } from '@/lib/darwinMfc/provenance'

export const metadata: Metadata = {
  title: 'Conteúdo Médico | Darwin Education',
  description: 'Base de conhecimento clínico com doenças, medicamentos e teoria para estudo ENAMED.',
  openGraph: {
    title: 'Conteúdo Médico | Darwin Education',
    description: 'Base de conhecimento clínico com doenças, medicamentos e teoria para estudo ENAMED.',
    images: [
      {
        url: '/brand/kitA/conteudo-hero-v3-dark-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Conteúdo Médico Darwin Education',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conteúdo Médico | Darwin Education',
    description: 'Base de conhecimento clínico com doenças, medicamentos e teoria para estudo ENAMED.',
    images: ['/brand/kitA/conteudo-hero-v3-dark-1200x630.png'],
  },
}

const colorClasses = {
  emerald: {
    card: 'hover:border-emerald-500/50',
    icon: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30',
    stat: 'text-emerald-400',
    titleHover: 'group-hover:text-emerald-300',
    chevronHover: 'group-hover:text-emerald-300',
  },
  blue: {
    card: 'hover:border-blue-500/50',
    icon: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
    stat: 'text-blue-400',
    titleHover: 'group-hover:text-blue-300',
    chevronHover: 'group-hover:text-blue-300',
  },
  violet: {
    card: 'hover:border-violet-500/50',
    icon: 'bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30',
    stat: 'text-violet-400',
    titleHover: 'group-hover:text-violet-300',
    chevronHover: 'group-hover:text-violet-300',
  },
} as const

export default async function ConteudoPage() {
  const provenance = getDarwinMfcProvenance()

  const [medicalCountsResult, theoryTopicsCountResult] = await Promise.allSettled([getMedicalCounts(), getTheoryTopicCount()])

  const medicalCounts =
    medicalCountsResult.status === 'fulfilled'
      ? medicalCountsResult.value
      : { diseases: 0, medications: 0, error: medicalCountsResult.reason ?? null }

  const theoryTopicsCount = theoryTopicsCountResult.status === 'fulfilled' ? theoryTopicsCountResult.value : 0
  const hasLoadError = Boolean(medicalCounts.error) || theoryTopicsCountResult.status === 'rejected'

  const sections = [
    {
      id: 'doencas' as const,
      title: 'Doenças',
      description: 'Base de conhecimento com condições médicas organizadas por especialidade.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'emerald' as const,
      stats: { count: medicalCounts.diseases, label: 'condições' },
      href: '/conteudo/doencas',
    },
    {
      id: 'medicamentos' as const,
      title: 'Medicamentos',
      description: 'Guia farmacológico com classes, mecanismos e indicações clínicas.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      color: 'blue' as const,
      stats: { count: medicalCounts.medications, label: 'medicamentos' },
      href: '/conteudo/medicamentos',
    },
    {
      id: 'teoria' as const,
      title: 'Teoria Clínica',
      description: 'Conteúdo teórico estruturado para estudo orientado por conceitos-chave.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z"
          />
        </svg>
      ),
      color: 'violet' as const,
      stats: { count: theoryTopicsCount, label: 'tópicos' },
      href: '/conteudo/teoria',
    },
  ]

  const missingMedicalSeed = medicalCounts.diseases === 0 || medicalCounts.medications === 0

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Conteúdo Médico</h1>
          <p className="text-sm text-label-secondary mt-1">
            Base de conhecimento para estudo e consulta rápida.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasLoadError ? (
          <Card className="mb-6 border-amber-700/40">
            <CardContent className="py-4 text-sm text-label-secondary">
              Alguns dados de catálogo não puderam ser carregados agora. Você ainda pode navegar pelas seções e tentar
              novamente mais tarde.
            </CardContent>
          </Card>
        ) : null}

        <div className="relative mb-8 h-48 md:h-56 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/brand/kitA/conteudo-hero-v3-light-1536x1024.png"
            alt="Hero de conteúdo médico Darwin"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-80 dark:hidden"
          />
          <Image
            src="/brand/kitA/conteudo-hero-v3-dark-1536x1024.png"
            alt="Hero de conteúdo médico Darwin"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="hidden object-cover object-center opacity-80 dark:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/55 to-white/25 dark:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-surface-0/92 via-surface-0/72 to-surface-0/30 dark:block" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <div className="max-w-xl">
              <p className="text-xl md:text-2xl font-semibold text-label-primary">
                Conteúdo médico com foco clínico.
              </p>
              <p className="text-sm md:text-base text-label-secondary mt-1">
                Navegue por doenças, medicamentos e teoria com base unificada.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => {
            const style = colorClasses[section.color]

            return (
              <Link key={section.id} href={section.href}>
                <Card className={`h-full transition-colors cursor-pointer group ${style.card}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg transition-colors ${style.icon}`}>{section.icon}</div>
                      <div className="flex-1">
                        <h2 className={`text-xl font-semibold text-label-primary transition-colors ${style.titleHover}`}>
                          {section.title}
                        </h2>
                        <p className="text-sm text-label-secondary mt-1">{section.description}</p>
                        <div className="mt-4 flex items-center gap-4">
                          <span className={`text-2xl font-bold ${style.stat}`}>{section.stats.count}</span>
                          <span className="text-label-tertiary">{section.stats.label}</span>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-label-tertiary transition-colors ${style.chevronHover}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Busca rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-label-secondary mb-4">
              A busca detalhada fica nas páginas de Doenças e Medicamentos, com filtros por área e classe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/conteudo/doencas"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500"
              >
                Buscar em Doenças
              </Link>
              <Link
                href="/conteudo/medicamentos"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500"
              >
                Buscar em Medicamentos
              </Link>
            </div>
          </CardContent>
        </Card>

        {missingMedicalSeed && (
          <Card className="mb-8 border-amber-700/40">
            <CardContent className="py-4 text-sm text-label-secondary">
              A base Darwin-MFC ainda está em sincronização e alguns catálogos podem aparecer vazios
              temporariamente. Enquanto isso, você já pode estudar em{' '}
              <Link href="/conteudo/teoria" className="text-emerald-400 hover:underline">
                Teoria Clínica
              </Link>{' '}
              e praticar em{' '}
              <Link href="/simulado" className="text-emerald-400 hover:underline">
                Simulados
              </Link>
              .
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-label-secondary">
                <p className="font-medium text-label-primary mb-1">Dica de Estudo</p>
                <p>
                  Use o conteúdo médico como referência rápida durante a revisão de questões e
                  complemente com flashcards para reforço ativo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="bg-surface-1/40">
            <CardHeader>
              <CardTitle>Proveniência do corpus</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-label-secondary space-y-2">
              <p>
                Snapshot (UTC): <span className="text-label-primary">{provenance.timestamp_utc || 'Não disponível'}</span>
              </p>
              <p>
                Doenças: <span className="text-label-primary">{provenance.diseases?.unique_count_by_id ?? 'n/d'}</span>{' '}
                únicas ({provenance.diseases?.raw_count ?? 'n/d'} entradas brutas)
              </p>
              <p>
                Medicamentos:{' '}
                <span className="text-label-primary">{provenance.medications?.unique_count_by_id ?? 'n/d'}</span> únicos (
                {provenance.medications?.raw_count ?? 'n/d'} entradas brutas)
              </p>
              <p className="text-xs text-label-tertiary">
                Conteúdo baseado no Darwin‑MFC (submódulo) com contagem runtime documentada em `_paperpack/derived/`.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-1/40">
            <CardHeader>
              <CardTitle>Referências</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-label-secondary space-y-2">
              <p>
                Cada entrada de doença/medicamento exibe referências próprias quando disponíveis (seção “Referências” no
                detalhe).
              </p>
              <p className="text-xs text-label-tertiary">
                Se uma referência estiver ausente, a UI mostra “sem metadados” e a entrada segue marcada para revisão de
                proveniência.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
