import Link from 'next/link'
import {
  ClipboardList,
  SlidersHorizontal,
  Brain,
  Target,
  FileText,
  ArrowUpRight,
} from 'lucide-react'

const previewRoutes = [
  {
    href: '/preview/simulado',
    title: 'Simulado',
    description: 'Visual de jornada de prova e chamadas de ação.',
    icon: ClipboardList,
  },
  {
    href: '/preview/montar-prova',
    title: 'Montar Prova',
    description: 'Hero, hierarquia de filtros e densidade da configuração.',
    icon: SlidersHorizontal,
  },
  {
    href: '/preview/fcr',
    title: 'FCR',
    description: 'Narrativa visual do raciocínio clínico fractal.',
    icon: Brain,
  },
  {
    href: '/preview/ddl',
    title: 'DDL',
    description: 'Clareza da proposta e onboarding de diagnóstico.',
    icon: Target,
  },
  {
    href: '/preview/caso-clinico',
    title: 'Caso Clínico',
    description: 'Configuração inicial e leitura do hero para estudo orientado.',
    icon: FileText,
  },
]

export default function PreviewHubPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide text-emerald-400">Prévia Pública</p>
          <h1 className="text-3xl font-bold text-label-primary mt-1">Darwin UX Preview</h1>
          <p className="text-label-secondary mt-2 max-w-2xl">
            Rotas abertas para auditoria de UX sem login, com foco em navegação, legibilidade e consistência visual.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {previewRoutes.map((route) => {
            const Icon = route.icon
            return (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-xl border border-separator bg-surface-1 p-5 hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-label-quaternary group-hover:text-label-secondary transition-colors" />
                </div>
                <h2 className="text-lg font-semibold text-label-primary">{route.title}</h2>
                <p className="text-sm text-label-secondary mt-1">{route.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
