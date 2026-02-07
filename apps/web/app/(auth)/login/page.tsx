'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

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
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Darwin Education</h1>
        <p className="text-label-secondary">Faça login para continuar</p>
      </div>

      <form onSubmit={handleLogin} className="bg-surface-1 rounded-xl p-8 shadow-xl border border-separator">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-label-primary mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-surface-2 border border-separator rounded-lg text-white placeholder-label-tertiary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-label-primary mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface-2 border border-separator rounded-lg text-white placeholder-label-tertiary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="mt-6 text-center text-label-secondary text-sm">
          Não tem uma conta?{' '}
          <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Darwin Education</h1>
            <p className="text-label-secondary">Carregando...</p>
          </div>
          <div className="bg-surface-1 rounded-xl p-8 shadow-xl border border-separator animate-pulse">
            <div className="h-10 bg-surface-2 rounded mb-4" />
            <div className="h-10 bg-surface-2 rounded mb-6" />
            <div className="h-12 bg-surface-2 rounded" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
