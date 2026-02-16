'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Lock } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { createClient } from '@/lib/supabase/client'
import { CURRENT_EULA_VERSION } from '@/lib/legal/eula'

type LegalMetadata = {
  eula_version?: unknown
  eula_accepted_at?: unknown
  research_consent?: unknown
  research_consent_at?: unknown
  research_consent_revoked_at?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readLegalMetadata(userMetadata: unknown): {
  eulaVersion: string | null
  eulaAcceptedAt: string | null
  researchConsent: boolean | null
  researchConsentAt: string | null
  researchConsentRevokedAt: string | null
} {
  const raw = isRecord(userMetadata) ? (userMetadata.legal as LegalMetadata | undefined) : undefined
  const legal = raw && isRecord(raw) ? raw : undefined

  return {
    eulaVersion: typeof legal?.eula_version === 'string' ? legal.eula_version : null,
    eulaAcceptedAt: typeof legal?.eula_accepted_at === 'string' ? legal.eula_accepted_at : null,
    researchConsent: typeof legal?.research_consent === 'boolean' ? legal.research_consent : null,
    researchConsentAt: typeof legal?.research_consent_at === 'string' ? legal.research_consent_at : null,
    researchConsentRevokedAt:
      typeof legal?.research_consent_revoked_at === 'string' ? legal.research_consent_revoked_at : null,
  }
}

export default function LegalConsentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = useMemo(() => {
    const redirectToRaw = searchParams.get('redirectTo')
    return redirectToRaw && redirectToRaw.startsWith('/') ? redirectToRaw : '/'
  }, [searchParams])

  const [acceptedEula, setAcceptedEula] = useState(false)
  const [researchConsent, setResearchConsent] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [previous, setPrevious] = useState<ReturnType<typeof readLegalMetadata> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const session = data.session
        setHasSession(Boolean(session))
        setSessionReady(true)

        const legal = readLegalMetadata(session?.user?.user_metadata)
        setPrevious(legal)
        setAcceptedEula(legal.eulaVersion === CURRENT_EULA_VERSION)
        setResearchConsent(Boolean(legal.researchConsent))
      })
      .catch(() => {
        setHasSession(false)
        setSessionReady(true)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!hasSession) {
      setError('Faça login para registrar seu consentimento.')
      return
    }

    if (!acceptedEula) {
      setError('Você precisa aceitar o EULA (Termos de Uso) para continuar.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const nowIso = new Date().toISOString()

    const previousEulaAcceptedAt =
      previous?.eulaVersion === CURRENT_EULA_VERSION && typeof previous.eulaAcceptedAt === 'string'
        ? previous.eulaAcceptedAt
        : null

    const previousResearchConsent = previous?.researchConsent === true
    const previousResearchConsentAt = typeof previous?.researchConsentAt === 'string' ? previous.researchConsentAt : null
    const previousResearchConsentRevokedAt =
      typeof previous?.researchConsentRevokedAt === 'string' ? previous.researchConsentRevokedAt : null

    const nextResearchConsentAt = researchConsent
      ? previousResearchConsentAt || nowIso
      : null

    const nextResearchConsentRevokedAt =
      !researchConsent && previousResearchConsent
        ? nowIso
        : researchConsent
          ? null
          : previousResearchConsentRevokedAt

    const { error } = await supabase.auth.updateUser({
      data: {
        legal: {
          eula_version: CURRENT_EULA_VERSION,
          eula_accepted_at: previousEulaAcceptedAt || nowIso,
          research_consent: researchConsent,
          research_consent_at: nextResearchConsentAt,
          research_consent_revoked_at: nextResearchConsentRevokedAt,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Refresh token so middleware can see updated user_metadata.
    try {
      await supabase.auth.refreshSession()
    } catch {
      // ignore
    }

    setSuccess(true)
    setLoading(false)

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-10 md:px-6 md:py-14">
      <Image
        src="/images/branding/auth-bg-v2.png"
        alt="Fundo visual"
        fill
        sizes="100vw"
        priority
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface-0/68 via-surface-0/84 to-surface-0/95" />

      <div className="relative mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
        <div className="darwin-panel-strong w-full p-7 md:p-9">
          <div className="text-center">
            <BrandLogo variant="horizontal" size="lg" className="mb-4" priority />
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-separator/70 bg-surface-2/65 text-emerald-200">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-label-primary">Consentimento e termos</h1>
            <p className="mt-2 text-sm text-label-secondary">
              Para usar as áreas autenticadas, precisamos registrar sua aceitação do EULA e, se você desejar, o
              consentimento para uso de dados em pesquisa acadêmica.
            </p>
          </div>

          {!sessionReady ? (
            <div className="mt-6 rounded-2xl border border-separator/70 bg-surface-1/55 p-4 text-sm text-label-secondary">
              Carregando sessão…
            </div>
          ) : !hasSession ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-separator/70 bg-surface-1/55 p-4 text-sm text-label-secondary">
              <p>Você precisa estar logado para registrar o consentimento.</p>
              <Link
                href={`/login?redirectTo=${encodeURIComponent(`/legal/consent?redirectTo=${encodeURIComponent(redirectTo)}`)}`}
                className="darwin-focus-ring darwin-nav-link inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500"
              >
                Fazer login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error ? (
                <div className="rounded-xl border border-red-400/40 bg-red-500/12 px-3 py-2.5 text-sm text-label-primary">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/12 px-3 py-2.5 text-sm text-label-primary">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Consentimento registrado.
                  </span>
                </div>
              ) : null}

              <div className="space-y-3 rounded-2xl border border-separator/70 bg-surface-1/55 p-4">
                <label className="flex items-start gap-3 text-sm text-label-secondary">
                  <input
                    id="acceptedEula"
                    type="checkbox"
                    checked={acceptedEula}
                    onChange={(e) => setAcceptedEula(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-separator bg-surface-2/75 text-emerald-500"
                  />
                  <span>
                    Eu li e aceito o{' '}
                    <Link href="/legal/eula" className="font-medium text-emerald-300 hover:text-emerald-200">
                      EULA (Termos de Uso)
                    </Link>{' '}
                    (versão {CURRENT_EULA_VERSION}).
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-label-secondary">
                  <input
                    id="researchConsent"
                    type="checkbox"
                    checked={researchConsent}
                    onChange={(e) => setResearchConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-separator bg-surface-2/75 text-emerald-500"
                  />
                  <span>
                    Autorizo o uso dos meus dados para{' '}
                    <Link
                      href="/legal/eula#pesquisa-academica"
                      className="font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      pesquisa acadêmica
                    </Link>
                    . (Opcional)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="darwin-focus-ring darwin-nav-link mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Salvando…' : 'Continuar'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-label-tertiary">
            <Link href="/" className="hover:text-label-secondary">
              Voltar para início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

