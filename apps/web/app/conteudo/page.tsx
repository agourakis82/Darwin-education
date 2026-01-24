'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ConteudoPage() {
  const [activeTab, setActiveTab] = useState<'doencas' | 'medicamentos'>('doencas')

  const sections = [
    {
      id: 'doencas' as const,
      title: 'Doenças',
      description: 'Base de conhecimento com condições médicas organizadas por especialidade',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'emerald',
      stats: { count: 368, label: 'condições' },
      href: '/conteudo/doencas',
    },
    {
      id: 'medicamentos' as const,
      title: 'Medicamentos',
      description: 'Guia farmacológico completo com classes, mecanismos e indicações',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'blue',
      stats: { count: 690, label: 'medicamentos' },
      href: '/conteudo/medicamentos',
    },
  ]

  const recentTopics = [
    { title: 'Insuficiência Cardíaca Congestiva', type: 'doenca', area: 'Clínica Médica' },
    { title: 'Omeprazol', type: 'medicamento', area: 'Gastroenterologia' },
    { title: 'Diabetes Mellitus Tipo 2', type: 'doenca', area: 'Clínica Médica' },
    { title: 'Amoxicilina', type: 'medicamento', area: 'Antibióticos' },
    { title: 'Pré-eclâmpsia', type: 'doenca', area: 'Obstetrícia' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Conteúdo Médico</h1>
          <p className="text-sm text-slate-400 mt-1">
            Base de conhecimento para estudo e consulta rápida
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => (
            <Link key={section.id} href={section.href}>
              <Card className={`h-full hover:border-${section.color}-500/50 transition-colors cursor-pointer group`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${section.color}-500/20 rounded-lg text-${section.color}-400 group-hover:bg-${section.color}-500/30 transition-colors`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {section.title}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {section.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <span className={`text-2xl font-bold text-${section.color}-400`}>
                          {section.stats.count}
                        </span>
                        <span className="text-slate-500">{section.stats.label}</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Busca Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar doenças, medicamentos, sintomas..."
                className="w-full px-4 py-3 pl-12 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                onFocus={() => window.location.href = '/conteudo/doencas'}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Areas by specialty */}
          <Card>
            <CardHeader>
              <CardTitle>Por Especialidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Clínica Médica', count: 120, color: 'blue' },
                  { name: 'Cirurgia', count: 85, color: 'red' },
                  { name: 'Pediatria', count: 65, color: 'green' },
                  { name: 'GO', count: 58, color: 'pink' },
                  { name: 'Saúde Coletiva', count: 40, color: 'purple' },
                  { name: 'Emergência', count: 50, color: 'orange' },
                ].map((area) => (
                  <Link
                    key={area.name}
                    href={`/conteudo/doencas?area=${encodeURIComponent(area.name)}`}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{area.name}</span>
                      <span className="text-xs text-slate-500">{area.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Medication classes */}
          <Card>
            <CardHeader>
              <CardTitle>Classes Farmacológicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Antibióticos', count: 85 },
                  { name: 'Anti-hipertensivos', count: 45 },
                  { name: 'Analgésicos', count: 38 },
                  { name: 'Antidiabéticos', count: 32 },
                  { name: 'Psicotrópicos', count: 55 },
                  { name: 'Anti-inflamatórios', count: 28 },
                ].map((cls) => (
                  <Link
                    key={cls.name}
                    href={`/conteudo/medicamentos?classe=${encodeURIComponent(cls.name)}`}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{cls.name}</span>
                      <span className="text-xs text-slate-500">{cls.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Tips */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">Dica de Estudo</p>
                <p>
                  Use o conteúdo médico como referência rápida durante a revisão de questões.
                  Após errar uma questão, consulte o conteúdo relacionado para fixar o conhecimento.
                  Você também pode criar flashcards diretamente das páginas de conteúdo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
