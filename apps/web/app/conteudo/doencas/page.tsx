import Link from 'next/link'
import Image from 'next/image'

import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { listDiseases, type EnamedArea } from '@/lib/medical'
import { ContentSearch } from '../components/ContentSearch'

const AREAS: Array<{ value: EnamedArea; label: string }> = [
  { value: 'clinica_medica', label: 'Clínica Médica' },
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'pediatria', label: 'Pediatria' },
  { value: 'ginecologia_obstetricia', label: 'Ginecologia e Obstetrícia' },
  { value: 'saude_coletiva', label: 'Saúde Coletiva' },
]

const AREA_LABELS = Object.fromEntries(AREAS.map((area) => [area.value, area.label])) as Record<
  EnamedArea,
  string
>

type SearchParams = {
  q?: string
  area?: string
  page?: string
}

function toPageHref({ q, area, page }: { q?: string; area?: string; page?: number }) {
  const params = new URLSearchParams()

  if (q) params.set('q', q)
  if (area) params.set('area', area)
  if (page && page > 1) params.set('page', String(page))

  const query = params.toString()
  return query ? `/conteudo/doencas?${query}` : '/conteudo/doencas'
}

export default async function DoencasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = (params.q || '').trim()
  const area = AREAS.some((item) => item.value === params.area) ? (params.area as EnamedArea) : undefined
  const page = Math.max(1, Number(params.page || '1') || 1)

  const result = await listDiseases({ q, area, page, pageSize: 25 })
  const totalPages = Math.max(1, Math.ceil(result.count / result.pageSize))

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/conteudo" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Doenças</h1>
              <p className="text-sm text-label-secondary mt-1">{result.count} condições encontradas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <ContentSearch type="doencas" placeholder="Buscar por nome, CID-10 ou sintomas..." />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link
            href={toPageHref({ q })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              !area ? 'bg-emerald-600 text-white' : 'bg-surface-2 text-label-primary hover:bg-surface-3'
            }`}
          >
            Todas
          </Link>
          {AREAS.map((item) => (
            <Link
              key={item.value}
              href={toPageHref({ q, area: item.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                area === item.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-2 text-label-primary hover:bg-surface-3'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {result.error ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                title="Não foi possível carregar as doenças"
                description="Verifique as variáveis do Supabase e tente novamente."
              />
            </CardContent>
          </Card>
        ) : result.count === 0 && !q && !area ? (
          <Card>
            <CardContent className="py-8">
              <div className="relative mx-auto mb-6 h-44 w-full max-w-xl overflow-hidden rounded-xl border border-separator/70">
                <Image
                  src="/brand/kitA/empty-noresults-v3-light-1024x1024.png"
                  alt="Estado vazio para resultados de busca"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover object-center opacity-80 dark:hidden"
                />
                <Image
                  src="/brand/kitA/empty-noresults-v3-dark-1024x1024.png"
                  alt="Estado vazio para resultados de busca"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="hidden object-cover object-center opacity-80 dark:block"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/50 dark:hidden" />
                <div className="absolute inset-0 hidden bg-gradient-to-b from-surface-0/10 to-surface-0/65 dark:block" />
              </div>
              <EmptyState
                title="Catálogo em atualização"
                description="Ainda não há doenças disponíveis nesta base. Estamos sincronizando novos conteúdos."
              />
              <p className="text-center text-sm text-label-secondary mt-2">
                Enquanto isso, explore{' '}
                <Link href="/conteudo/teoria" className="text-emerald-400 hover:underline">
                  Teoria Clínica
                </Link>{' '}
                ou pratique em{' '}
                <Link href="/simulado" className="text-emerald-400 hover:underline">
                  Simulados
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        ) : result.count === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="relative mx-auto mb-6 h-44 w-full max-w-xl overflow-hidden rounded-xl border border-separator/70">
                <Image
                  src="/brand/kitA/empty-noresults-v3-light-1024x1024.png"
                  alt="Nenhum resultado encontrado"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover object-center opacity-80 dark:hidden"
                />
                <Image
                  src="/brand/kitA/empty-noresults-v3-dark-1024x1024.png"
                  alt="Nenhum resultado encontrado"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="hidden object-cover object-center opacity-80 dark:block"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/50 dark:hidden" />
                <div className="absolute inset-0 hidden bg-gradient-to-b from-surface-0/10 to-surface-0/65 dark:block" />
              </div>
              <EmptyState
                title="Nenhum resultado encontrado"
                description="Tente ajustar os filtros ou usar termos diferentes na busca."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {result.data.map((disease) => (
                <Link key={disease.id} href={`/conteudo/doencas/${disease.id}`}>
                  <Card className="hover:border-surface-4 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-label-primary">{disease.title}</h3>
                            {disease.cid10?.[0] && (
                              <span className="px-2 py-0.5 text-xs bg-surface-3 text-label-primary rounded">
                                {disease.cid10[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-emerald-400">{AREA_LABELS[disease.enamed_area as EnamedArea]}</span>
                            {disease.subcategoria && (
                              <>
                                <span className="text-label-quaternary">•</span>
                                <span className="text-sm text-label-secondary">{disease.subcategoria}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-label-secondary line-clamp-2">
                            {disease.summary || 'Resumo não disponível.'}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-label-tertiary flex-shrink-0 ml-4"
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
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Link
                href={toPageHref({ q, area, page: Math.max(1, page - 1) })}
                aria-disabled={page <= 1}
                className={`px-4 py-2 rounded-lg text-sm ${
                  page <= 1
                    ? 'pointer-events-none bg-surface-2 text-label-quaternary'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                Anterior
              </Link>
              <span className="text-sm text-label-secondary">
                Pagina {Math.min(page, totalPages)} de {totalPages}
              </span>
              <Link
                href={toPageHref({ q, area, page: Math.min(totalPages, page + 1) })}
                aria-disabled={page >= totalPages}
                className={`px-4 py-2 rounded-lg text-sm ${
                  page >= totalPages
                    ? 'pointer-events-none bg-surface-2 text-label-quaternary'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                Proxima
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
