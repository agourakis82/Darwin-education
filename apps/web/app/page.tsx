'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { spring } from '@/lib/motion';
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
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { OnboardingModal } from '@/components/OnboardingModal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
};

export default function HomePage() {
  return (
    <div className="relative container mx-auto px-4 py-12">
      <OnboardingModal />
      {/* Hero atmosphere glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px] opacity-[0.07] pointer-events-none" aria-hidden="true" />
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-purple-500 rounded-full blur-[120px] opacity-[0.05] pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <motion.header
        className="relative text-center mb-16"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <h1 className="text-5xl font-bold text-label-primary mb-4">
          Darwin <span className="gradient-text">Education</span>
        </h1>
        <p className="text-xl text-label-secondary max-w-xl mx-auto">
          A plataforma mais avançada para preparação do ENAMED.
        </p>
        <p className="text-base text-label-tertiary mt-2 max-w-lg mx-auto">
          Questões calibradas por TRI, repetição espaçada e trilhas personalizadas.
        </p>
      </motion.header>

      {/* Feature Cards */}
      <motion.div
        className="relative grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <FeatureCard
          href="/simulado"
          icon={<FileText className="w-6 h-6" />}
          title="Simulado ENAMED"
          description="100 questões com timer e pontuação TRI real"
          color="emerald"
        />
        <FeatureCard
          href="/flashcards"
          icon={<Layers className="w-6 h-6" />}
          title="Flashcards"
          description="Repetição espaçada SM-2 para memorização eficiente"
          color="purple"
        />
        <FeatureCard
          href="/trilhas"
          icon={<Route className="w-6 h-6" />}
          title="Trilhas de Estudo"
          description="Caminhos de aprendizado baseados em suas dificuldades"
          color="emerald"
        />
        <FeatureCard
          href="/cip"
          icon={<Puzzle className="w-6 h-6" />}
          title="Quebra-Cabeça Clínico"
          description="Integre diagnóstico, exame e tratamento em puzzles"
          color="purple"
        />
        <FeatureCard
          href="/montar-prova"
          icon={<Wrench className="w-6 h-6" />}
          title="Monte sua Prova"
          description="Crie provas personalizadas por tema e dificuldade"
          color="emerald"
        />
        <FeatureCard
          href="/desempenho"
          icon={<BarChart3 className="w-6 h-6" />}
          title="Desempenho"
          description="Acompanhe seu progresso e previsões de aprovação"
          color="purple"
        />
        <FeatureCard
          href="/ia-orientacao"
          icon={<Bot className="w-6 h-6" />}
          title="IA Orientação"
          description="Recomendações personalizadas de estudo baseadas em IA"
          color="emerald"
        />
        <FeatureCard
          href="/conteudo"
          icon={<BookOpen className="w-6 h-6" />}
          title="Conteúdo Médico"
          description="368 doenças e 690 medicamentos do Darwin-MFC"
          color="purple"
        />
        <FeatureCard
          href="/ddl"
          icon={<Target className="w-6 h-6" />}
          title="Diagnóstico de Lacunas"
          description="Identifique lacunas epistêmicas, emocionais e de integração"
          color="emerald"
        />
        <FeatureCard
          href="/qgen"
          icon={<Sparkles className="w-6 h-6" />}
          title="QGen DDL"
          description="Geração de questões com validação IRT e integração DDL"
          color="purple"
        />
        <FeatureCard
          href="/fcr"
          icon={<Brain className="w-6 h-6" />}
          title="Raciocínio Clínico Fractal"
          description="Raciocínio em 4 níveis com calibração de confiança metacognitiva"
          color="purple"
        />
        <FeatureCard
          href="/pesquisa/psicometria"
          icon={<FlaskConical className="w-6 h-6" />}
          title="Psicometria Avançada"
          description="MIRT 5D, RT-IRT velocidade-precisão e análise DIF de equidade"
          color="emerald"
        />
        <FeatureCard
          href="/pesquisa/dominio"
          icon={<Target className="w-6 h-6" />}
          title="Domínio de Conhecimento"
          description="BKT, curvas de esquecimento HLR e perfil unificado do aprendiz"
          color="purple"
        />
        <FeatureCard
          href="/metodos-estudo"
          icon={<GraduationCap className="w-6 h-6" />}
          title="Métodos de Estudo"
          description="Pomodoro, revisão espaçada e técnicas baseadas em evidências"
          color="emerald"
        />
      </motion.div>

      {/* Stats */}
      <ScrollReveal>
        <div className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <StatCard value={<AnimatedCounter value={10000} suffix="+" />} label="Questões" />
          <StatCard value={<AnimatedCounter value={368} />} label="Doenças" />
          <StatCard value={<AnimatedCounter value={690} />} label="Medicamentos" />
          <StatCard value="TRI" label="Pontuação Real" />
        </div>
      </ScrollReveal>
    </div>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  color: 'emerald' | 'purple';
}) {
  const iconBg = color === 'emerald' ? 'bg-emerald-500/10' : 'bg-purple-500/10';
  const iconText = color === 'emerald' ? 'text-emerald-400' : 'text-purple-400';

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4, transition: spring.snappy }}
    >
      <Link
        href={href}
        className="group block p-6 bg-surface-2 rounded-lg shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 hover:bg-surface-3/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconText}`}>
            {icon}
          </div>
          <ArrowUpRight className="w-4 h-4 text-label-quaternary group-hover:text-label-secondary transition-colors" />
        </div>
        <h2 className="text-lg font-semibold text-label-primary mb-1">{title}</h2>
        <p className="text-label-tertiary text-sm">{description}</p>
      </Link>
    </motion.div>
  );
}

function StatCard({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="text-center p-4 bg-surface-2 rounded-lg shadow-elevation-1">
      <div className="text-2xl font-bold text-label-primary">{value}</div>
      <div className="text-sm text-label-tertiary">{label}</div>
    </div>
  );
}
