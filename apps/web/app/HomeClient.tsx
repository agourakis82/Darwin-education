'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  FileText,
  Layers,
  Route,
  Puzzle,
  Wrench,
  BarChart3,
  Bot,
  BookOpen,
  Target,
  Sparkles,
  GraduationCap,
  Brain,
  FlaskConical,
  ArrowUpRight,
  PlayCircle,
  ChevronRight,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { spring } from '@/lib/motion'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Card } from '@/components/ui/Card'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

export function HomeClient({
  questionsCount,
  diseasesCount,
  medicationsCount,
  schemaDrift = false,
}: {
  questionsCount: number
  diseasesCount: number
  medicationsCount: number
  schemaDrift?: boolean
}) {
  const missingMedicalSeed = diseasesCount === 0 || medicationsCount === 0
  const onboardingEnabled = process.env.NEXT_PUBLIC_ENABLE_ONBOARDING === 'true'

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-6 md:pb-20 md:pt-12">
      {onboardingEnabled ? <OnboardingModal /> : null}

      <motion.section
        className="darwin-panel-strong relative overflow-hidden border border-separator/80 p-6 md:p-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <div className="darwin-mesh-bg absolute inset-0 opacity-90" aria-hidden="true" />
        <div className="absolute right-6 top-6 hidden md:block h-28 w-28 rounded-2xl border border-separator/70 bg-surface-1/60 p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-label-tertiary">Modo Beta</p>
          <p className="mt-2 text-xs text-label-secondary">UX alinhada para teste intensivo.</p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-[1.08fr_0.92fr] md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Darwin ENAMED Platform
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-label-primary md:text-5xl">
              Preparação ENAMED com
              <span className="gradient-text"> foco clínico e precisão psicométrica</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-label-secondary md:text-base">
              Simulados TRI, flashcards de repetição espaçada, trilhas inteligentes e geração de questões com
              validação orientada por evidência.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-separator/80 bg-surface-1/70 px-3 py-1 text-xs text-label-secondary">
                TRI + MIRT calibrado
              </span>
              <span className="rounded-full border border-separator/80 bg-surface-1/70 px-3 py-1 text-xs text-label-secondary">
                DDL para lacunas reais
              </span>
              <span className="rounded-full border border-separator/80 bg-surface-1/70 px-3 py-1 text-xs text-label-secondary">
                Rotina diária orientada
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/simulado"
                className="darwin-focus-ring darwin-nav-link inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500"
              >
                <PlayCircle className="h-4 w-4" />
                Iniciar Simulado
              </Link>
              <Link
                href="/montar-prova"
                className="darwin-focus-ring darwin-nav-link inline-flex items-center gap-2 rounded-xl border border-separator bg-surface-1/70 px-4 py-2.5 text-sm font-medium text-label-primary hover:bg-surface-2/75"
              >
                Montar Prova
                <ChevronRight className="h-4 w-4 text-label-tertiary" />
              </Link>
            </div>
          </div>

          <div className="relative h-56 overflow-hidden rounded-2xl border border-separator/70 shadow-elevation-2 md:h-72">
            <Image
              src="/images/branding/hero-home-v2.png"
              alt="Estudantes de medicina usando tecnologia educacional"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 44vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-0/85 via-surface-0/35 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-separator/70 bg-surface-1/70 p-3 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.08em] text-label-tertiary">Prática orientada</p>
              <p className="mt-1 text-sm font-medium text-label-primary">
                Questões calibradas + revisão adaptativa por desempenho.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <ScrollReveal>
        <div className="mt-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <StatPill value={<AnimatedCounter value={questionsCount} />} label="Questões" />
          <StatPill value={<AnimatedCounter value={diseasesCount} />} label="Doenças" />
          <StatPill value={<AnimatedCounter value={medicationsCount} />} label="Medicamentos" />
          <StatPill value="TRI" label="Pontuação" />
        </div>
      </ScrollReveal>

      <motion.header
        className="mt-12 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <h2 className="text-2xl font-semibold text-label-primary md:text-3xl">Fluxos principais para a sua rotina</h2>
        <p className="mt-2 text-sm text-label-secondary md:text-base">
          Tudo no mesmo ecossistema: prática, diagnóstico, conteúdo médico e orientação personalizada.
        </p>
      </motion.header>

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <FeatureCard
          href="/simulado"
          icon={<FileText className="w-5 h-5" />}
          title="Simulado ENAMED"
          description="Questões com timer e pontuação TRI real"
          tone="emerald"
          imageSrc="/images/branding/simulado-banner-v2.png"
          imageAlt="Simulado de alta fidelidade para preparação ENAMED"
        />
        <FeatureCard
          href="/flashcards"
          icon={<Layers className="w-5 h-5" />}
          title="Flashcards"
          description="Repetição espaçada SM-2 para retenção de longo prazo"
          tone="violet"
          imageSrc="/images/branding/flashcards-cover-photo-01.png"
          imageAlt="Cartões de estudo com apoio visual clínico"
        />
        <FeatureCard
          href="/trilhas"
          icon={<Route className="w-5 h-5" />}
          title="Trilhas de Estudo"
          description="Caminhos adaptativos conforme desempenho por área"
          tone="emerald"
          imageSrc="/images/branding/trilhas-cover-photo-01.png"
          imageAlt="Planejamento de trilhas de estudo"
        />
        <FeatureCard
          href="/cip"
          icon={<Puzzle className="w-5 h-5" />}
          title="Quebra-Cabeça Clínico"
          description="Integra diagnóstico, exame e conduta em formato puzzle"
          tone="violet"
          imageSrc="/images/branding/cip-cover-photo-01.png"
          imageAlt="Cenário clínico interativo para treino diagnóstico"
        />
        <FeatureCard
          href="/montar-prova"
          icon={<Wrench className="w-5 h-5" />}
          title="Monte sua Prova"
          description="Provas personalizadas por tema, dificuldade e foco"
          tone="emerald"
          imageSrc="/images/branding/montar-prova-hero-apple-v1.png"
          imageAlt="Composição visual de montagem de prova"
        />
        <FeatureCard
          href="/desempenho"
          icon={<BarChart3 className="w-5 h-5" />}
          title="Desempenho"
          description="Progressão, previsão de aprovação e métricas por domínio"
          tone="violet"
          imageSrc="/images/branding/dashboard-bg-v2.png"
          imageAlt="Painel analítico de desempenho"
        />
        <FeatureCard
          href="/ia-orientacao"
          icon={<Bot className="w-5 h-5" />}
          title="IA Orientação"
          description="Recomendações de estudo personalizadas por lacunas"
          tone="emerald"
          imageSrc="/images/branding/ia-orientacao-hero-apple-v1.png"
          imageAlt="Assistente de orientação de estudo com IA"
        />
        <FeatureCard
          href="/conteudo"
          icon={<BookOpen className="w-5 h-5" />}
          title="Conteúdo Médico"
          description="Doenças e medicamentos sincronizados com Supabase"
          tone="violet"
          imageSrc="/brand/kitA/conteudo-hero-v3-dark-1200x630.png"
          imageAlt="Base de conteúdo médico estruturado"
        />
        <FeatureCard
          href="/ddl"
          icon={<Target className="w-5 h-5" />}
          title="Diagnóstico de Lacunas"
          description="Lacunas epistêmicas, emocionais e de integração"
          tone="emerald"
          imageSrc="/images/branding/ddl-hero-apple-v1.png"
          imageAlt="Diagnóstico inteligente de lacunas de aprendizado"
        />
        <FeatureCard
          href="/qgen"
          icon={<Sparkles className="w-5 h-5" />}
          title="QGen DDL"
          description="Geração de questões com validação IRT e integração DDL"
          tone="violet"
          imageSrc="/images/branding/qgen-hero-apple-v1.png"
          imageAlt="Geração de questões com apoio de IA"
        />
        <FeatureCard
          href="/fcr"
          icon={<Brain className="w-5 h-5" />}
          title="Raciocínio Clínico Fractal"
          description="Raciocínio em níveis com calibragem metacognitiva"
          tone="violet"
          imageSrc="/images/branding/fcr-hero-apple-v1.png"
          imageAlt="Treino de raciocínio clínico em múltiplas camadas"
        />
        <FeatureCard
          href="/pesquisa/psicometria"
          icon={<FlaskConical className="w-5 h-5" />}
          title="Psicometria Avançada"
          description="MIRT 5D, RT-IRT e análise DIF de equidade"
          tone="emerald"
          imageSrc="/images/branding/pesquisa-hero-apple-v1.png"
          imageAlt="Pesquisa psicométrica com visualização científica"
        />
        <FeatureCard
          href="/pesquisa/dominio"
          icon={<Target className="w-5 h-5" />}
          title="Domínio de Conhecimento"
          description="BKT, HLR e perfil integrado do aprendiz"
          tone="violet"
          imageSrc="/images/branding/adaptive-hero-apple-v1.png"
          imageAlt="Modelagem adaptativa de domínio de conhecimento"
        />
        <FeatureCard
          href="/metodos-estudo"
          icon={<GraduationCap className="w-5 h-5" />}
          title="Métodos de Estudo"
          description="Pomodoro, revisão espaçada e técnicas baseadas em evidências"
          tone="emerald"
          imageSrc="/images/branding/metodos-estudo-hero-apple-v1.png"
          imageAlt="Métodos de estudo estruturados por evidência"
        />
      </motion.div>

      {missingMedicalSeed && (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/12 p-4 text-sm text-label-secondary">
          A base Darwin-MFC está em sincronização e parte do conteúdo médico pode ficar indisponível
          temporariamente. Enquanto isso, siga com{' '}
          <Link href="/simulado" className="font-medium text-emerald-300 hover:underline">
            Simulados
          </Link>{' '}
          e{' '}
          <Link href="/conteudo/teoria" className="font-medium text-emerald-300 hover:underline">
            Teoria Clínica
          </Link>
          .
        </div>
      )}

      {schemaDrift && (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/12 p-4 text-sm text-label-secondary">
          <span className="font-semibold text-label-primary">Wiring Supabase incompleto.</span>{' '}
          Detectamos diferenças de schema (tabela/coluna ausente). Para liberar 100% da plataforma na beta,
          aplique as migrações via Supabase CLI e rode o seed conforme `docs/BETA_WIRING_CHECKLIST.md`.
        </div>
      )}
    </div>
  )
}

