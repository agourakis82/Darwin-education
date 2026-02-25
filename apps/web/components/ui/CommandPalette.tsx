'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import {
  FileText,
  Layers,
  Route,
  Puzzle,
  Wrench,
  BarChart3,
  Bot,
  BookOpen,
  Target,
  Sparkles,
  Brain,
  GraduationCap,
  FlaskConical,
  Search,
  PlayCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CommandRoute {
  name: string
  href: string
  icon: LucideIcon
  group: string
  keywords?: string
}

const ROUTES: CommandRoute[] = [
  { name: 'Simulado ENAMED', href: '/simulado', icon: FileText, group: 'Praticar', keywords: 'questao prova tri' },
  { name: 'Iniciar Simulado Adaptativo', href: '/simulado/adaptive', icon: PlayCircle, group: 'Praticar', keywords: 'cat adaptativo' },
  { name: 'Flashcards', href: '/flashcards', icon: Layers, group: 'Praticar', keywords: 'memorizar repeticao espacada' },
  { name: 'Trilhas de Estudo', href: '/trilhas', icon: Route, group: 'Praticar', keywords: 'caminho modulo' },
  { name: 'Monte sua Prova', href: '/montar-prova', icon: Wrench, group: 'Praticar', keywords: 'personalizar prova' },
  { name: 'Quebra-Cabeça Clínico', href: '/cip', icon: Puzzle, group: 'Praticar', keywords: 'caso clinico imagem' },
  { name: 'Raciocínio Clínico Fractal', href: '/fcr', icon: Brain, group: 'Praticar', keywords: 'raciocinio diagnostico' },
  { name: 'Desempenho', href: '/desempenho', icon: BarChart3, group: 'Analisar', keywords: 'score tri estatistica' },
  { name: 'Diagnóstico de Lacunas', href: '/ddl', icon: Target, group: 'Analisar', keywords: 'lacunas dificuldade' },
  { name: 'QGen DDL', href: '/qgen', icon: Sparkles, group: 'Analisar', keywords: 'gerar questao ia' },
  { name: 'IA Orientação', href: '/ia-orientacao', icon: Bot, group: 'Estudar', keywords: 'inteligencia artificial recomendacao' },
  { name: 'Conteúdo Médico', href: '/conteudo', icon: BookOpen, group: 'Estudar', keywords: 'doencas medicamentos teoria' },
  { name: 'Métodos de Estudo', href: '/metodos-estudo', icon: GraduationCap, group: 'Estudar', keywords: 'pomodoro tecnica' },
  { name: 'Psicometria Avançada', href: '/pesquisa/psicometria', icon: FlaskConical, group: 'Pesquisa', keywords: 'mirt irt dif' },
]

const GROUPS = ['Praticar', 'Analisar', 'Estudar', 'Pesquisa']

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function navigate(href: string) {
    router.push(href)
    handleClose()
  }

  return (
    <>
      {/* Trigger hint (visible in navigation bar area) */}
      <button
        onClick={handleOpen}
        className="
          hidden md:flex items-center gap-2 rounded-xl
          border border-separator/60 bg-surface-1/60 px-3 py-1.5
          text-xs text-tertiary-label
          hover:bg-surface-2/70 hover:border-separator/80
          transition-all duration-150 ease-ios
          backdrop-blur-sm
        "
        aria-label="Abrir paleta de comandos (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-1 rounded border border-separator/60 bg-surface-2/80 px-1 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-overlay bg-black/55 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-[18vh] z-modal w-[min(92vw,38rem)] -translate-x-1/2"
            >
              <Command
                className="window-chrome overflow-hidden"
                shouldFilter={true}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-separator/40 px-4">
                  <Search className="h-4 w-4 shrink-0 text-tertiary-label" />
                  <CommandInput
                    placeholder="Buscar função ou navegar..."
                    className="w-full bg-transparent py-4 text-sm text-label outline-none placeholder:text-quaternary-label"
                    autoFocus
                  />
                  <button
                    onClick={handleClose}
                    className="shrink-0 rounded-md border border-separator/60 bg-surface-2/70 px-1.5 py-0.5 text-[10px] font-mono text-tertiary-label"
                  >
                    esc
                  </button>
                </div>

                {/* Results */}
                <CommandList className="max-h-[50vh] overflow-y-auto p-2">
                  <CommandEmpty className="py-10 text-center text-sm text-tertiary-label">
                    Nenhum resultado encontrado.
                  </CommandEmpty>

                  {GROUPS.map((group) => {
                    const items = ROUTES.filter((r) => r.group === group)
                    return (
                      <CommandGroup
                        key={group}
                        heading={group}
                        className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-tertiary-label"
                      >
                        {items.map((route) => (
                          <CommandItem
                            key={route.href}
                            value={`${route.name} ${route.keywords ?? ''}`}
                            onSelect={() => navigate(route.href)}
                            className="
                              flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5
                              text-sm text-label
                              transition-colors duration-100
                              aria-selected:bg-surface-2/80
                              hover:bg-surface-1/80
                              outline-none
                            "
                          >
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-separator/60 bg-surface-2/60 text-secondary-label">
                              <route.icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1 truncate">{route.name}</span>
                            <span className="shrink-0 text-xs text-quaternary-label">→</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )
                  })}
                </CommandList>

                {/* Footer */}
                <div className="flex items-center gap-4 border-t border-separator/40 px-4 py-2 text-[11px] text-quaternary-label">
                  <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> navegar</span>
                  <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> abrir</span>
                  <span className="flex items-center gap-1"><kbd className="font-mono">esc</kbd> fechar</span>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
