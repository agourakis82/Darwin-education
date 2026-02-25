'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="px-4 pb-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={spring.gentle}
          className="darwin-panel-strong relative overflow-hidden rounded-3xl border border-separator/80 p-10 text-center md:p-16"
        >
          {/* Background gradient */}
          <div
            className="darwin-mesh-bg absolute inset-0 opacity-70"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Acesso gratuito
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-label md:text-4xl">
              Comece a estudar hoje
            </h2>
            <p className="mt-3 text-base text-secondary-label max-w-md mx-auto">
              Gratuito para começar. Sem cartão de crédito. Acesso imediato a simulados, flashcards e trilhas.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-elevation-2 transition-all duration-ios-fast hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97]"
              >
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl border border-separator bg-surface-1/70 px-6 py-3.5 text-sm font-medium text-label transition-all duration-ios-fast hover:bg-surface-2/75 active:scale-[0.97]"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
