import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-label-tertiary" />
        </div>
        <h2 className="text-2xl font-bold text-label-primary mb-3">
          Página não encontrada
        </h2>
        <p className="text-label-secondary mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Button asChild>
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  )
}
