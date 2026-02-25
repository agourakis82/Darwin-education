'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Card } from '@/components/ui/Card'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

const freeFeatures = [
  'Simulados com pontuação TRI',
  'Flashcards FSRS ilimitados',
  'Trilhas de estudo completas',
  'Conteúdo médico (doenças + fármacos)',
  'Painel de desempenho básico',
  'Métodos de estudo (Pomodoro)',
]

const proFeatures = [
  'Tudo do plano Gratuito',
  'Simulado Adaptativo (CAT)',
  'Diagnóstico de Lacunas (DDL)',
  'IA Orientação personalizada',
  'QGen — geração de questões por IA',
  'Raciocínio Clínico Fractal (FCR)',
  'Quebra-Cabeça Clínico (CIP)',
  'Analytics avançado com previsão de aprovação',
  'Suporte prioritário',
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-system-background">
      {/* Header */}
      <section className="px-4 pt-12 pb-10 text-center md:px-6 md:pt-16">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <span className="inline-block rounded-full border border-separator/60 bg-surface-1/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-tertiary-label">
              Planos
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-label md:text-5xl">
              Simples e transparente
            </h1>
            <p className="mt-4 text-base text-secondary-label">
              Comece gratuitamente. Sem cartão de crédito. Atualize quando precisar de mais.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="grid gap-5 md:grid-cols-2"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Free plan */}
            <motion.div variants={item}>
              <Card variant="default" className="h-full p-8">
                <div>
                  <h2 className="text-xl font-semibold text-label">Gratuito</h2>
                  <p className="mt-1 text-sm text-secondary-label">Para começar sua jornada ENAMED</p>
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-label">R$0</span>
                  <span className="text-sm text-secondary-label"> / mês</span>
                </div>
                <Link
                  href="/signup"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-separator bg-surface-1/70 px-5 py-3 text-sm font-semibold text-label transition-all duration-ios-fast hover:bg-surface-2/75 active:scale-[0.97]"
                >
                  Criar conta grátis
                </Link>
                <ul className="mt-8 space-y-3">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/15">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-sm text-secondary-label">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Pro plan */}
            <motion.div variants={item} className="relative">
              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Em breve
                </span>
              </div>
              <Card variant="elevated" className="h-full p-8 border-emerald-500/25">
                <div>
                  <h2 className="text-xl font-semibold text-label">Darwin Pro</h2>
                  <p className="mt-1 text-sm text-secondary-label">Preparação completa e adaptativa</p>
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-label">Em breve</span>
                </div>
                <button
                  disabled
                  className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-darwin-emerald/40 px-5 py-3 text-sm font-semibold text-white/60"
                >
                  Aguarde o lançamento
                  <ArrowRight className="h-4 w-4" />
                </button>
                <ul className="mt-8 space-y-3">
                  {proFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/15">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-sm text-secondary-label">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ / reassurance */}
      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-tertiary-label">
            Sem cobranças surpresa. Cancele quando quiser. Os dados de progresso ficam sempre com você.
          </p>
        </div>
      </section>
    </div>
  )
}
