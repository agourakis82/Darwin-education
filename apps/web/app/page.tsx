'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-12">
      {/* Header */}
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold text-white mb-4">
          Darwin <span className="text-primary-500">Education</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Prepare-se para o ENAMED com questões calibradas por TRI, flashcards
          com repetição espaçada e trilhas de estudo personalizadas.
        </p>
      </header>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Exam Simulator */}
        <FeatureCard
          href="/simulado"
          icon="📝"
          title="Simulado ENAMED"
          description="100 questões com timer e pontuação TRI real"
          color="primary"
        />

        {/* Flashcards */}
        <FeatureCard
          href="/flashcards"
          icon="🃏"
          title="Flashcards"
          description="Repetição espaçada SM-2 para memorização eficiente"
          color="accent"
        />

        {/* Study Paths */}
        <FeatureCard
          href="/trilhas"
          icon="🛤️"
          title="Trilhas de Estudo"
          description="Caminhos de aprendizado baseados em suas dificuldades"
          color="green"
        />

        {/* Custom Exam Builder */}
        <FeatureCard
          href="/montar-prova"
          icon="🔧"
          title="Monte sua Prova"
          description="Crie provas personalizadas por tema e dificuldade"
          color="orange"
        />

        {/* Analytics */}
        <FeatureCard
          href="/desempenho"
          icon="📊"
          title="Desempenho"
          description="Acompanhe seu progresso e previsões de aprovação"
          color="cyan"
        />

        {/* Medical Data */}
        <FeatureCard
          href="/conteudo"
          icon="🏥"
          title="Conteúdo Médico"
          description="368 doenças e 690 medicamentos do Darwin-MFC"
          color="rose"
        />
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <StatCard value="10.000+" label="Questões" />
        <StatCard value="368" label="Doenças" />
        <StatCard value="690" label="Medicamentos" />
        <StatCard value="TRI" label="Pontuação Real" />
      </div>
    </main>
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
  const colorClasses: Record<string, string> = {
    primary: 'hover:border-primary-500/50 hover:shadow-primary-500/20',
    accent: 'hover:border-accent-500/50 hover:shadow-accent-500/20',
    green: 'hover:border-green-500/50 hover:shadow-green-500/20',
    orange: 'hover:border-orange-500/50 hover:shadow-orange-500/20',
    cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-500/20',
    rose: 'hover:border-rose-500/50 hover:shadow-rose-500/20',
  };

  return (
    <Link
      href={href}
      className={`block p-6 bg-gray-800/50 border border-gray-700 rounded-xl transition-all duration-300 hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4 bg-gray-800/30 rounded-lg">
      <div className="text-2xl font-bold text-primary-500">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
