'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Sparkles, PlayCircle, ChevronRight } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-12 md:px-6 md:pt-16 md:pb-20">
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-darwin-emerald/8 via-transparent to-system-cyan/6" />
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-darwin-emerald/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid gap-10 md:grid-cols-2 md:items-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Left — copy */}
          <div>
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Plataforma Darwin ENAMED
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-5 text-4xl font-semibold leading-tight text-label md:text-5xl lg:text-6xl"
            >
              Domine o ENAMED com
              <span className="gradient-text"> Ciência de Dados</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 max-w-lg text-base leading-relaxed text-secondary-label md:text-lg"
            >
              Simulados adaptativos com TRI 3PL, repetição espaçada FSRS e diagnóstico de lacunas
              por IA — tudo calibrado para a estrutura do ENAMED.
            </motion.p>

            <motion.div variants={item} className="mt-4 flex flex-wrap gap-2">
              {['TRI + MIRT calibrado', 'FSRS v4', 'IA Adaptativa'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-separator/80 bg-surface-1/70 px-3 py-1 text-xs text-secondary-label"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-elevation-2 transition-all duration-ios-fast hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97]"
              >
                <PlayCircle className="h-4 w-4" />
                Começar Gratuitamente
              </Link>
              <Link
                href="/features"
                className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl border border-separator bg-surface-1/70 px-5 py-3 text-sm font-medium text-label transition-all duration-ios-fast hover:bg-surface-2/75 active:scale-[0.97]"
              >
                Ver funcionalidades
                <ChevronRight className="h-4 w-4 text-tertiary-label" />
              </Link>
            </motion.div>
          </div>

          {/* Right — hero image */}
          <motion.div
            variants={item}
            className="relative h-64 overflow-hidden rounded-2xl border border-separator/70 shadow-elevation-2 md:h-80 lg:h-96"
          >
            <Image
              src="/images/branding/hero-home-v2.png"
              alt="Estudantes de medicina usando tecnologia educacional"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-0/80 via-surface-0/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-separator/70 bg-surface-1/70 p-3 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.08em] text-tertiary-label">Prática orientada</p>
              <p className="mt-1 text-sm font-medium text-label">
                Questões calibradas + revisão adaptativa por desempenho.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
