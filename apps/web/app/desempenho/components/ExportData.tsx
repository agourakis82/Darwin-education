'use client'

import { useState } from 'react'
import type { ENAMEDArea } from '@darwin-education/shared'

interface ExamAttempt {
  id: string
  exam_id: string
  completed_at: string
  theta: number
  scaled_score: number
  passed: boolean
  correct_count: number
  area_breakdown: Record<ENAMEDArea, { correct: number; total: number }>
  total_time_seconds: number
}

interface PerformanceStats {
  totalExams: number
  averageScore: number
  passRate: number
  totalQuestions: number
  correctQuestions: number
  studyStreak: number
  lastStudyDate: string | null
  bestScore: number
  latestTheta: number
}

interface ExportDataProps {
  attempts: ExamAttempt[]
  stats: PerformanceStats
}

const areaLabels: Record<ENAMEDArea, string> = {
  clinica_medica: 'Clínica Médica',
  cirurgia: 'Cirurgia',
  ginecologia_obstetricia: 'GO',
  pediatria: 'Pediatria',
  saude_coletiva: 'Saúde Coletiva',
}

export function ExportData({ attempts, stats }: ExportDataProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    setIsExporting(true)

    const headers = ['Data', 'Pontuação', 'Acertos', 'Total', 'Taxa', 'Aprovado', 'Tempo (min)']
    const rows = attempts.map(attempt => {
      const totalQuestions = attempt.area_breakdown
        ? Object.values(attempt.area_breakdown).reduce((s, a) => s + (a?.total || 0), 0)
        : 0
      const accuracy = totalQuestions > 0 ? Math.round((attempt.correct_count / totalQuestions) * 100) : 0

      return [
        new Date(attempt.completed_at).toLocaleDateString('pt-BR'),
        Math.round(attempt.scaled_score),
        attempt.correct_count,
        totalQuestions,
        `${accuracy}%`,
        attempt.passed ? 'Sim' : 'Não',
        Math.floor(attempt.total_time_seconds / 60),
      ]
    })

    const csv = [
      ['Relatório de Desempenho'],
      [`Data: ${new Date().toLocaleDateString('pt-BR')}`],
      [],
      ['Estatísticas Gerais'],
      ['Simulados Realizados', stats.totalExams],
      ['Pontuação Média', stats.averageScore],
      ['Melhor Pontuação', stats.bestScore],
      ['Taxa de Aprovação', `${stats.passRate}%`],
      [],
      ['Histórico de Simulados'],
      headers,
      ...rows,
    ]
      .map(row => (Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : row))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `desempenho-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setIsExporting(false)
    setIsOpen(false)
  }

  const exportToPDF = () => {
    setIsExporting(true)

    const content = generatePDFContent()
    const element = document.createElement('div')
    element.innerHTML = content
    element.style.padding = '20px'
    element.style.fontFamily = 'Arial, sans-serif'
    element.style.fontSize = '12px'

    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(content)
      printWindow.document.close()
      printWindow.focus()

      setTimeout(() => {
        printWindow.print()
        setIsExporting(false)
        setIsOpen(false)
      }, 250)
    }
  }

  const generatePDFContent = () => {
    const rows = attempts.map(attempt => {
      const totalQuestions = attempt.area_breakdown
        ? Object.values(attempt.area_breakdown).reduce((s, a) => s + (a?.total || 0), 0)
        : 0
      const accuracy = totalQuestions > 0 ? Math.round((attempt.correct_count / totalQuestions) * 100) : 0

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(attempt.completed_at).toLocaleDateString('pt-BR')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Math.round(attempt.scaled_score)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${attempt.correct_count}/${totalQuestions}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${accuracy}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${attempt.passed ? 'Aprovado' : 'Reprovado'}</td>
        </tr>
      `
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Desempenho</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              color: #1f2937;
              border-bottom: 2px solid #10b981;
              padding-bottom: 10px;
            }
            h2 {
              color: #374151;
              margin-top: 20px;
              font-size: 16px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 15px 0;
            }
            .stat-box {
              padding: 15px;
              background: #f3f4f6;
              border-radius: 5px;
              border-left: 4px solid #10b981;
            }
            .stat-label {
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background: #10b981;
              color: white;
              padding: 10px;
              text-align: left;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #6b7280;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Desempenho - ENAMED</h1>
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>

          <h2>Resumo Estatístico</h2>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Simulados Realizados</div>
              <div class="stat-value">${stats.totalExams}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Pontuação Média</div>
              <div class="stat-value">${stats.averageScore}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Melhor Pontuação</div>
              <div class="stat-value">${stats.bestScore}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Taxa de Aprovação</div>
              <div class="stat-value">${stats.passRate}%</div>
            </div>
          </div>

          <h2>Histórico de Simulados</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th style="text-align: right;">Pontuação</th>
                <th style="text-align: right;">Acertos</th>
                <th style="text-align: right;">Acurácia</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            <p>Este relatório contém informações sobre seu desempenho nos simulados realizados na plataforma Darwin Education.</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm"
        disabled={isExporting}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        {isExporting ? 'Exportando...' : 'Exportar'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-1 border border-separator rounded-lg shadow-lg z-10">
          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors text-sm text-label-primary hover:text-white border-b border-separator flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar como CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors text-sm text-label-primary hover:text-white flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Imprimir como PDF
          </button>
        </div>
      )}
    </div>
  )
}
