'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { Plus, X, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AREA_LABELS } from '@/lib/area-colors'
import type { ENAMEDArea } from '@darwin-education/shared'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const
const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
]

const AREA_SLOT_COLORS: Record<ENAMEDArea, string> = {
  clinica_medica: 'bg-blue-500/30 border-blue-700 text-blue-300',
  cirurgia: 'bg-red-500/30 border-red-700 text-red-300',
  ginecologia_obstetricia: 'bg-pink-500/30 border-pink-700 text-pink-300',
  pediatria: 'bg-amber-500/30 border-amber-700 text-amber-300',
  saude_coletiva: 'bg-green-500/30 border-green-700 text-green-300',
}

interface StudyBlock {
  id: string
  day: number
  time: string
  area: ENAMEDArea
  topic?: string
}

const STORAGE_KEY = 'darwin-weekly-planner'

export function WeeklyPlanner() {
  const [blocks, setBlocks] = useState<StudyBlock[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [adding, setAdding] = useState<{ day: number; time: string } | null>(null)
  const [selectedArea, setSelectedArea] = useState<ENAMEDArea>('clinica_medica')
  const [topicInput, setTopicInput] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
  }, [blocks])

  function addBlock() {
    if (!adding) return
    const block: StudyBlock = {
      id: crypto.randomUUID(),
      day: adding.day,
      time: adding.time,
      area: selectedArea,
      topic: topicInput || undefined,
    }
    setBlocks(prev => [...prev, block])
    setAdding(null)
    setTopicInput('')
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  function getBlock(day: number, time: string) {
    return blocks.find(b => b.day === day && b.time === time)
  }

  // Summary stats
  const hoursPerArea = (Object.keys(AREA_LABELS) as ENAMEDArea[]).map(area => ({
    area,
    hours: blocks.filter(b => b.area === area).length,
  }))
  const totalHours = blocks.length

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-surface-1 rounded-lg border border-separator">
        {hoursPerArea.map(({ area, hours }) => (
          <div key={area} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-sm ${AREA_SLOT_COLORS[area].split(' ')[0]}`} />
            <span className="text-label-secondary">{AREA_LABELS[area]}:</span>
            <span className="font-medium text-white">{hours}h</span>
          </div>
        ))}
        <div className="ml-auto text-sm font-medium text-white">{totalHours}h total</div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-px mb-px">
            <div />
            {DAYS.map((day, i) => (
              <div key={day} className="text-center text-xs font-medium text-label-secondary py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Time rows */}
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-[80px_repeat(7,1fr)] gap-px">
              <div className="text-xs text-label-tertiary py-2 pr-2 text-right">{time}</div>
              {DAYS.map((_, dayIdx) => {
                const block = getBlock(dayIdx, time)
                return (
                  <div
                    key={dayIdx}
                    className="relative min-h-[40px] bg-surface-1 hover:bg-surface-2 transition-colors rounded-sm cursor-pointer group"
                    onClick={() => !block && setAdding({ day: dayIdx, time })}
                  >
                    {block ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute inset-0.5 rounded-sm border px-1.5 py-1 text-[10px] leading-tight ${AREA_SLOT_COLORS[block.area]}`}
                      >
                        <div className="font-medium truncate">{AREA_LABELS[block.area]}</div>
                        {block.topic && <div className="truncate opacity-70">{block.topic}</div>}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
                          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3 text-label-quaternary" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add block dialog */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={spring.gentle}
            className="p-4 bg-surface-2 rounded-lg border border-separator space-y-3"
          >
            <div className="text-sm font-medium text-white">
              {DAYS[adding.day]} — {adding.time}
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AREA_LABELS) as ENAMEDArea[]).map(area => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedArea === area
                      ? AREA_SLOT_COLORS[area]
                      : 'border-separator text-label-secondary hover:text-white'
                  }`}
                >
                  {AREA_LABELS[area]}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Tópico (opcional)"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              className="w-full px-3 py-2 bg-surface-1 border border-separator rounded-lg text-white text-sm placeholder:text-label-quaternary"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAdding(null)}>Cancelar</Button>
              <Button size="sm" onClick={addBlock}>Adicionar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print button */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
