'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShieldCheck, Brain, Clock3, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { createClient } from '@/lib/supabase/client'
import { spring } from '@/lib/motion'

function AuthHighlight({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="darwin-panel flex items-start gap-3 rounded-2xl p-3">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-separator/80 bg-surface-2/70 text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-label-primary">{title}</p>
        <p className="mt-1 text-xs text-label-secondary">{description}</p>
      </div>
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = redirectToRaw && redirectToRaw.startsWith('/') ? redirectToRaw : '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
    >
      <div className="darwin-panel-strong border border-separator/80 p-6 md:p-8">
        <div className="mb-6 text-center">
          <BrandLogo variant="horizontal" size="lg" className="mb-4" priority />
          <h1 className="text-3xl font-semibold text-label-primary">Entrar</h1>
          <p className="mt-2 text-sm text-label-secondary">Acesse sua rotina de preparação ENAMED.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/12 px-3 py-2.5 text-sm text-label-primary">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-label-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="darwin-focus-ring w-full rounded-xl border border-separator bg-surface-2/75 px-4 py-3 text-label-primary placeholder-label-tertiary transition focus:border-emerald-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-label-primary">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="darwin-focus-ring w-full rounded-xl border border-separator bg-surface-2/75 px-4 py-3 pr-12 text-label-primary placeholder-label-tertiary transition focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((state) => !state)}
                className="darwin-focus-ring absolute inset-y-1.5 right-1.5 inline-flex items-center justify-center rounded-lg px-2.5 text-label-tertiary hover:bg-surface-3/70 hover:text-label-secondary"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="darwin-focus-ring darwin-nav-link mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-3 font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Entrar'}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-label-secondary">
          Não tem conta?{' '}
          <Link
            href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-emerald-300 hover:text-emerald-200"
          >
            Criar agora
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-10 md:px-6 md:py-14">
      <Image
        src="/images/branding/auth-bg-v2.png"
        alt="Fundo visual de autenticação"
        fill
        sizes="100vw"
        priority
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface-0/68 via-surface-0/84 to-surface-0/95" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          className="hidden lg:block"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={spring.gentle}
        >
          <div className="darwin-panel-strong p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Darwin Premium Experience
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-label-primary">
              Ambiente clínico de estudo com performance de produto.
            </h2>
            <p className="mt-4 text-label-secondary">
              Acesso rápido às trilhas, simulados e recomendações inteligentes para manter constância e progresso.
            </p>
            <div className="mt-7 space-y-3">
              <AuthHighlight
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Dados e sessão protegidos"
                description="Autenticação segura e fluxo otimizado para uso diário."
              />
              <AuthHighlight
                icon={<Brain className="h-4 w-4" />}
                title="Contexto de aprendizado unificado"
                description="Seus resultados, lacunas e plano de estudo em um único lugar."
              />
              <AuthHighlight
                icon={<Clock3 className="h-4 w-4" />}
                title="Entrada em segundos"
                description="Volte para sua rotina com mínima fricção e continuidade total."
              />
            </div>
            <motion.div
              className="darwin-image-tile mt-6 h-44"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.08 }}
            >
              <Image
                src="/brand/kitA/onb-repeticao-espacada-v3-light-1200x630.png"
                alt="Fluxo de estudo com repetição espaçada"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover object-center dark:hidden"
              />
              <Image
                src="/brand/kitA/onb-repeticao-espacada-v3-dark-1200x630.png"
                alt="Fluxo de estudo com repetição espaçada"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="hidden object-cover object-center dark:block"
              />
              <div className="absolute inset-x-0 bottom-0 z-[3] p-3">
                <div className="rounded-xl border border-separator/70 bg-surface-1/70 p-2.5 backdrop-blur-lg">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-label-tertiary">Apple-quality flow</p>
                  <p className="mt-1 text-sm font-medium text-label-primary">Entrada rápida com continuidade de sessão.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <Suspense
          fallback={
            <div className="w-full max-w-md justify-self-center">
              <div className="darwin-panel-strong animate-pulse p-6 md:p-8">
                <div className="mb-6 h-12 rounded-xl bg-surface-2" />
                <div className="h-12 rounded-xl bg-surface-2" />
                <div className="mt-4 h-12 rounded-xl bg-surface-2" />
                <div className="mt-6 h-12 rounded-xl bg-surface-2" />
              </div>
            </div>
          }
        >
          <div className="justify-self-center">
            <LoginForm />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
