import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-surface-3 mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Página não encontrada
        </h2>
        <p className="text-label-secondary mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  )
}
