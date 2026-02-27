'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Card } from '@/components/ui/Card'
import {
  BarChart3,
  Target,
  GraduationCap,
  Building2,
  FlaskConical,
  Brain,
  Shield,
  ArrowRight,
  Users,
  FileDown,
  Database,
  Globe,
  Lock,
  Layers,
} from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

const valueCards = [
  {
    icon: BarChart3,
    tone: 'emerald' as const,
    title: 'Analytics de Desempenho Institucional',
    description:
      'Monitore o desempenho de coortes inteiras. Identifique estudantes em risco, visualize distribuições de theta por área ENAMED e acompanhe a evolução longitudinal da turma.',
  },
  {
    icon: Target,
    tone: 'violet' as const,
    title: 'Testes Adaptativos Calibrados',
    description:
      'Testes adaptativos com IRT 3PL e modelos diagnósticos cognitivos (CDM) para avaliação psicométrica com rigor de pesquisa. Cada questão calibrada com parâmetros a, b e c.',
  },
  {
    icon: GraduationCap,
    tone: 'emerald' as const,
    title: 'Alinhamento Curricular',
    description:
      'Questões mapeadas por CID-10, ATC e atributos cognitivos (DINA/G-DINA). Identifique lacunas curriculares comparando o desempenho da turma com a matriz de competências do ENAMED.',
  },
]

const cdmAttributes = [
  'Coleta de dados clínicos',
  'Raciocínio diagnóstico',
  'Julgamento clínico',
  'Decisão terapêutica',
  'Medicina preventiva',
  'Manejo de emergências',
]

const integrationFeatures = [
  {
    icon: Globe,
    title: 'API REST documentada',
    description: 'Integração com LMS existentes via endpoints RESTful autenticados.',
  },
  {
    icon: Users,
    title: 'Contas institucionais',
    description: 'Gestão de turmas, docentes e coordenadores com permissões granulares.',
  },
  {
    icon: Database,
    title: 'Bancos de questões customizados',
    description: 'Crie e calibre bancos de questões próprios com parâmetros IRT estimados automaticamente.',
  },
  {
    icon: FileDown,
    title: 'Exportação de dados de pesquisa',
    description: 'Dados anonimizados em CSV/JSON para publicação acadêmica e análise estatística.',
  },
  {
    icon: Building2,
    title: 'Deploy institucional',
    description: 'Opção de deploy dedicado com branding personalizado e infraestrutura isolada.',
  },
  {
    icon: Lock,
    title: 'Conformidade LGPD',
    description: 'Row-Level Security (RLS), criptografia em trânsito e em repouso, sem venda de dados.',
  },
]

const credibilityStats = [
  { value: '3.847+', label: 'Questões calibradas' },
  { value: '6', label: 'Atributos cognitivos CDM' },
  { value: '368', label: 'Doenças CID-10' },
  { value: '690', label: 'Medicamentos ATC' },
]

