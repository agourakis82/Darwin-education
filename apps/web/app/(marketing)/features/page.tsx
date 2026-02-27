'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Card } from '@/components/ui/Card'
import {
  FileText,
  Layers,
  Route,
  Target,
  Bot,
  BookOpen,
  PlayCircle,
  Brain,
  Puzzle,
  BarChart3,
  Sparkles,
  GraduationCap,
  ArrowRight,
} from 'lucide-react'

type FeatureTier = 'free' | 'pro'

const features: {
  icon: typeof FileText
  tone: 'emerald' | 'violet'
  title: string
  subtitle: string
  description: string
  tags: string[]
  tier: FeatureTier
  plainExplanation?: string
}[] = [
  {
    icon: FileText,
    tone: 'emerald',
    title: 'Simulado ENAMED',
    subtitle: 'Prática com alta fidelidade',
    description:
      'Questões calibradas por TRI 3PL com timer, revisão pós-prova e pontuação em escala 0–1000. Emula a estrutura real do ENAMED: 100 questões, 5 áreas, 5 horas.',
    tags: ['TRI 3PL', 'Timer', 'Revisão pós-prova'],
    tier: 'free',
    plainExplanation:
      'TRI 3PL — Teoria da Resposta ao Item com 3 parâmetros. Mede sua habilidade real, não apenas o número de acertos.',
  },
  {
    icon: PlayCircle,
    tone: 'violet',
    title: 'Simulado Adaptativo (CAT)',
    subtitle: 'Computerized Adaptive Testing',
    description:
      'O algoritmo seleciona questões próximas ao seu theta estimado, maximizando informação diagnóstica com menos itens. Ideal para sessões curtas de prática focada.',
    tags: ['CAT', 'Theta estimado', 'Eficiente'],
    tier: 'pro',
    plainExplanation:
      'CAT — Teste Adaptativo Computadorizado. Seleciona questões no seu nível ideal de dificuldade, como um professor particular.',
  },
  {
    icon: Layers,
    tone: 'violet',
    title: 'Flashcards FSRS',
    subtitle: 'Repetição Espaçada v4',
    description:
      'FSRS (Free Spaced Repetition Scheduler) calcula o intervalo ideal para cada cartão individualmente. Organize por deck, área ENAMED ou tópico clínico.',
    tags: ['FSRS v4', 'Decks personalizados', 'Revisão diária'],
    tier: 'free',
    plainExplanation:
      'FSRS v4 — Algoritmo de repetição espaçada que calcula o melhor momento para revisar cada cartão, baseado no seu histórico individual.',
  },
  {
    icon: Route,
    tone: 'emerald',
    title: 'Trilhas de Estudo',
    subtitle: 'Caminhos adaptativos',
    description:
      'Módulos sequenciais organizados por área do ENAMED. O progresso é rastreado e desbloqueado conforme você avança, criando um caminho de estudo personalizado.',
    tags: ['5 áreas ENAMED', 'Progresso rastreado', 'Módulos'],
    tier: 'free',
  },
  {
    icon: Target,
    tone: 'emerald',
    title: 'Diagnóstico de Lacunas',
    subtitle: 'DDL — Deficit-Driven Learning',
    description:
      'Analisa seu histórico de desempenho para identificar lacunas epistêmicas, emocionais e de integração. Prioriza o que você mais precisa estudar.',
    tags: ['Lacunas epistêmicas', 'IA', 'Priorização'],
    tier: 'pro',
    plainExplanation:
      'DDL — Aprendizagem Orientada por Déficit. Analisa seus erros para priorizar o que você mais precisa estudar.',
  },
  {
    icon: Bot,
    tone: 'violet',
    title: 'IA Orientação',
    subtitle: 'Recomendações personalizadas',
    description:
      'Assistente de estudo que analisa seu perfil de desempenho e sugere prioridades de revisão, distribuição de tempo por área e estratégias adaptadas.',
    tags: ['Claude AI', 'Perfil adaptativo', 'Recomendações'],
    tier: 'pro',
  },
  {
    icon: BookOpen,
    tone: 'emerald',
    title: 'Conteúdo Médico',
    subtitle: 'Biblioteca clínica integrada',
    description:
      '368 doenças com CID-10, 690 medicamentos com ATC e protocolos clínicos — todos sincronizados com a base Darwin-MFC e referenciados nas questões.',
    tags: ['CID-10', 'ATC', 'Protocolos'],
    tier: 'free',
  },
  {
    icon: Brain,
    tone: 'violet',
    title: 'Raciocínio Clínico Fractal',
    subtitle: 'Treino diagnóstico em camadas',
    description:
      'Exercita o raciocínio clínico em múltiplos níveis — hipótese, exame, conduta — com calibragem metacognitiva para desenvolver fluência diagnóstica.',
    tags: ['FCR', 'Metacognição', 'Diagnóstico'],
    tier: 'pro',
    plainExplanation:
      'FCR — Raciocínio Clínico Fractal. Exercita o pensamento diagnóstico em múltiplas camadas de complexidade.',
  },
  {
    icon: Puzzle,
    tone: 'emerald',
    title: 'Quebra-Cabeça Clínico',
    subtitle: 'Casos clínicos interativos',
    description:
      'Cenários clínicos completos com imagem, história, exames e condutas em formato interativo. Desenvolve integração de conhecimento.',
    tags: ['Casos clínicos', 'Imagens', 'CIP'],
    tier: 'pro',
  },
  {
    icon: BarChart3,
    tone: 'violet',
    title: 'Desempenho',
    subtitle: 'Analytics de aprendizagem',
    description:
      'Painel completo com theta por área, previsão de aprovação, evolução temporal, comparativo de pares e distribuição de acertos por dificuldade.',
    tags: ['Theta', 'Previsão', 'Analytics'],
    tier: 'free',
  },
  {
    icon: Sparkles,
    tone: 'emerald',
    title: 'QGen DDL',
    subtitle: 'Geração de questões por IA',
    description:
      'Gera questões calibradas por IRT nas suas áreas de maior déficit. Validação por múltiplos LLMs e convergência de qualidade antes de publicação.',
    tags: ['Geração IA', 'IRT', 'Validação multi-LLM'],
    tier: 'pro',
  },
  {
    icon: GraduationCap,
    tone: 'violet',
    title: 'Métodos de Estudo',
    subtitle: 'Técnicas baseadas em evidências',
    description:
      'Pomodoro integrado, revisão espaçada guiada, gestão semanal de tempo e técnicas de memorização baseadas em ciência cognitiva.',
    tags: ['Pomodoro', 'Gestão do tempo', 'Evidência'],
    tier: 'free',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-system-background pb-0">
      {/* Header */}
      <section className="px-4 pt-12 pb-10 text-center md:px-6 md:pt-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <span className="inline-block rounded-full border border-separator/60 bg-surface-1/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-tertiary-label">
              Funcionalidades
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-label md:text-5xl">
              Tudo que você precisa para o ENAMED
            </h1>
            <p className="mt-4 text-base text-secondary-label md:text-lg">
              Um ecossistema completo de preparação, do simulado ao diagnóstico de lacunas,
              fundamentado em psicometria e inteligência artificial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-5"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {features.map((feature) => {
              const Icon = feature.icon
              const iconTone =
                feature.tone === 'emerald'
                  ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35'
                  : 'text-violet-300 bg-violet-500/15 border-violet-500/35'

              const tierBadge =
                feature.tier === 'free'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                  : 'bg-violet-500/15 text-violet-300 border-violet-500/35'

              return (
                <motion.div key={feature.title} variants={item}>
                  <Card variant="default" className="h-full p-6">
                    <div className="flex items-start justify-between">
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconTone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${tierBadge}`}>
                        {feature.tier === 'free' ? 'Gratuito' : 'Pro'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-label">{feature.title}</h3>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-tertiary-label mt-0.5">
                      {feature.subtitle}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-secondary-label">{feature.description}</p>
                    {feature.plainExplanation && (
                      <p className="mt-1.5 text-xs italic text-tertiary-label">
                        {feature.plainExplanation}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {feature.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-separator/60 bg-surface-1/70 px-2 py-0.5 text-[11px] text-tertiary-label"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-label">Pronto para começar?</h2>
          <p className="mt-2 text-sm text-secondary-label">Crie sua conta gratuitamente e acesse os simulados hoje.</p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-elevation-2 transition-all duration-ios-fast hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97]"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
