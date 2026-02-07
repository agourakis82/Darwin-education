'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSuccess?: () => void
  redirectTo?: string
}

export function AuthForm({ mode, onSuccess, redirectTo }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectTo ? `${window.location.origin}${redirectTo}` : undefined,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-label-primary mb-2">
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-surface-2 border border-separator rounded-lg text-white placeholder-label-tertiary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Seu nome"
            required
          />
        </div>
      )}

      <div>
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

      <div>
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

      <Button
        type="submit"
        disabled={loading}
        loading={loading}
        fullWidth
      >
        {loading
          ? mode === 'login'
            ? 'Entrando...'
            : 'Criando conta...'
          : mode === 'login'
            ? 'Entrar'
            : 'Criar conta'}
      </Button>
    </form>
  )
}
