'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { FileText, Layers, Route, BarChart3, Bot, BookOpen, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { ReactNode } from 'react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

function MarketingBentoCard({
  href,
  icon,
  title,
  description,
  tone,
  imageSrc,
  imageAlt,
  colSpan,
  rowSpan,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  tone: 'emerald' | 'violet'
  imageSrc?: string
  imageAlt?: string
  colSpan: string
  rowSpan: string
}) {
  const iconTone =
    tone === 'emerald'
      ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35'
      : 'text-violet-300 bg-violet-500/15 border-violet-500/35'
  const accent =
    tone === 'emerald'
      ? 'from-emerald-400/55 via-transparent to-cyan-400/55'
      : 'from-violet-400/55 via-transparent to-fuchsia-400/55'

  return (
    <motion.div
      variants={item}
      className={`${colSpan} ${rowSpan}`}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Card variant="default" hover className="group h-full overflow-hidden p-5 flex flex-col">
          {imageSrc && (
            <div className="darwin-image-tile flex-1 mb-4 min-h-0">
              <Image
                src={imageSrc}
                alt={imageAlt ?? title}
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1280px) 60vw, 680px"
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span
                className={`absolute inset-x-0 top-0 z-[3] h-px bg-gradient-to-r ${accent}`}
                aria-hidden="true"
              />
            </div>
          )}
          <div className="flex items-start justify-between gap-3 shrink-0">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${iconTone}`}>
              {icon}
            </div>
            <ArrowUpRight className="h-4 w-4 text-quaternary-label transition-colors group-hover:text-secondary-label" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-label shrink-0">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-secondary-label shrink-0 line-clamp-2">{description}</p>
        </Card>
      </Link>
    </motion.div>
  )
}

export function FeatureGrid() {
  return (
    <section className="px-4 pb-12 md:px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={spring.gentle}
          className="mb-6"
        >
          <h2 className="text-2xl font-semibold text-label md:text-3xl">Fluxos principais</h2>
          <p className="mt-1.5 text-sm text-secondary-label md:text-base">
            Prática, diagnóstico, conteúdo médico e orientação personalizada em um ecossistema integrado.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-6 auto-rows-[200px] gap-4 md:gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          <MarketingBentoCard
            href="/signup"
            icon={<FileText className="w-5 h-5" />}
            title="Simulado ENAMED"
            description="Questões com timer e pontuação TRI real. Desempenho calculado pelo modelo de 3 parâmetros."
            tone="emerald"
            imageSrc="/images/branding/simulado-banner-v2.png"
            imageAlt="Simulado de alta fidelidade para preparação ENAMED"
            colSpan="col-span-6 md:col-span-4"
            rowSpan="row-span-1 md:row-span-2"
          />
          <MarketingBentoCard
            href="/signup"
            icon={<Layers className="w-5 h-5" />}
            title="Flashcards FSRS"
            description="Repetição espaçada de nova geração para retenção de longo prazo."
            tone="violet"
            imageSrc="/images/branding/flashcards-cover-photo-01.png"
            imageAlt="Cartões de estudo com apoio visual clínico"
            colSpan="col-span-6 md:col-span-2"
            rowSpan="row-span-1"
          />
          <MarketingBentoCard
            href="/signup"
            icon={<Route className="w-5 h-5" />}
            title="Trilhas de Estudo"
            description="Caminhos adaptativos conforme desempenho por área ENAMED."
            tone="emerald"
            imageSrc="/images/branding/trilhas-cover-photo-01.png"
            imageAlt="Planejamento de trilhas de estudo"
            colSpan="col-span-6 md:col-span-2"
            rowSpan="row-span-1"
          />
          <MarketingBentoCard
            href="/signup"
            icon={<BarChart3 className="w-5 h-5" />}
            title="Desempenho"
            description="Progressão, previsão de aprovação e métricas por domínio."
            tone="violet"
            imageSrc="/images/branding/dashboard-bg-v2.png"
            imageAlt="Painel analítico de desempenho"
            colSpan="col-span-6 md:col-span-2"
            rowSpan="row-span-1"
          />
          <MarketingBentoCard
            href="/signup"
            icon={<Bot className="w-5 h-5" />}
            title="IA Orientação"
            description="Recomendações de estudo personalizadas por lacunas identificadas."
            tone="emerald"
            imageSrc="/images/branding/ia-orientacao-hero-apple-v1.png"
            imageAlt="Assistente de orientação de estudo com IA"
            colSpan="col-span-6 md:col-span-2"
            rowSpan="row-span-1"
          />
          <MarketingBentoCard
            href="/signup"
            icon={<BookOpen className="w-5 h-5" />}
            title="Conteúdo Médico"
            description="Doenças e medicamentos sincronizados com a base Darwin-MFC."
            tone="violet"
            imageSrc="/brand/kitA/conteudo-hero-v3-dark-1200x630.png"
            imageAlt="Base de conteúdo médico estruturado"
            colSpan="col-span-6 md:col-span-2"
            rowSpan="row-span-1"
          />
        </motion.div>
      </div>
    </section>
  )
}
