'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Sparkles, UserRoundPlus, Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { createClient } from '@/lib/supabase/client'
import { spring } from '@/lib/motion'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectToRaw = searchParams.get('redirectTo')
  const redirectTo = redirectToRaw && redirectToRaw.startsWith('/') ? redirectToRaw : '/'

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push(redirectTo)
      router.refresh()
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
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
        <div className="relative mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <motion.div
            className="darwin-panel-strong w-full p-7 text-center md:p-9"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <BrandLogo variant="horizontal" size="lg" className="mb-4" priority />
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold text-label-primary">Verifique seu email</h2>
            <p className="mt-2 text-sm text-label-secondary">
              Enviamos um link de confirmação para <strong className="text-label-primary">{email}</strong>.
            </p>
            <Link
              href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="darwin-focus-ring darwin-nav-link mt-6 inline-flex rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500"
            >
              Voltar para login
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

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
              <Sparkles className="h-3.5 w-3.5" />
              Novo ciclo de estudo
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-label-primary">
              Crie sua conta e comece um fluxo de estudo de alto desempenho.
            </h2>
            <p className="mt-4 text-label-secondary">
              Em poucos minutos você já pode iniciar simulados, montar provas personalizadas e acompanhar evolução por área.
            </p>
            <div className="mt-7 rounded-2xl border border-separator/70 bg-surface-1/55 p-4">
              <p className="text-sm font-medium text-label-primary">Inclui desde o primeiro acesso:</p>
              <ul className="mt-3 space-y-2 text-sm text-label-secondary">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Trilha adaptativa baseada em desempenho</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Flashcards com repetição espaçada</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Diagnóstico de lacunas e recomendações IA</li>
              </ul>
            </div>
            <motion.div
              className="darwin-image-tile mt-6 h-44"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: 0.08 }}
            >
              <Image
                src="/brand/kitA/conteudo-hero-v3-light-1200x630.png"
                alt="Experiência de onboarding para estudantes de medicina"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover object-center dark:hidden"
              />
              <Image
                src="/brand/kitA/conteudo-hero-v3-dark-1200x630.png"
                alt="Experiência de onboarding para estudantes de medicina"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="hidden object-cover object-center dark:block"
              />
              <div className="absolute inset-x-0 bottom-0 z-[3] p-3">
                <div className="rounded-xl border border-separator/70 bg-surface-1/70 p-2.5 backdrop-blur-lg">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-label-tertiary">Brand kit visual</p>
                  <p className="mt-1 text-sm font-medium text-label-primary">Onboarding premium com identidade Darwin.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.div
          className="w-full max-w-md justify-self-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
        >
          <div className="darwin-panel-strong border border-separator/80 p-6 md:p-8">
            <div className="mb-6 text-center">
              <BrandLogo variant="horizontal" size="lg" className="mb-4" priority />
              <h1 className="text-3xl font-semibold text-label-primary">Criar conta</h1>
              <p className="mt-2 text-sm text-label-secondary">Comece sua preparação para o ENAMED.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/12 px-3 py-2.5 text-sm text-label-primary">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-label-primary">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="darwin-focus-ring w-full rounded-xl border border-separator bg-surface-2/75 px-4 py-3 text-label-primary placeholder-label-tertiary transition focus:border-emerald-500"
                  placeholder="Seu nome"
                  required
                />
              </div>

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
                <p className="mt-2 text-xs text-label-tertiary">
                  Cadastro livre. Se necessário, enviaremos um e-mail para confirmar sua conta.
                </p>
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
                    placeholder="Mínimo 6 caracteres"
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

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-label-primary">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="darwin-focus-ring w-full rounded-xl border border-separator bg-surface-2/75 px-4 py-3 pr-12 text-label-primary placeholder-label-tertiary transition focus:border-emerald-500"
                    placeholder="Digite a senha novamente"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((state) => !state)}
                    className="darwin-focus-ring absolute inset-y-1.5 right-1.5 inline-flex items-center justify-center rounded-lg px-2.5 text-label-tertiary hover:bg-surface-3/70 hover:text-label-secondary"
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="darwin-focus-ring darwin-nav-link mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-3 font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserRoundPlus className="h-4 w-4" />
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-label-secondary">
              Já tem conta?{' '}
              <Link
                href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="font-medium text-emerald-300 hover:text-emerald-200"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
