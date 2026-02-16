import Link from 'next/link'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

export default async function BetaGatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const redirectTo =
    typeof resolvedSearchParams?.redirectTo === 'string' ? resolvedSearchParams.redirectTo : '/'

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-10 md:px-6 md:py-14">
      <Image
        src="/images/branding/auth-bg-v2.png"
        alt="Fundo visual do beta"
        fill
        sizes="100vw"
        priority
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface-0/68 via-surface-0/84 to-surface-0/95" />

      <div className="relative mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
        <div className="darwin-panel-strong w-full p-7 text-center md:p-9">
          <BrandLogo variant="horizontal" size="lg" className="mb-4" priority />
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-separator/70 bg-surface-2/65 text-emerald-200">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-label-primary">Acesso restrito ao beta</h1>
          <p className="mt-2 text-sm text-label-secondary">
            Sua conta ainda não está habilitada para acessar esta área. O cadastro é livre, mas durante o beta
            algumas funcionalidades ficam disponíveis apenas para e-mails previamente autorizados.
            Se você acha que isso é um erro, fale com o time Darwin.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="darwin-focus-ring darwin-nav-link inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500"
            >
              Fazer login
            </Link>
            <Link
              href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="darwin-focus-ring darwin-nav-link inline-flex w-full items-center justify-center rounded-xl border border-separator/80 bg-surface-2/65 px-5 py-3 text-sm font-medium text-label-primary hover:bg-surface-3/70"
            >
              Criar conta
            </Link>
            <Link
              href="/"
              className="darwin-focus-ring darwin-nav-link inline-flex w-full items-center justify-center rounded-xl border border-separator/80 bg-surface-2/65 px-5 py-3 text-sm font-medium text-label-primary hover:bg-surface-3/70"
            >
              Voltar para início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
