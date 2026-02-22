'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { AREA_LABELS, AREA_COLORS } from '@/lib/area-colors'
import type { ENAMEDArea } from '@darwin-education/shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WrongItem {
  question_id: string
  area: ENAMEDArea
  topic: string | null
  stem_preview: string
}

interface WrongItemsTableProps {
  attemptId: string | null
}

export function WrongItemsTable({ attemptId }: WrongItemsTableProps) {
  const [items, setItems] = useState<WrongItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!attemptId) return
    setLoading(true)
    const supabase = createClient()
    ;(async () => {
      const { data } = await (supabase as any)
        .from('irt_response_log')
        .select('question_id, questions!inner(area, topic, stem)')
        .eq('exam_attempt_id', attemptId)
        .eq('correct', false)
        .order('created_at', { ascending: true })
        .limit(20)
      if (data) {
        setItems(
          data.map((r: any) => ({
            question_id: r.question_id,
            area: r.questions.area as ENAMEDArea,
            topic: r.questions.topic ?? null,
            stem_preview:
              typeof r.questions.stem === 'string'
                ? r.questions.stem.slice(0, 90) + (r.questions.stem.length > 90 ? '…' : '')
                : '—',
          }))
        )
      }
      setLoading(false)
    })()
  }, [attemptId])

  if (!attemptId) return null

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Itens Errados — Último Simulado Adaptativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Itens Errados — Último Simulado Adaptativo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => {
            const colors = AREA_COLORS[item.area] ?? AREA_COLORS['clinica_medica']
            return (
              <div
                key={item.question_id}
                className="flex items-start gap-3 p-3 bg-surface-2/60 hover:bg-surface-2 rounded-lg transition-colors"
              >
                {/* Area chip */}
                <span
                  className={`shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors.badge}`}
                >
                  {AREA_LABELS[item.area] ?? item.area}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {item.topic && (
                    <p className="text-xs text-label-secondary truncate mb-0.5">{item.topic}</p>
                  )}
                  <p className="text-xs text-label-primary line-clamp-2">{item.stem_preview}</p>
                </div>

                {/* Review link */}
                <Link
                  href={`/flashcards?area=${item.area}${item.topic ? `&topic=${encodeURIComponent(item.topic)}` : ''}`}
                  className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap transition-colors"
                >
                  Revisar →
                </Link>
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-label-tertiary text-center">
          {items.length} {items.length === 1 ? 'item errado' : 'itens errados'} neste simulado
        </p>
      </CardContent>
    </Card>
  )
}

