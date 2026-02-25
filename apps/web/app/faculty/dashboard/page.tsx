'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { RiskGauge, RiskDimensionBar } from '@/lib/erem/components/RiskGauge'
import { SHAPWaterfallChart, SHAPBarChart } from '@/lib/erem/components/SHAPCharts'
import { TrajectoryChart, DimensionTrendChart } from '@/lib/erem/components/TrajectoryCharts'
import { ProvenancePanel } from '@/lib/erem/components/ProvenancePanel'
import { RiskTrajectory } from '@/lib/erem/epistemicTypes'

interface StudentRiskData {
  studentId: string
  studentName: string
  studentEmail: string
  compositeRisk: {
    value: number
    confidence: number
    lowerBound: number
    upperBound: number
  }
  dimensionRisks: {
    clinicalReasoning: { value: number; confidence: number }
    engagement: { value: number; confidence: number }
    wellbeing: { value: number; confidence: number }
    academic: { value: number; confidence: number }
  }
  trajectory: RiskTrajectory
  trajectoryConfidence: number
  daysOfData: number
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
  shapValues: Record<string, number>
  shapContributors: Array<{
    feature: string
    shapValue: number
    direction: 'increases_risk' | 'decreases_risk'
    magnitude: 'high' | 'medium' | 'low'
    description: string
  }>
  snapshots: Array<{
    timestamp: string
    compositeRisk: number
    clinicalReasoningRisk: number
    engagementRisk: number
    wellbeingRisk: number
    academicRisk: number
  }>
  forecast?: {
    predictedRisk30Days: number
    lowerBound: number
    upperBound: number
    confidence: number
  }
  provenance: Array<{
    source: string
    timestamp: Date
    confidence: number
  }>
}

interface InterventionRecommendation {
  id: string
  type: string
  priority: string
  title: string
  description: string
  rationale: string
  expectedImpact: number
  confidence: number
  status: string
}

