'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquarePlus, X, Send, Bug, Lightbulb, MousePointerClick, BookOpen, MessageCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'feature', label: 'Sugestão', icon: Lightbulb },
  { value: 'usability', label: 'Usabilidade', icon: MousePointerClick },
  { value: 'content', label: 'Conteúdo', icon: BookOpen },
  { value: 'general', label: 'Geral', icon: MessageCircle },
] as const

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('general')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (status === 'sent') reset()
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, status])

  function reset() {
    setCategory('general')
    setMessage('')
    setRating(null)
    setStatus('idle')
  }

  async function handleSubmit() {
    if (message.trim().length < 5) return
    setStatus('sending')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          rating,
          page_url: window.location.pathname,
        }),
      })

      if (!res.ok) throw new Error()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  function handleDone() {
    reset()
    setOpen(false)
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full
                     bg-accent-primary text-white shadow-lg
                     hover:bg-accent-primary/90 transition-all
                     hover:scale-105 active:scale-95"
          aria-label="Enviar feedback"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Feedback</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="w-80 sm:w-96 bg-surface-1 border border-separator rounded-2xl shadow-2xl
                     overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-separator bg-surface-2">
            <h3 className="font-semibold text-label-primary text-sm">
              {status === 'sent' ? 'Obrigado!' : 'Enviar Feedback'}
            </h3>
            <button
              onClick={() => { if (status === 'sent') reset(); setOpen(false) }}
              className="p-1 rounded-lg hover:bg-surface-3 text-label-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {status === 'sent' ? (
            <div className="p-6 text-center space-y-3">
              <div className="text-4xl">&#10024;</div>
              <p className="text-label-primary font-medium">Feedback enviado com sucesso!</p>
              <p className="text-label-secondary text-sm">
                Sua opinião é muito importante para melhorarmos a plataforma.
              </p>
              <button
                onClick={handleDone}
                className="mt-2 px-6 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium
                           hover:bg-accent-primary/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Category chips */}
              <div>
                <label className="text-xs font-medium text-label-secondary mb-2 block">Categoria</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const active = category === cat.value
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                          ${active
                            ? 'bg-accent-primary text-white'
                            : 'bg-surface-2 text-label-secondary hover:bg-surface-3'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-label-secondary mb-1.5 block">Mensagem</label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva o que encontrou, o que gostaria de ver, ou como podemos melhorar..."
                  rows={4}
                  maxLength={5000}
                  className="w-full px-3 py-2 rounded-lg border border-separator bg-surface-0
                             text-label-primary text-sm placeholder:text-label-tertiary
                             resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-medium text-label-secondary mb-1.5 block">
                  Como está sua experiência? <span className="text-label-tertiary">(opcional)</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setRating(rating === v ? null : v)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                        ${rating === v
                          ? 'bg-accent-primary text-white'
                          : 'bg-surface-2 text-label-secondary hover:bg-surface-3'
                        }`}
                    >
                      {v === 1 ? '😞' : v === 2 ? '😕' : v === 3 ? '😐' : v === 4 ? '😊' : '🤩'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {status === 'error' && (
                <p className="text-red-400 text-xs">Erro ao enviar. Tente novamente.</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={message.trim().length < 5 || status === 'sending'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                           bg-accent-primary text-white text-sm font-medium
                           hover:bg-accent-primary/90 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {status === 'sending' ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