export default function InstitucionalPage() {
  return (
    <div className="min-h-screen bg-system-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-12 pb-12 md:px-6 md:pt-16 md:pb-20">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-transparent to-darwin-emerald/6" />
          <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/35 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              <Building2 className="h-3.5 w-3.5" />
              Para Instituições
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-label md:text-5xl lg:text-6xl">
              Darwin Education para{' '}
              <span className="gradient-text">Instituições de Ensino</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-secondary-label md:text-lg">
              Ofereça aos seus alunos de medicina uma plataforma de preparação para o ENAMED
              construída sobre psicometria validada — e à sua coordenação, dados de desempenho
              em tempo real para decisões baseadas em evidência.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:contato@darwinhub.org"
                className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-elevation-2 transition-all duration-ios-fast hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97]"
              >
                Agendar Demonstração
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/features"
                className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl border border-separator bg-surface-1/70 px-5 py-3 text-sm font-medium text-label transition-all duration-ios-fast hover:bg-surface-2/75 active:scale-[0.97]"
              >
                Ver Funcionalidades
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value proposition cards */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={spring.gentle}
            className="mb-6 text-2xl font-semibold text-label md:text-3xl"
          >
            Por que adotar Darwin Education
          </motion.h2>

          <motion.div
            className="grid gap-4 md:grid-cols-3 md:gap-5"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {valueCards.map((card) => {
              const Icon = card.icon
              const iconTone =
                card.tone === 'emerald'
                  ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35'
                  : 'text-violet-300 bg-violet-500/15 border-violet-500/35'

              return (
                <motion.div key={card.title} variants={item}>
                  <Card variant="default" className="h-full p-6">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-label">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-secondary-label">{card.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CDM Research highlight */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={spring.gentle}
          >
            <Card variant="elevated" className="border-violet-500/25 p-8 md:p-10">
              <div className="darwin-mesh-bg absolute inset-0 rounded-[inherit] opacity-60" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/15 text-violet-300">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-label">Modelos Diagnósticos Cognitivos (CDM)</h3>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-tertiary-label">
                      Pesquisa psicométrica integrada
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-secondary-label">
                  Darwin Education implementa modelos DINA e G-DINA com calibração EM-MMLE para classificação
                  latente em K=6 atributos cognitivos clínicos. Cada aluno recebe um perfil de domínio
                  com estimativas EAP por atributo, entropia posterior para medir incerteza, e classificação
                  MAP para decisões binárias de maestria.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {cdmAttributes.map((attr) => (
                    <div
                      key={attr}
                      className="rounded-xl border border-separator/60 bg-surface-1/50 px-3 py-2 text-xs font-medium text-secondary-label"
                    >
                      {attr}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    'DINA (Junker & Sijtsma, 2001)',
                    'G-DINA (de la Torre, 2011)',
                    'EM-MMLE',
                    'Shannon Entropy CAT',
                  ].map((ref) => (
                    <span
                      key={ref}
                      className="rounded-full border border-violet-500/35 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Integration features */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={spring.gentle}
            className="mb-6 text-2xl font-semibold text-label md:text-3xl"
          >
            Integração e infraestrutura
          </motion.h2>

          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {integrationFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={item}>
                  <div className="rounded-2xl border border-separator/60 bg-surface-1/50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-tertiary-label" />
                      <p className="text-sm font-semibold text-label">{feature.title}</p>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-secondary-label">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Credibility stats */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {credibilityStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={item}
                className="darwin-panel flex flex-col items-center justify-center gap-1 rounded-2xl border border-separator/80 px-4 py-5 text-center"
              >
                <div className="text-2xl font-bold text-label md:text-3xl">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-tertiary-label">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={spring.gentle}
          >
            <Card variant="default" className="p-8 md:p-10">
              <div className="darwin-mesh-bg absolute inset-0 rounded-[inherit] opacity-40" aria-hidden="true" />
              <div className="relative text-center">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/35 bg-emerald-500/15 text-emerald-300">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold text-label md:text-3xl">
                  Transforme a preparação dos seus alunos
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-secondary-label">
                  Entre em contato para uma demonstração personalizada da plataforma.
                  Nosso time apresenta a integração institucional, analytics de coorte
                  e os modelos psicométricos em detalhe.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="mailto:contato@darwinhub.org"
                    className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-elevation-2 transition-all duration-ios-fast hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97]"
                  >
                    <Layers className="h-4 w-4" />
                    Agendar Reunião
                  </a>
                  <a
                    href="mailto:contato@darwinhub.org?subject=Apresentação%20Darwin%20Education"
                    className="darwin-focus-ring inline-flex items-center gap-2 rounded-xl border border-separator bg-surface-1/70 px-5 py-3 text-sm font-medium text-label transition-all duration-ios-fast hover:bg-surface-2/75 active:scale-[0.97]"
                  >
                    <FileDown className="h-4 w-4" />
                    Solicitar Apresentação
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