export default function FacultyDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string; risk: number }>>([])
  const [riskData, setRiskData] = useState<StudentRiskData | null>(null)
  const [interventions, setInterventions] = useState<InterventionRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'trajectory' | 'explainability' | 'interventions'>('overview')

  // Fetch students list
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/faculty/students')
        if (res.ok) {
          const data = await res.json()
          setStudents(data.students || [])
        }
      } catch (e) {
        console.error('Failed to fetch students:', e)
      }
    }
    fetchStudents()
  }, [])

  // Fetch risk data for selected student
  const fetchRiskData = useCallback(async (studentId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [riskRes, interventionsRes] = await Promise.all([
        fetch(`/api/erem/predict?studentId=${studentId}`),
        fetch(`/api/erem/interventions?studentId=${studentId}`),
      ])

      if (riskRes.ok) {
        const data = await riskRes.json()
        if (data.success && data.profile) {
          // Fetch snapshots for trajectory
          const snapshotsRes = await fetch(`/api/erem/snapshots?studentId=${studentId}&days=90`)
          let snapshots = []
          if (snapshotsRes.ok) {
            const snapData = await snapshotsRes.json()
            snapshots = snapData.snapshots || []
          }

          setRiskData({
            studentId: data.profile.studentId,
            studentName: students.find(s => s.id === studentId)?.name || 'Unknown',
            studentEmail: students.find(s => s.id === studentId)?.email || '',
            compositeRisk: data.profile.compositeRisk,
            dimensionRisks: data.profile.dimensionRisks,
            trajectory: data.profile.trajectory,
            trajectoryConfidence: data.profile.trajectoryConfidence,
            daysOfData: data.profile.daysOfData,
            dataQuality: data.profile.dataQuality,
            shapValues: data.profile.shapValues,
            shapContributors: [], // Will be populated from SHAP endpoint
            snapshots,
            forecast: data.profile.forecast,
            provenance: [],
          })
        }
      }

      if (interventionsRes.ok) {
        const data = await interventionsRes.json()
        setInterventions(data.interventions || [])
      }
    } catch (e) {
      setError('Failed to load risk data')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [students])

  useEffect(() => {
    if (selectedStudent) {
      fetchRiskData(selectedStudent)
    }
  }, [selectedStudent, fetchRiskData])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Painel de Risco Epistêmico</h1>
          <p className="text-gray-600 mt-1">
            Sistema de monitoramento de risco estudantil com explicabilidade
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Student List Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">Estudantes</h2>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {students.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Nenhum estudante encontrado</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {students
                      .sort((a, b) => b.risk - a.risk)
                      .map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student.id)}
                          className={cn(
                            'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                            selectedStudent === student.id && 'bg-blue-50 border-l-2 border-blue-500'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                            <div
                              className={cn(
                                'px-2 py-1 rounded text-xs font-medium',
                                student.risk >= 0.7
                                  ? 'bg-red-100 text-red-700'
                                  : student.risk >= 0.4
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              )}
                            >
                              {Math.round(student.risk * 100)}%
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {!selectedStudent ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                Selecione um estudante para visualizar o perfil de risco
              </div>
            ) : loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="animate-pulse text-gray-400">Carregando dados de risco...</div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-red-500">
                {error}
              </div>
            ) : riskData ? (
              <div className="space-y-6">
                {/* View Mode Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex border-b border-gray-200">
                    {[
                      { key: 'overview', label: 'Visão Geral' },
                      { key: 'trajectory', label: 'Trajetória' },
                      { key: 'explainability', label: 'Explicabilidade' },
                      { key: 'interventions', label: 'Intervenções' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setViewMode(tab.key as typeof viewMode)}
                        className={cn(
                          'px-6 py-3 text-sm font-medium transition-colors',
                          viewMode === tab.key
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overview Tab */}
                {viewMode === 'overview' && (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Risk Gauges */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Risco Composto</h3>
                      <div className="flex justify-center">
                        <RiskGauge
                          value={riskData.compositeRisk.value}
                          confidence={riskData.compositeRisk.confidence}
                          lowerBound={riskData.compositeRisk.lowerBound}
                          upperBound={riskData.compositeRisk.upperBound}
                          label="Risco Global"
                          size="lg"
                        />
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Trajetória</p>
                          <p className={cn(
                            'font-medium capitalize',
                            riskData.trajectory === 'improving' && 'text-emerald-600',
                            riskData.trajectory === 'declining' && 'text-red-600',
                            riskData.trajectory === 'volatile' && 'text-amber-600',
                            riskData.trajectory === 'stable' && 'text-blue-600',
                          )}>
                            {riskData.trajectory === 'improving' ? 'Melhorando' :
                             riskData.trajectory === 'declining' ? 'Em Declínio' :
                             riskData.trajectory === 'volatile' ? 'Volátil' : 'Estável'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Qualidade dos Dados</p>
                          <p className="font-medium capitalize">{riskData.dataQuality}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dimension Risks */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Riscos por Dimensão</h3>
                      <div className="space-y-4">
                        <RiskDimensionBar
                          label="Raciocínio Clínico"
                          value={riskData.dimensionRisks.clinicalReasoning.value}
                          confidence={riskData.dimensionRisks.clinicalReasoning.confidence}
                        />
                        <RiskDimensionBar
                          label="Engajamento"
                          value={riskData.dimensionRisks.engagement.value}
                          confidence={riskData.dimensionRisks.engagement.confidence}
                        />
                        <RiskDimensionBar
                          label="Bem-estar"
                          value={riskData.dimensionRisks.wellbeing.value}
                          confidence={riskData.dimensionRisks.wellbeing.confidence}
                        />
                        <RiskDimensionBar
                          label="Acadêmico"
                          value={riskData.dimensionRisks.academic.value}
                          confidence={riskData.dimensionRisks.academic.confidence}
                        />
                      </div>
                    </div>

                    {/* Top SHAP Factors */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Principais Fatores de Risco</h3>
                      <SHAPBarChart shapValues={riskData.shapValues} maxFeatures={8} />
                    </div>

                    {/* Data Provenance */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Procedência dos Dados</h3>
                      <ProvenancePanel
                        provenance={riskData.provenance}
                        dataQuality={riskData.dataQuality}
                        daysOfData={riskData.daysOfData}
                      />
                    </div>
                  </div>
                )}

                {/* Trajectory Tab */}
                {viewMode === 'trajectory' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Trajetória de Risco</h3>
                      <TrajectoryChart
                        snapshots={riskData.snapshots}
                        trajectory={riskData.trajectory}
                        forecast={riskData.forecast}
                        height={250}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Trajetória por Dimensão</h3>
                      <DimensionTrendChart snapshots={riskData.snapshots} height={180} />
                    </div>
                  </div>
                )}

                {/* Explainability Tab */}
                {viewMode === 'explainability' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Explicação SHAP (Waterfall)</h3>
                      {riskData.shapContributors.length > 0 ? (
                        <SHAPWaterfallChart
                          contributors={riskData.shapContributors}
                          baseValue={0.35}
                          predictedValue={riskData.compositeRisk.value}
                        />
                      ) : (
                        <SHAPBarChart shapValues={riskData.shapValues} />
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Importância Global das Features</h3>
                      <SHAPBarChart shapValues={riskData.shapValues} maxFeatures={12} />
                    </div>
                  </div>
                )}

                {/* Interventions Tab */}
                {viewMode === 'interventions' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Intervenções Recomendadas</h3>
                      <button
                        onClick={async () => {
                          if (selectedStudent) {
                            await fetch(`/api/erem/interventions`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ studentId: selectedStudent }),
                            })
                            fetchRiskData(selectedStudent)
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Gerar Novas Recomendações
                      </button>
                    </div>
                    {interventions.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        Nenhuma intervenção recomendada
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {interventions.map((intervention) => (
                          <div key={intervention.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium border',
                                    getPriorityColor(intervention.priority)
                                  )}>
                                    {intervention.priority.toUpperCase()}
                                  </span>
                                  <h4 className="font-medium text-gray-900">{intervention.title}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{intervention.description}</p>
                                <p className="text-xs text-gray-500">{intervention.rationale}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-medium text-gray-700">
                                  {Math.round(intervention.expectedImpact * 100)}% sucesso
                                </p>
                                <p className="text-xs text-gray-400">
                                  Conf: {Math.round(intervention.confidence * 100)}%
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={async () => {
                                  await fetch(`/api/erem/interventions`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      interventionId: intervention.id,
                                      status: 'in_progress',
                                    }),
                                  })
                                  if (selectedStudent) fetchRiskData(selectedStudent)
                                }}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Iniciar
                              </button>
                              <button
                                onClick={async () => {
                                  await fetch(`/api/erem/interventions`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      interventionId: intervention.id,
                                      status: 'completed',
                                      outcome: 'success',
                                    }),
                                  })
                                  if (selectedStudent) fetchRiskData(selectedStudent)
                                }}
                                className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                              >
                                Marcar Concluída
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
