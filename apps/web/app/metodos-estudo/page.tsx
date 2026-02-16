'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import {
  Timer,
  Brain,
  Network,
  HelpCircle,
  Users,
  CalendarDays,
  ArrowUpRight,
  ArrowLeft,
} from 'lucide-react'
import type { ReactNode } from 'react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

const methods = [
  {
    slug: 'pomodoro',
    icon: <Timer className="w-6 h-6" />,
    title: 'Pomodoro',
    description: 'Ciclos de 25min de foco intenso com pausas estratégicas',
    color: 'emerald' as const,
    hasTool: true,
  },
  {
    slug: 'revisao-espacada',
    icon: <Brain className="w-6 h-6" />,
    title: 'Revisão Espaçada',
    description: 'Memorize a longo prazo com intervalos científicos SM-2',
    color: 'purple' as const,
    hasTool: false,
  },
  {
    slug: 'mapas-mentais',
    icon: <Network className="w-6 h-6" />,
    title: 'Mapas Mentais',
    description: 'Organize conhecimento médico visualmente com conexões',
    color: 'emerald' as const,
    hasTool: false,
  },
  {
    slug: 'questoes-ativas',
    icon: <HelpCircle className="w-6 h-6" />,
    title: 'Questões Ativas',
    description: 'Active recall: recupere, erre, corrija e consolide',
    color: 'purple' as const,
    hasTool: false,
  },
  {
    slug: 'estudo-grupo',
    icon: <Users className="w-6 h-6" />,
    title: 'Estudo em Grupo',
    description: 'Estratégias para discussão clínica e aprendizado coletivo',
    color: 'emerald' as const,
    hasTool: false,
  },
  {
    slug: 'gestao-tempo',
    icon: <CalendarDays className="w-6 h-6" />,
    title: 'Gestão de Tempo',
    description: 'Planeje sua semana com distribuição inteligente por área',
    color: 'purple' as const,
    hasTool: true,
  },
]

export default function MetodosEstudoPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Início
          </Link>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring.gentle}>
            <h1 className="text-2xl font-bold">Métodos de Estudo</h1>
            <p className="text-sm text-label-secondary mt-1">
              Técnicas baseadas em evidências para o ENAMED
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-8 h-44 md:h-52 overflow-hidden rounded-2xl border border-separator/70">
          <Image
            src="/images/branding/metodos-estudo-hero-apple-v1.png"
            alt="Visual de métodos de estudo com materiais organizados"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/35" />
          <div className="relative z-10 h-full flex items-end p-5 md:p-7">
            <p className="text-sm md:text-base text-label-secondary max-w-lg">
              Estratégias práticas para foco, retenção e constância no preparo para o ENAMED.
            </p>
          </div>
        </div>
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {methods.map((method) => (
            <MethodCard key={method.slug} {...method} />
          ))}
        </motion.div>
      </main>
    </div>
  )
}

function MethodCard({
  slug,
  icon,
  title,
  description,
  color,
  hasTool,
}: {
  slug: string
  icon: ReactNode
  title: string
  description: string
  color: 'emerald' | 'purple'
  hasTool: boolean
}) {
  const iconBg = color === 'emerald' ? 'bg-emerald-500/10' : 'bg-purple-500/10'
  const iconText = color === 'emerald' ? 'text-emerald-400' : 'text-purple-400'

  return (
    <motion.div variants={item} whileHover={{ y: -4, transition: spring.snappy }}>
      <Link
        href={`/metodos-estudo/${slug}`}
        className="group block p-6 bg-surface-2 rounded-lg shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:bg-surface-3/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconText}`}>
            {icon}
          </div>
          <div className="flex items-center gap-2">
            {hasTool && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded">
                Ferramenta
              </span>
            )}
            <ArrowUpRight className="w-4 h-4 text-label-quaternary group-hover:text-label-secondary transition-colors" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-label-primary mb-1">{title}</h2>
        <p className="text-label-tertiary text-sm">{description}</p>
      </Link>
    </motion.div>
  )
}