function FeatureCard({
  href,
  icon,
  title,
  description,
  tone,
  imageSrc,
  imageAlt,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  tone: 'emerald' | 'violet'
  imageSrc?: string
  imageAlt?: string
}) {
  const iconTone = tone === 'emerald' ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35' : 'text-violet-300 bg-violet-500/15 border-violet-500/35'
  const accent = tone === 'emerald' ? 'from-emerald-400/55 via-transparent to-cyan-400/55' : 'from-violet-400/55 via-transparent to-fuchsia-400/55'

  return (
    <motion.div variants={item}>
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl">
        <Card
          variant="default"
          hover
          className="group overflow-hidden p-5"
        >
          {imageSrc ? (
            <div className="darwin-image-tile mb-4 h-28">
              <Image
                src={imageSrc}
                alt={imageAlt ?? title}
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1280px) 42vw, 360px"
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className={`absolute inset-x-0 top-0 z-[3] h-px bg-gradient-to-r ${accent}`} aria-hidden="true" />
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${iconTone}`}>
              {icon}
            </div>
            <ArrowUpRight className="h-4 w-4 text-label-quaternary transition-colors group-hover:text-label-secondary" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-label-primary">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-label-secondary">{description}</p>
        </Card>
      </Link>
    </motion.div>
  )
}

function StatPill({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="darwin-panel flex items-center justify-between gap-3 rounded-2xl border border-separator/80 px-4 py-3">
      <div className="text-xl font-semibold text-label-primary">{value}</div>
      <div className="text-xs uppercase tracking-[0.09em] text-label-tertiary">{label}</div>
    </div>
  )
}
