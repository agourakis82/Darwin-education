'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { theoryTopics } from '@/lib/data/theory-content'

interface StudentPerformance {
  area: string;
  score: number;
  questionsAttempted: number;
  correctAnswers: number;
  weakAreas: string[];
  strongAreas: string[];
}

interface GuidanceRecommendation {
  type: 'urgent_review' | 'reinforcement' | 'advancement' | 'consolidation';
  title: string;
  description: string;
  topicIds: string[];
  priority: 'high' | 'medium' | 'low';
  actionableSteps: string[];
}

export default function IaOrientacaoPage() {
  const [userPerformance, setUserPerformance] = useState<StudentPerformance | null>(null)
  const [recommendations, setRecommendations] = useState<GuidanceRecommendation[]>([])
  const [showDemoData, setShowDemoData] = useState(false)

  const generateRecommendations = (performance: StudentPerformance): GuidanceRecommendation[] => {
    const recs: GuidanceRecommendation[] = []

    // If performance is low, recommend urgent review
    if (performance.score < 50) {
      recs.push({
        type: 'urgent_review',
        title: '🚨 Revisão Urgente Necessária',
        description: `Sua pontuação em ${performance.area} está abaixo de 50%. Recomendamos revisão imediata dos conceitos fundamentais.`,
        topicIds: performance.weakAreas.slice(0, 3),
        priority: 'high',
        actionableSteps: [
          'Leia as definições e fisiopatologia dos tópicos mais frágeis',
          'Revise os pontos-chave 2-3 vezes',
          'Resolva questões práticas após cada seção de teoria',
          'Use flashcards para memorização'
        ]
      })
    }

    // If performance is medium, recommend reinforcement
    if (performance.score >= 50 && performance.score < 75) {
      recs.push({
        type: 'reinforcement',
        title: '📚 Reforço Recomendado',
        description: `Você está progredindo em ${performance.area}. Continue reforçando os conceitos.`,
        topicIds: performance.weakAreas.slice(0, 2),
        priority: 'medium',
        actionableSteps: [
          'Foque na fisiopatologia e diagnóstico diferencial',
          'Compare apresentações clínicas de condições relacionadas',
          'Resolva casos clínicos mais complexos',
          'Estude os diferenciais de cada doença'
        ]
      })
    }

    // If performance is good, recommend advancement
    if (performance.score >= 75 && performance.score < 90) {
      recs.push({
        type: 'advancement',
        title: '🎯 Aprofundamento em Tópicos Avançados',
        description: `Excelente desempenho em ${performance.area}. Está pronto para aprofundar em tópicos mais complexos.`,
        topicIds: performance.weakAreas.length > 0 ? performance.weakAreas.slice(0, 1) : performance.strongAreas.slice(0, 2),
        priority: 'low',
        actionableSteps: [
          'Estude complicações e casos atípicos',
          'Explore conexões entre diferentes tópicos',
          'Resolva questões de maior dificuldade (nível 4-5)',
          'Estude protocolos e diretrizes atualizadas'
        ]
      })
    }

    // If performance is excellent, recommend consolidation
    if (performance.score >= 90) {
      recs.push({
        type: 'consolidation',
        title: '⭐ Consolidação de Expertise',
        description: `Desempenho excepcional em ${performance.area}! Você domina este tópico.`,
        topicIds: performance.strongAreas.slice(0, 2),
        priority: 'low',
        actionableSteps: [
          'Mantenha a atualização com diretrizes recentes',
          'Ensine outros - revisar é a melhor forma de aprender',
          'Explore aplicações clínicas reais',
          'Foco em novos tópicos para melhorar seu perfil'
        ]
      })
    }

    return recs
  }

  const handleLoadDemo = () => {
    const demoData: StudentPerformance = {
      area: 'Clínica Médica',
      score: 65,
      questionsAttempted: 45,
      correctAnswers: 29,
      weakAreas: ['hipertensao-arterial', 'diabetes-mellitus-tipo-2'],
      strongAreas: ['asma', 'doenca-do-refluxo-gastroesofagico']
    }
    setUserPerformance(demoData)
    setRecommendations(generateRecommendations(demoData))
    setShowDemoData(true)
  }

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold">🤖 IA Orientação de Estudos</h1>
          <p className="text-sm text-label-secondary mt-1">
            Sistema inteligente de recomendações personalizadas baseado no seu desempenho
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!userPerformance ? (
          <div className="space-y-6">
            {/* Welcome Section */}
            <Card className="border-violet-500/50 bg-gradient-to-r from-violet-900/20 to-surface-1/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Bem-vindo ao Sistema de IA Orientação</h2>
                    <p className="text-label-primary">
                      Este sistema usa inteligência artificial para analisar seu desempenho em questões de prova
                      e recomenda conteúdo teórico personalizado para melhorar seu aprendizado.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-surface-2/50 rounded-lg">
                      <div className="text-3xl mb-2">📊</div>
                      <h3 className="font-semibold mb-1">Análise de Desempenho</h3>
                      <p className="text-sm text-label-secondary">Acompanha seus acertos, erros e áreas fracas</p>
                    </div>
                    <div className="p-4 bg-surface-2/50 rounded-lg">
                      <div className="text-3xl mb-2">📚</div>
                      <h3 className="font-semibold mb-1">Recomendações Personalizadas</h3>
                      <p className="text-sm text-label-secondary">Sugere tópicos de teoria baseado em seus erros</p>
                    </div>
                    <div className="p-4 bg-surface-2/50 rounded-lg">
                      <div className="text-3xl mb-2">🎯</div>
                      <h3 className="font-semibold mb-1">Plano de Ação</h3>
                      <p className="text-sm text-label-secondary">Guia passo-a-passo para melhorar seus resultados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    {
                      num: '1',
                      title: 'Faça Questões',
                      desc: 'Resolva questões em simulados ou questões geradas pela IA'
                    },
                    {
                      num: '2',
                      title: 'IA Analisa',
                      desc: 'O sistema identifica suas áreas fracas e tópicos de dificuldade'
                    },
                    {
                      num: '3',
                      title: 'Recomendações',
                      desc: 'Receba sugestões de teoria para reforçar o aprendizado'
                    },
                    {
                      num: '4',
                      title: 'Aprenda',
                      desc: 'Estude o conteúdo teórico recomendado'
                    },
                    {
                      num: '5',
                      title: 'Melhore',
                      desc: 'Volte às questões e veja seu desempenho melhorar'
                    }
                  ].map(step => (
                    <div key={step.num} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 font-semibold">
                        {step.num}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-label-secondary">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Demo Section */}
            <Card className="border-emerald-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🧪</span> Ver Exemplo de Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-label-primary mb-4">
                  Clique abaixo para carregar dados de exemplo e ver como o sistema faz recomendações personalizadas.
                </p>
                <button
                  onClick={handleLoadDemo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium"
                >
                  Carregar Exemplo de Desempenho
                </button>
              </CardContent>
            </Card>

            {/* Integration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🔗</span> Integração com Outros Sistemas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/simulado" className="p-4 bg-surface-2/50 hover:bg-surface-2 rounded-lg transition-colors">
                    <h3 className="font-semibold mb-2">📋 Simulados</h3>
                    <p className="text-sm text-label-secondary">Faça simulados e receba recomendações de teoria baseadas no seu desempenho</p>
                  </Link>
                  <Link href="/qgen" className="p-4 bg-surface-2/50 hover:bg-surface-2 rounded-lg transition-colors">
                    <h3 className="font-semibold mb-2">🎲 Questões Geradas</h3>
                    <p className="text-sm text-label-secondary">Gere questões em tópicos específicos que precisa melhorar</p>
                  </Link>
                  <Link href="/conteudo/teoria" className="p-4 bg-surface-2/50 hover:bg-surface-2 rounded-lg transition-colors">
                    <h3 className="font-semibold mb-2">📚 Teoria Clínica</h3>
                    <p className="text-sm text-label-secondary">Acesse conteúdo teórico estruturado recomendado pela IA</p>
                  </Link>
                  <Link href="/flashcards" className="p-4 bg-surface-2/50 hover:bg-surface-2 rounded-lg transition-colors">
                    <h3 className="font-semibold mb-2">🎴 Flashcards</h3>
                    <p className="text-sm text-label-secondary">Crie flashcards dos tópicos que está estudando</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Performance Summary */}
            <Card className="border-violet-500/50 bg-surface-1/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-label-secondary text-sm mb-1">Especialidade</p>
                    <p className="text-2xl font-bold">{userPerformance.area}</p>
                  </div>
                  <div>
                    <p className="text-label-secondary text-sm mb-1">Desempenho Geral</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            userPerformance.score >= 90 ? 'bg-emerald-500' :
                            userPerformance.score >= 75 ? 'bg-blue-500' :
                            userPerformance.score >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${userPerformance.score}%` }}
                        />
                      </div>
                      <span className="text-2xl font-bold">{userPerformance.score}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-label-secondary text-sm mb-1">Questões Corretas</p>
                    <p className="text-2xl font-bold">{userPerformance.correctAnswers}/{userPerformance.questionsAttempted}</p>
                  </div>
                  <div>
                    <p className="text-label-secondary text-sm mb-1">Taxa de Acerto</p>
                    <p className="text-2xl font-bold">{Math.round((userPerformance.correctAnswers / userPerformance.questionsAttempted) * 100)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.map((rec, idx) => (
              <Card
                key={idx}
                className={`border-l-4 ${
                  rec.priority === 'high' ? 'border-l-red-500' :
                  rec.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{rec.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-label-primary">{rec.description}</p>

                  {/* Recommended Topics */}
                  <div>
                    <h3 className="font-semibold mb-3">📖 Tópicos Recomendados para Estudo:</h3>
                    <div className="space-y-2">
                      {rec.topicIds.map(topicId => {
                        const topic = theoryTopics.find(t => t.id === topicId)
                        if (!topic) return null
                        return (
                          <Link
                            key={topic.id}
                            href={`/conteudo/teoria/${topic.id}`}
                            className="p-3 bg-surface-2/50 hover:bg-surface-2 rounded-lg transition-colors block group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium group-hover:text-violet-400 transition-colors">
                                  {topic.title}
                                </h4>
                                <p className="text-sm text-label-secondary mt-1">{topic.description}</p>
                                <div className="flex gap-2 mt-2 text-xs text-label-tertiary">
                                  <span>⏱️ {topic.estimatedReadTime} min</span>
                                  <span>•</span>
                                  <span>
                                    {topic.difficulty === 'basico' ? '🟢 Básico' :
                                     topic.difficulty === 'intermediario' ? '🟡 Intermediário' :
                                     '🔴 Avançado'}
                                  </span>
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-label-tertiary group-hover:text-violet-400 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actionable Steps */}
                  <div>
                    <h3 className="font-semibold mb-3">✅ Plano de Ação:</h3>
                    <ol className="space-y-2">
                      {rec.actionableSteps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="text-label-primary pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* CTA */}
                  <div className="pt-2">
                    <Link
                      href={`/conteudo/teoria/${rec.topicIds[0]}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors font-medium"
                    >
                      <span>Começar Estudo</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Return Button */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setUserPerformance(null)
                  setRecommendations([])
                  setShowDemoData(false)
                }}
                className="px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors"
              >
                ← Voltar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
