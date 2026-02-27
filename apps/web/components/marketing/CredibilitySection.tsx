'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { ShieldCheck } from 'lucide-react'

const methodologyBadges = [
  'TRI 3PL (Lord, 1980)',
  'DINA / G-DINA (de la Torre, 2011)',
  'FSRS v4',
  'CAT (MFI)',
  'EM-MMLE',
  'EAP Estimation',
]

export function CredibilitySection() {
  return (
    <section className="px-4 pb-10 md:px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={spring.gentle}
          className="text-center"
        >
          <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/15 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-label md:text-xl">
            Construído sobre metodologia validada
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-secondary-label">
            Cada componente da plataforma é fundamentado em pesquisa publicada em psicometria
            educacional e ciência cognitiva.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {methodologyBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
