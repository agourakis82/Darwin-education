'use client'

import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

interface StatsRowProps {
  questionsCount: number
  diseasesCount?: number
  medicationsCount?: number
}

function StatCard({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="darwin-panel flex flex-col items-center justify-center gap-1 rounded-2xl border border-separator/80 px-6 py-5 text-center">
      <div className="text-3xl font-bold text-label md:text-4xl">
        <AnimatedCounter value={value} suffix={suffix} duration={1.8} />
      </div>
      <div className="text-xs uppercase tracking-[0.1em] text-tertiary-label">{label}</div>
    </div>
  )
}

export function StatsRow({
  questionsCount,
  diseasesCount = 368,
  medicationsCount = 690,
}: StatsRowProps) {
  return (
    <section className="px-4 pb-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-3 gap-3.5 md:gap-5">
          <StatCard value={questionsCount} label="Questões ENAMED" suffix="+" />
          <StatCard value={diseasesCount} label="Doenças (CID-10)" />
          <StatCard value={medicationsCount} label="Medicamentos (ATC)" />
        </div>
      </div>
    </section>
  )
}
