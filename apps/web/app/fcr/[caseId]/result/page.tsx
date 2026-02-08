'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, Gauge } from 'lucide-react'
import { useFCRStore } from '@/lib/stores/fcrStore'
import { FCRResults } from '../../components/FCRResults'
import { Button } from '@/components/ui/Button'

export default function FCRResultPage() {
  const router = useRouter()
  const { result, currentCase, resetCase } = useFCRStore()

  useEffect(() => {
    if (!result) {
      router.push('/fcr')
    }
  }, [result, router])

  if (!result || !currentCase) return null

  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-violet-400" />
          <h1 className="text-xl font-bold text-white">{currentCase.titlePt}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Resultado do Raciocinio Clinico Fractal
        </p>

        {/* Results */}
        <FCRResults score={result} />

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              resetCase()
              router.push('/fcr')
            }}
          >
            Tentar Outro Caso
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push('/fcr')}
          >
            Ver Todos os Casos
          </Button>
        </div>

        {/* Calibration Dashboard CTA */}
        <Link
          href="/fcr/calibracao"
          className="mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 border border-border hover:border-violet-500/30 rounded-lg text-sm text-muted-foreground hover:text-violet-300 transition-colors"
        >
          <Gauge className="w-4 h-4" />
          Ver Dashboard de Calibracao Metacognitiva
        </Link>
      </div>
    </div>
  )
}
