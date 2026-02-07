'use client'

import { useEffect } from 'react'

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
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Algo deu errado
        </h2>
        <p className="text-label-secondary mb-8">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-surface-3 hover:bg-surface-4 text-white font-medium rounded-lg transition-colors"
          >
            Página Inicial
          </a>
        </div>
      </div>
    </div>
  )
}
