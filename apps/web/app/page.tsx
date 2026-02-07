'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { spring } from '@/lib/motion';

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
        <p className="text-xl text-label-secondary max-w-2xl mx-auto">
          Prepare-se para o ENAMED com questões calibradas por TRI, flashcards
          com repetição espaçada e trilhas de estudo personalizadas.
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
          icon="📝"
          title="Simulado ENAMED"
          description="100 questões com timer e pontuação TRI real"
          color="emerald"
        />
        <FeatureCard
          href="/flashcards"
          icon="🃏"
          title="Flashcards"
          description="Repetição espaçada SM-2 para memorização eficiente"
          color="purple"
        />
        <FeatureCard
          href="/trilhas"
          icon="🛤️"
          title="Trilhas de Estudo"
          description="Caminhos de aprendizado baseados em suas dificuldades"
          color="emerald"
        />
        <FeatureCard
          href="/cip"
          icon="🧩"
          title="Quebra-Cabeça Clínico"
          description="Integre diagnóstico, exame e tratamento em puzzles"
          color="purple"
        />
        <FeatureCard
          href="/montar-prova"
          icon="🔧"
          title="Monte sua Prova"
          description="Crie provas personalizadas por tema e dificuldade"
          color="orange"
        />
        <FeatureCard
          href="/desempenho"
          icon="📊"
          title="Desempenho"
          description="Acompanhe seu progresso e previsões de aprovação"
          color="cyan"
        />
        <FeatureCard
          href="/ia-orientacao"
          icon="🤖"
          title="IA Orientação"
          description="Recomendações personalizadas de estudo baseadas em IA"
          color="indigo"
        />
        <FeatureCard
          href="/conteudo"
          icon="🏥"
          title="Conteúdo Médico"
          description="368 doenças e 690 medicamentos do Darwin-MFC"
          color="rose"
        />
        <FeatureCard
          href="/ddl"
          icon="🎯"
          title="Diagnóstico de Lacunas"
          description="Identifique lacunas epistêmicas, emocionais e de integração"
          color="emerald"
        />
        <FeatureCard
          href="/qgen"
          icon="✨"
          title="QGen DDL"
          description="Geração de questões com validação IRT e integração DDL"
          color="indigo"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.5 }}
      >
        <StatCard value="10.000+" label="Questões" />
        <StatCard value="368" label="Doenças" />
        <StatCard value="690" label="Medicamentos" />
        <StatCard value="TRI" label="Pontuação Real" />
      </motion.div>
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
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  const glowColors: Record<string, string> = {
    emerald: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    purple: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    orange: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    cyan: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    rose: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    indigo: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
  };

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6, transition: spring.snappy }}
    >
      <Link
        href={href}
        className={`block p-6 bg-surface-2 rounded-lg shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 ${glowColors[color] || ''}`}
      >
        <div className="text-4xl mb-4">{icon}</div>
        <h2 className="text-xl font-semibold text-label-primary mb-2">{title}</h2>
        <p className="text-label-tertiary text-sm">{description}</p>
      </Link>
    </motion.div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4 bg-surface-2 rounded-lg shadow-elevation-1">
      <div className="text-2xl font-bold gradient-text">{value}</div>
      <div className="text-sm text-label-tertiary">{label}</div>
    </div>
  );
}
