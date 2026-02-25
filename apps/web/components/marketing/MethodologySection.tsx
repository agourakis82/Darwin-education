'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { FlaskConical, Brain, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const methods = [
  {
    icon: FlaskConical,
    tone: 'emerald' as const,
    title: 'TRI 3PL',
    subtitle: 'Item Response Theory',
    body: 'O modelo de 3 parâmetros (discriminação, dificuldade, acerto ao acaso) mede sua habilidade real, não o número de acertos. A pontuação theta é convertida em escala 0–1000 como o ENAMED oficial.',
  },
  {
    icon: Brain,
    tone: 'violet' as const,
    title: 'FSRS v4',
    subtitle: 'Spaced Repetition',
    body: 'Algoritmo de repetição espaçada de nova geração que calcula o intervalo ideal de revisão para cada flashcard individualmente, maximizando retenção e minimizando tempo de estudo.',
  },
  {
    icon: Zap,
    tone: 'emerald' as const,
    title: 'CAT Adaptativo',
    subtitle: 'Computerized Adaptive Testing',
    body: 'O sistema seleciona questões na zona de desenvolvimento proximal do seu theta estimado — nem fácil demais para entediar, nem difícil demais para desanimar. Cada questão maximiza informação.',
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

export function MethodologySection() {
  return (
    <section className="px-4 pb-16 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={spring.gentle}
          className="mb-8 text-center"
        >
          <span className="inline-block rounded-full border border-separator/60 bg-surface-1/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-tertiary-label">
            Metodologia
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-label md:text-3xl">
            Ciência por trás da plataforma
          </h2>
          <p className="mt-2 text-sm text-secondary-label md:text-base max-w-2xl mx-auto">
            Cada componente é fundamentado em pesquisa de educação médica e psicometria.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-3 md:gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {methods.map((method) => {
            const Icon = method.icon
            const iconTone =
              method.tone === 'emerald'
                ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35'
                : 'text-violet-300 bg-violet-500/15 border-violet-500/35'

            return (
              <motion.div key={method.title} variants={item}>
                <Card variant="default" className="h-full p-6">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconTone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-label">{method.title}</h3>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-tertiary-label mt-0.5">
                    {method.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-secondary-label">{method.body}</p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
