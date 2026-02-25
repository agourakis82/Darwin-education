'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function FlashcardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Flashcards error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <Layers className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-label-primary mb-3">
          Erro nos flashcards
        </h2>
        <p className="text-label-secondary mb-8">
          Não foi possível carregar os flashcards. Tente novamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            Tentar Novamente
          </Button>
          <Button variant="tinted" asChild>
            <Link href="/">Página Inicial</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
