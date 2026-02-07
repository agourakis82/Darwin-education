'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Puzzle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DifficultyLevel } from '@darwin-education/shared'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

function CIPPraticaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const difficulty = (searchParams.get('difficulty') || 'facil') as DifficultyLevel

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function findOrCreatePuzzle() {
      const supabase = createClient()

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirectTo=/cip/pratica?difficulty=' + difficulty)
        return
      }

      try {
        // Try to find an existing public puzzle with this difficulty
        const { data: existingPuzzles, error: fetchError } = await supabase
          .from('cip_puzzles')
          .select('id')
          .eq('difficulty', difficulty)
          .eq('is_public', true)
          .eq('type', 'practice')
          .limit(1)

        if (fetchError) {
          console.error('Error fetching puzzles:', fetchError)
          setError(
            'Ainda não há puzzles disponíveis para esta dificuldade. Por favor, peça ao administrador para popular o banco de dados com puzzles de exemplo.'
          )
          setLoading(false)
          return
        }

        if (existingPuzzles && existingPuzzles.length > 0) {
          // Redirect to the existing puzzle
          const puzzle = existingPuzzles[0] as { id: string }
          router.push(`/cip/${puzzle.id}`)
        } else {
          // No puzzle exists, show message
          setError(
            'Ainda não há puzzles de prática disponíveis. Por favor, contate o administrador para adicionar puzzles de exemplo ao banco de dados.'
          )
          setLoading(false)
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Erro ao buscar puzzle. Por favor, tente novamente.')
        setLoading(false)
      }
    }

    findOrCreatePuzzle()
  }, [difficulty, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-label-secondary">Buscando puzzle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
              <Puzzle className="w-8 h-8 text-label-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Puzzle não disponível
            </h2>
            <p className="text-label-secondary mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/cip')} fullWidth>
                Voltar para Puzzles
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} fullWidth>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function CIPPraticaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-label-secondary">Carregando...</p>
          </div>
        </div>
      }
    >
      <CIPPraticaContent />
    </Suspense>
  )
}
