'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface CostSummary {
  totalTokens: number
  totalCostBRL: number
  totalRequests: number
  totalCacheHits: number
  cacheHitRate: number
  byType: {
    requestType: string
    tokens: number
    costBRL: number
    requests: number
    cacheHits: number
  }[]
  daily: {
    date: string
    tokens: number
    costBRL: number
    requests: number
  }[]
}

const TYPE_LABELS: Record<string, string> = {
  explain: 'Explicações',
  generate: 'Geração de Questões',
  case_study: 'Casos Clínicos',
  summarize: 'Resumos',
}

export default function CustosPage() {
  const [data, setData] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/ai/stats?days=${days}`)
        if (res.status === 401) {
          setError('Faça login para acessar.')
          return
        }
        if (res.status === 403) {
          setError('Acesso restrito a administradores.')
          return
        }
        if (!res.ok) {
          setError('Erro ao carregar dados.')
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError('Erro de conexão.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [days])

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Custos de IA</h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoramento de tokens, custos e cache da integração Minimax
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Custo Total"
                value={`R$ ${data.totalCostBRL.toFixed(2)}`}
                color="text-emerald-400"
              />
              <SummaryCard
                label="Tokens Usados"
                value={data.totalTokens.toLocaleString('pt-BR')}
                color="text-cyan-400"
              />
              <SummaryCard
                label="Requisições"
                value={data.totalRequests.toLocaleString('pt-BR')}
                color="text-purple-400"
              />
              <SummaryCard
                label="Cache Hit Rate"
                value={`${data.cacheHitRate}%`}
                subtitle={`${data.totalCacheHits.toLocaleString('pt-BR')} hits`}
                color="text-yellow-400"
              />
            </div>

            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle>Por Tipo de Requisição</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byType.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum dado no período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-2 pr-4 text-slate-400 font-medium">Tipo</th>
                          <th className="text-right py-2 px-4 text-slate-400 font-medium">Requisições</th>
                          <th className="text-right py-2 px-4 text-slate-400 font-medium">Tokens</th>
                          <th className="text-right py-2 px-4 text-slate-400 font-medium">Cache Hits</th>
                          <th className="text-right py-2 pl-4 text-slate-400 font-medium">Custo (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byType.map((row) => (
                          <tr key={row.requestType} className="border-b border-slate-800/50">
                            <td className="py-2.5 pr-4 text-white">
                              {TYPE_LABELS[row.requestType] ?? row.requestType}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-300">
                              {row.requests.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-300">
                              {row.tokens.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-300">
                              {row.cacheHits.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 pl-4 text-right text-emerald-400 font-medium">
                              {row.costBRL.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Consumo Diário</CardTitle>
              </CardHeader>
              <CardContent>
                {data.daily.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum dado no período.</p>
                ) : (
                  <>
                    {/* Simple bar chart via CSS */}
                    <div className="space-y-1.5 mb-6">
                      {data.daily.slice(-14).map((day) => {
                        const maxCost = Math.max(...data.daily.map((d) => d.costBRL), 0.01)
                        const pct = Math.max((day.costBRL / maxCost) * 100, 1)
                        return (
                          <div key={day.date} className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-20 flex-shrink-0">
                              {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                            <div className="flex-1 h-5 bg-slate-800 rounded overflow-hidden">
                              <div
                                className="h-full bg-emerald-600/60 rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-20 text-right flex-shrink-0">
                              R$ {day.costBRL.toFixed(2)}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left py-2 pr-4 text-slate-400 font-medium">Data</th>
                            <th className="text-right py-2 px-4 text-slate-400 font-medium">Requisições</th>
                            <th className="text-right py-2 px-4 text-slate-400 font-medium">Tokens</th>
                            <th className="text-right py-2 pl-4 text-slate-400 font-medium">Custo (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.daily.map((day) => (
                            <tr key={day.date} className="border-b border-slate-800/50">
                              <td className="py-2 pr-4 text-white">
                                {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-2 px-4 text-right text-slate-300">
                                {day.requests}
                              </td>
                              <td className="py-2 px-4 text-right text-slate-300">
                                {day.tokens.toLocaleString('pt-BR')}
                              </td>
                              <td className="py-2 pl-4 text-right text-emerald-400 font-medium">
                                {day.costBRL.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string
  value: string
  subtitle?: string
  color: string
}) {
  return (
    <Card>
      <CardContent>
        <div className="py-2">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
