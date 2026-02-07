'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-label-primary mb-3">
          Algo deu errado
        </h2>
        <p className="text-label-secondary mb-8">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            Tentar Novamente
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/">Página Inicial</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
