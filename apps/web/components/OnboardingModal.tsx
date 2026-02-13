'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { GraduationCap, Target, Zap, Flag, TrendingUp, Trophy, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ONBOARDING_KEY = 'darwin-onboarding-complete'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`
}

const goals = [
  { id: 'first_time', label: 'Primeira vez no ENAMED', Icon: Flag, tone: 'text-emerald-300' },
  { id: 'improve', label: 'Melhorar minha nota', Icon: TrendingUp, tone: 'text-sky-300' },
  { id: 'maintain', label: 'Manter desempenho alto', Icon: Trophy, tone: 'text-amber-300' },
  { id: 'explore', label: 'Apenas explorar', Icon: Search, tone: 'text-violet-300' },
]

export function OnboardingModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [quickPreset, setQuickPreset] = useState({ count: 20, time: 60 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      setIsOpen(true)
      void loadQuickPreset()
    }
  }, [])

  async function loadQuickPreset() {
    try {
      const supabase = createClient()

      const preferred = await (supabase
        .from('exams') as any)
        .select('question_count, time_limit_minutes')
        .eq('is_public', true)
        .gte('question_count', 20)
        .gt('time_limit_minutes', 0)
        .order('question_count', { ascending: true })
        .limit(1)
        .maybeSingle()

      const fallback = preferred.data
        ? preferred
        : await (supabase
            .from('exams') as any)
            .select('question_count, time_limit_minutes')
            .eq('is_public', true)
            .gt('question_count', 0)
            .gt('time_limit_minutes', 0)
            .order('question_count', { ascending: true })
            .limit(1)
            .maybeSingle()

      const exam = fallback.data || preferred.data
      const questionCount = typeof exam?.question_count === 'number' ? exam.question_count : null
      const timeLimitMinutes = typeof exam?.time_limit_minutes === 'number' ? exam.time_limit_minutes : null

      if (questionCount && timeLimitMinutes) {
        setQuickPreset({ count: questionCount, time: timeLimitMinutes })
      }
    } catch {
      // Keep defaults.
    }
  }

  const quickLabel = `${quickPreset.count} questões, ${formatDuration(quickPreset.time)}`

  const steps: OnboardingStep[] = [
    {
      icon: <GraduationCap className="w-10 h-10 text-emerald-400" />,
      title: 'Bem-vindo ao Darwin Education',
      description:
        'A plataforma mais avançada para preparação do ENAMED. Questões calibradas por TRI, repetição espaçada e trilhas personalizadas.',
    },
    {
      icon: <Target className="w-10 h-10 text-sky-300" />,
      title: 'Qual seu objetivo?',
      description: 'Selecione para personalizarmos sua experiência.',
    },
    {
      icon: <Zap className="w-10 h-10 text-yellow-400" />,
      title: 'Pronto para começar!',
      description: `Recomendamos iniciar com um Simulado Rápido (${quickLabel}) para calibrar seu nível e identificar lacunas.`,
    },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  const handleComplete = (action: 'simulado' | 'flashcards' | 'explore') => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    if (selectedGoal) {
      localStorage.setItem('darwin-user-goal', selectedGoal)
    }
    setIsOpen(false)

    if (action === 'simulado') {
      router.push(`/montar-prova?count=${quickPreset.count}&time=${quickPreset.time}`)
    } else if (action === 'flashcards') {
      router.push('/flashcards')
    }
  }

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} size="md" closeOnOverlayClick={false}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step indicator */}
          <div className="mb-6 flex justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-8 bg-emerald-400'
                    : i < step
                    ? 'w-4 bg-emerald-500/45'
                    : 'w-4 bg-surface-4/80'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-separator/80 bg-surface-2/70 shadow-elevation-1">
              {steps[step].icon}
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="mb-2 text-center text-2xl font-semibold text-label-primary">
            {steps[step].title}
          </h3>
          <p className="mb-6 text-center text-sm text-label-secondary">
            {steps[step].description}
          </p>

          {(step === 0 || step === 2) && (
            <div className="relative mb-6 h-40 overflow-hidden rounded-2xl border border-separator/70">
              <Image
                src="/brand/kitA/onb-repeticao-espacada-v3-light-1024x1024.png"
                alt="Visual da jornada de repetição espaçada"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover object-center opacity-90 dark:hidden"
              />
              <Image
                src="/brand/kitA/onb-repeticao-espacada-v3-dark-1024x1024.png"
                alt="Visual da jornada de repetição espaçada"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="hidden object-cover object-center opacity-90 dark:block"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-white/45 dark:hidden" />
              <div className="absolute inset-0 hidden bg-gradient-to-b from-surface-0/10 to-surface-0/65 dark:block" />
            </div>
          )}

          {/* Step-specific content */}
          {step === 1 && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {goals.map((goal) => {
                const GoalIcon = goal.Icon
                return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    selectedGoal === goal.id
                      ? 'border-emerald-400/50 bg-emerald-500/12 text-label-primary'
                      : 'border-separator bg-surface-2/70 text-label-secondary hover:border-separator/90 hover:bg-surface-3/60'
                  }`}
                >
                  <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-separator/70 bg-surface-1/70">
                    <GoalIcon className={`h-5 w-5 ${goal.tone}`} />
                  </span>
                  <span className="block leading-5">{goal.label}</span>
                </button>
              )})}
            </div>
          )}

          {step === 2 && (
            <div className="mb-6 space-y-3">
              <Button
                fullWidth
                onClick={() => handleComplete('simulado')}
              >
                Fazer Simulado Rápido
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => handleComplete('flashcards')}
              >
                Ir para Flashcards
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => handleComplete('explore')}
              >
                Explorar a plataforma
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 2 && (
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleSkip}>
                Pular
              </Button>
              <Button
                fullWidth
                onClick={handleNext}
                disabled={step === 1 && !selectedGoal}
              >
                {step === 0 ? 'Começar' : 'Próximo'}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  )
}
