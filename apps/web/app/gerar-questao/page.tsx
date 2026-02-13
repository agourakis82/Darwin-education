import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function GerarQuestaoPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-label-primary flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Gerar Questão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-label-secondary">
            Esta rota existe para compatibilidade. O gerador de questões está disponível no QGen.
          </p>
          <Link href="/qgen" className="block">
            <Button fullWidth className="darwin-nav-link">
              Abrir QGen
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
