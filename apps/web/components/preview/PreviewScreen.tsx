import Image from 'next/image'
import Link from 'next/link'

interface PreviewScreenProps {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  bullets: string[]
  livePath: string
}

export function PreviewScreen({
  title,
  description,
  imageSrc,
  imageAlt,
  bullets,
  livePath,
}: PreviewScreenProps) {
  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-400">Prévia Pública</p>
            <h1 className="text-2xl md:text-3xl font-bold text-label-primary mt-1">{title}</h1>
            <p className="text-label-secondary mt-2 max-w-2xl">{description}</p>
          </div>
          <Link
            href="/preview"
            className="px-4 py-2 rounded-md border border-separator text-sm text-label-secondary hover:text-label-primary hover:bg-surface-2 transition-colors"
          >
            Voltar
          </Link>
        </div>

        <div className="relative mb-6 h-56 md:h-72 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/35" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-separator bg-surface-1 p-5">
            <h2 className="text-lg font-semibold text-label-primary mb-3">O que validar nesta tela</h2>
            <ul className="space-y-2">
              {bullets.map((item) => (
                <li key={item} className="text-sm text-label-secondary flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-separator bg-surface-1 p-5">
            <h2 className="text-lg font-semibold text-label-primary mb-3">Fluxo completo</h2>
            <p className="text-sm text-label-secondary mb-4">
              Para testar comportamento real com dados do usuário, entre na rota protegida.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/login?redirectTo=${encodeURIComponent(livePath)}`}
                className="px-4 py-3 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-sm font-medium text-center hover:from-emerald-400 hover:to-emerald-500 transition-colors"
              >
                Entrar e abrir rota real
              </Link>
              <Link
                href="/signup"
                className="px-4 py-3 rounded-md border border-separator text-sm text-label-secondary hover:text-label-primary hover:bg-surface-2 transition-colors text-center"
              >
                Criar conta para beta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
