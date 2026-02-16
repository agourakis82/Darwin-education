'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface GenerationStats {
  totalTopicsGenerated: number
  topicsInStatus: Record<string, number>
  topicsByDifficulty: Record<string, number>
  topicsByArea: Record<string, number>
  averageValidationScore: number
  autoApprovalRate: number
}

export default function TheoryGenAdminPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'review' | 'stats'>('generate')
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [topicTitle, setTopicTitle] = useState('')
  const [area, setArea] = useState('clinica_medica')
  const [difficulty, setDifficulty] = useState('intermediario')
  const [includeWeb, setIncludeWeb] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/theory-gen/stats')
      const data = await res.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleGenerateSingle = async () => {
    if (!topicTitle) {
      setMessage('Preencha o título do tópico')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/theory-gen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'manual',
          topicTitle,
          area,
          targetDifficulty: difficulty,
          includeWebResearch: includeWeb,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ Tópico gerado com sucesso! Score: ${(data.validation.score * 100).toFixed(1)}%`)
        setTopicTitle('')
        fetchStats()
      } else {
        setMessage(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Erro na requisição: ${error instanceof Error ? error.message : 'Unknown'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 text-label-primary">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold">Gerenciador de Geração de Teoria</h1>
          <p className="text-sm text-label-secondary mt-1">Sistema SOTA++ para gerar conteúdo teórico automatizado</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-separator">
          {(['generate', 'review', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              {tab === 'generate' && '🎲 Gerar'}
              {tab === 'review' && '📋 Revisar'}
              {tab === 'stats' && '📊 Estatísticas'}
            </button>
          ))}
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Novo Tópico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-label-primary mb-2">Título do Tópico *</label>
                  <input
                    type="text"
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    placeholder="Ex: Hipertensão Arterial"
                    className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary placeholder-label-tertiary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-label-primary mb-2">Especialidade</label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary"
                    >
                      <option value="clinica_medica">Clínica Médica</option>
                      <option value="cirurgia">Cirurgia</option>
                      <option value="pediatria">Pediatria</option>
                      <option value="ginecologia_obstetricia">GO</option>
                      <option value="saude_coletiva">Saúde Coletiva</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-label-primary mb-2">Dificuldade</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-2 border border-separator rounded-lg text-label-primary"
                    >
                      <option value="basico">Básico</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="avancado">Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="web-research"
                    checked={includeWeb}
                    onChange={(e) => setIncludeWeb(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="web-research" className="text-sm text-label-primary">
                    Incluir pesquisa web (adiciona ~$0.01)
                  </label>
                </div>

                <button
                  onClick={handleGenerateSingle}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Gerando...
                    </span>
                  ) : (
                    '🎲 Gerar Tópico'
                  )}
                </button>

                {message && (
                  <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                    {message}
                  </div>
                )}

                <div className="p-3 bg-blue-900/20 text-blue-300 rounded-lg text-sm">
                  <p className="font-medium mb-1">💡 Custo Estimado</p>
                  <p>~$0.08 por tópico (Research + Generation + Validation)</p>
                </div>
              </CardContent>
            </Card>

            {/* Cost Calculator */}
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de Custo em Lote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>1 tópico:</strong> ~$0.08
                  </p>
                  <p>
                    <strong>10 tópicos:</strong> ~$0.80
                  </p>
                  <p>
                    <strong>50 tópicos:</strong> ~$4.00
                  </p>
                  <p>
                    <strong>100 tópicos:</strong> ~$8.00
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Fila de Revisão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-label-secondary py-12">
                <p className="text-lg mb-2">📋 Tópicos pendentes de revisão</p>
                <p className="text-sm">Aguardando implementação completa do storage</p>
                <p className="text-xs text-label-tertiary mt-4">Tópicos com validação entre 70-89% aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Total Gerado:</span>
                  <span className="font-medium">{stats?.totalTopicsGenerated || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Publicados:</span>
                  <span className="font-medium text-green-400">{stats?.topicsInStatus.published || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Pendentes Revisão:</span>
                  <span className="font-medium text-yellow-400">{stats?.topicsInStatus.review || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Rascunhos:</span>
                  <span className="font-medium text-label-secondary">{stats?.topicsInStatus.draft || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Score Médio:</span>
                  <span className="font-medium">{((stats?.averageValidationScore || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Taxa Auto-Aprovação:</span>
                  <span className="font-medium text-green-400">{((stats?.autoApprovalRate || 0) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Dificuldade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Básico:</span>
                  <span className="font-medium">{stats?.topicsByDifficulty.basico || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Intermediário:</span>
                  <span className="font-medium">{stats?.topicsByDifficulty.intermediario || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-label-secondary">Avançado:</span>
                  <span className="font-medium">{stats?.topicsByDifficulty.avancado || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Especialidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-label-secondary">Clínica Médica:</span>
                  <span className="font-medium">{stats?.topicsByArea.clinica_medica || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-secondary">Cirurgia:</span>
                  <span className="font-medium">{stats?.topicsByArea.cirurgia || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-secondary">Pediatria:</span>
                  <span className="font-medium">{stats?.topicsByArea.pediatria || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-secondary">GO:</span>
                  <span className="font-medium">{stats?.topicsByArea.ginecologia_obstetricia || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-secondary">Saúde Coletiva:</span>
                  <span className="font-medium">{stats?.topicsByArea.saude_coletiva || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
