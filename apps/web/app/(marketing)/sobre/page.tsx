'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Card } from '@/components/ui/Card'
import { FlaskConical, Brain, Target, ArrowRight } from 'lucide-react'

const values = [
  {
    icon: FlaskConical,
    tone: 'emerald' as const,
    title: 'Fundamentado em ciência',
    description:
      'Cada algoritmo — TRI 3PL, FSRS v4, CAT — é baseado em décadas de pesquisa em psicometria educacional e ciência cognitiva. Não usamos gamificação sem propósito; usamos evidência.',
  },
  {
    icon: Brain,
    tone: 'violet' as const,
    title: 'Adaptativo ao aprendiz',
    description:
      'A plataforma aprende com seu desempenho em tempo real. Questões, flashcards e trilhas se ajustam ao seu nível estimado de habilidade, otimizando cada minuto de estudo.',
  },
  {
    icon: Target,
    tone: 'emerald' as const,
    title: 'Foco no que importa',
    description:
      'ENAMED tem uma estrutura bem definida: 5 áreas, 100 questões, psicometria TRI. Construímos a plataforma para essa realidade — sem fluff, sem conteúdo genérico.',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-system-background">
      {/* Hero */}
      <section className="px-4 pt-12 pb-12 md:px-6 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <span className="inline-block rounded-full border border-separator/60 bg-surface-1/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-tertiary-label">
              Sobre
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-label md:text-5xl">
              Democratizando a preparação médica no Brasil
            </h1>
            <p className="mt-5 text-base leading-relaxed text-secondary-label md:text-lg">
              Darwin Education nasceu da observação de que a maioria das ferramentas de preparação para o ENAMED
              são estáticas, não calibradas e ignoram décadas de pesquisa em aprendizagem. Construímos diferente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission statement */}
      <section className="px-4 pb-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.1 }}
          >
            <Card variant="default" className="p-8 md:p-10">
              <div className="darwin-mesh-bg absolute inset-0 rounded-[inherit] opacity-60" aria-hidden="true" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-tertiary-label">Nossa missão</p>
                <blockquote className="mt-4 text-xl font-medium leading-relaxed text-label md:text-2xl">
                  &ldquo;Dar a todo estudante de medicina no Brasil acesso às mesmas ferramentas psicométricas
                  que as melhores instituições de pesquisa educacional usam — de graça, no celular, em português.&rdquo;
                </blockquote>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={spring.gentle}
            className="mb-6 text-2xl font-semibold text-label md:text-3xl"
          >
            O que nos guia
          </motion.h2>

          <motion.div
            className="grid gap-4 md:grid-cols-3 md:gap-5"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {values.map((value) => {
              const Icon = value.icon
              const iconTone =
                value.tone === 'emerald'
                  ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35'
                  : 'text-violet-300 bg-violet-500/15 border-violet-500/35'

              return (
                <motion.div key={value.title} variants={item}>
                  <Card variant="default" className="h-full p-6">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-label">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-secondary-label">{value.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={spring.gentle}
          >
            <h2 className="mb-6 text-2xl font-semibold text-label md:text-3xl">Tecnologia</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Scoring', value: 'TRI 3PL + EAP (Expected A Posteriori)' },
                { label: 'Repetição espaçada', value: 'FSRS v4 (Free Spaced Repetition Scheduler)' },
                { label: 'Adaptativo', value: 'CAT com critério de seleção por máxima informação' },
                { label: 'IA', value: 'Claude (Anthropic) com RAG sobre base clínica' },
                { label: 'Conteúdo', value: 'Darwin-MFC — 368 doenças CID-10 + 690 fármacos ATC' },
                { label: 'Diagnóstico', value: 'DDL — Deficit-Driven Learning Engine' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-separator/60 bg-surface-1/50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary-label">{label}</p>
                  <p className="mt-1 text-sm font-medium text-label">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-label">Junte-se a nós</h2>
          <p className="mt-2 text-sm text-secondary-label">Crie sua conta e comece a estudar com ciência.</p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-elevation-2 transition-all duration-ios-fast hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97]"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
