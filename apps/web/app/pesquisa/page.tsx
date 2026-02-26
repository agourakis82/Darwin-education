'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { FlaskConical, Brain, Layers, Dna, ArrowUpRight } from 'lucide-react'

const sections = [
  {
    href: '/pesquisa/psicometria',
    icon: Brain,
    title: 'Psicometria Avançada',
    description:
      'MIRT 5D (Reckase, 2009), RT-IRT velocidade-precisão (van der Linden, 2006), análise DIF Mantel-Haenszel (Holland & Thayer, 1988) e evolução de theta.',
    color: 'purple' as const,
  },
  {
    href: '/pesquisa/dominio',
    icon: Layers,
    title: 'Domínio de Conhecimento',
    description:
      'BKT (Corbett & Anderson, 1995), curvas de esquecimento HLR (Settles & Meeder, 2016), perfil unificado do aprendiz e recomendações priorizadas.',
    color: 'emerald' as const,
  },
  {
    href: '/pesquisa/cognitivo',
    icon: Dna,
    title: 'Diagnóstico Cognitivo (CDM)',
    description:
      'DINA/G-DINA (de la Torre, 2011) com EM-MMLE. Q-matrix clínica K=6 atributos, 64 classes latentes, posteriors de domínio e CAT por entropia de Shannon.',
    color: 'blue' as const,
  },
]

export default function PesquisaPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <FlaskConical className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-label-primary">
          Pesquisa <span className="gradient-text">Psicométrica</span>
        </h1>
        <p className="text-label-tertiary mt-2 max-w-lg mx-auto">
          Algoritmos de pesquisa de ponta implementados na plataforma Darwin Education.
        </p>
      </motion.div>

      <div className="relative mb-8 h-44 md:h-52 overflow-hidden rounded-2xl border border-separator/70">
        <Image
          src="/images/branding/pesquisa-hero-apple-v1.png"
          alt="Visual de pesquisa psicométrica e análise multidimensional"
          fill
          sizes="(max-width: 768px) 100vw, 1024px"
          priority
          className="object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/70 to-surface-0/35" />
        <div className="relative z-10 h-full flex items-end p-5 md:p-6">
          <p className="text-sm md:text-base text-label-secondary max-w-lg">
            Modelos psicométricos avançados aplicados em uma arquitetura unificada e auditável.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, i) => {
          const Icon = section.icon
          const iconBg = section.color === 'emerald'
            ? 'bg-emerald-500/10'
            : section.color === 'blue'
            ? 'bg-blue-500/10'
            : 'bg-purple-500/10'
          const iconText = section.color === 'emerald'
            ? 'text-emerald-400'
            : section.color === 'blue'
            ? 'text-blue-400'
            : 'text-purple-400'

          return (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: spring.snappy }}
            >
              <Link
                href={section.href}
                className="group block p-6 bg-surface-2 rounded-lg shadow-elevation-1 transition-all hover:shadow-elevation-2 hover:bg-surface-3/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconText}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-label-quaternary group-hover:text-label-secondary transition-colors" />
                </div>
                <h2 className="text-lg font-semibold text-label-primary mb-2">{section.title}</h2>
                <p className="text-label-tertiary text-sm leading-relaxed">{section.description}</p>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        className="mt-12 bg-surface-2/50 rounded-lg p-4 text-[11px] text-label-quaternary text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <strong>Algoritmos:</strong> IRT 3PL + MIRT 5D + CDM (DINA/G-DINA) + RT-IRT + BKT + HLR + DIF + FCR + Modelo Unificado.
        Uma combinação inédita de modelos em um único sistema, com foco em rastreabilidade e consistência científica.
      </motion.div>
    </div>
  )
}
