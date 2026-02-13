import Link from 'next/link'
import Image from 'next/image'

import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { listMedications, listMedicationClasses } from '@/lib/medical'
import { ContentSearch } from '../components/ContentSearch'

const TOP_DRUG_CLASSES = [
  'antibiotico',
  'anti_hipertensivo',
  'antidiabetico',
  'analgesico',
  'antidepressivo',
  'anti_inflamatorio',
]

type SearchParams = {
  q?: string
  page?: string
  drugClass?: string
  classe?: string
}

function formatClassLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(' ')
}

function toPageHref({ q, drugClass, page }: { q?: string; drugClass?: string; page?: number }) {
  const params = new URLSearchParams()

  if (q) params.set('q', q)
  if (drugClass) params.set('drugClass', drugClass)
  if (page && page > 1) params.set('page', String(page))

  const query = params.toString()
  return query ? `/conteudo/medicamentos?${query}` : '/conteudo/medicamentos'
}

export default async function MedicamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = (params.q || '').trim()
  const drugClass = (params.drugClass || params.classe || '').trim() || undefined
  const page = Math.max(1, Number(params.page || '1') || 1)

  const [medicationsResult, classesResult] = await Promise.all([
    listMedications({ q, drugClass, page, pageSize: 25 }),
    listMedicationClasses(),
  ])

  const totalPages = Math.max(1, Math.ceil(medicationsResult.count / medicationsResult.pageSize))

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
              <h1 className="text-2xl font-bold">Medicamentos</h1>
              <p className="text-sm text-label-secondary mt-1">
                {medicationsResult.count} medicamentos encontrados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <ContentSearch type="medicamentos" placeholder="Buscar por nome, classe ou ATC..." />
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <form action="/conteudo/medicamentos" method="get" className="flex items-center gap-3">
            {q && <input type="hidden" name="q" value={q} />}
            <label htmlFor="drugClass" className="text-sm text-label-secondary">
              Classe:
            </label>
            <select
              id="drugClass"
              name="drugClass"
              defaultValue={drugClass || ''}
              className="bg-surface-2 border border-separator rounded-lg px-3 py-2 text-sm text-label-primary"
            >
              <option value="">Todas</option>
              {classesResult.data.map((value) => (
                <option key={value} value={value}>
                  {formatClassLabel(value)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-surface-2 text-sm text-label-primary hover:bg-surface-3"
            >
              Aplicar
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {TOP_DRUG_CLASSES.map((value) => (
              <Link
                key={value}
                href={toPageHref({ q, drugClass: value })}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                  drugClass === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-2 text-label-primary hover:bg-surface-3'
                }`}
              >
                {formatClassLabel(value)}
              </Link>
            ))}
          </div>
        </div>

        {medicationsResult.error || classesResult.error ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                title="Não foi possível carregar os medicamentos"
                description="Verifique as variáveis do Supabase e tente novamente."
              />
            </CardContent>
          </Card>
        ) : medicationsResult.count === 0 && !q && !drugClass ? (
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
                description="Ainda não há medicamentos disponíveis nesta base. Estamos sincronizando novos conteúdos."
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
        ) : medicationsResult.count === 0 ? (
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
              {medicationsResult.data.map((medication) => (
                <Link key={medication.id} href={`/conteudo/medicamentos/${medication.id}`}>
                  <Card className="hover:border-surface-4 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-label-primary">{medication.generic_name}</h3>
                            {medication.atc_code && (
                              <span className="px-2 py-0.5 text-xs bg-surface-3 text-label-primary rounded">
                                {medication.atc_code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-blue-400">{formatClassLabel(medication.drug_class)}</span>
                            {medication.subclass && (
                              <>
                                <span className="text-label-quaternary">•</span>
                                <span className="text-sm text-label-secondary">{formatClassLabel(medication.subclass)}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-label-secondary line-clamp-2">
                            {medication.summary || 'Resumo não disponível.'}
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
                href={toPageHref({ q, drugClass, page: Math.max(1, page - 1) })}
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
                href={toPageHref({ q, drugClass, page: Math.min(totalPages, page + 1) })}
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
