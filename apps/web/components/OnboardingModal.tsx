'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { GraduationCap, Target, Zap } from 'lucide-react'

const ONBOARDING_KEY = 'darwin-onboarding-complete'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
}

const steps: OnboardingStep[] = [
  {
    icon: <GraduationCap className="w-10 h-10 text-emerald-400" />,
    title: 'Bem-vindo ao Darwin Education',
    description:
      'A plataforma mais avançada para preparação do ENAMED. Questões calibradas por TRI, repetição espaçada e trilhas personalizadas.',
  },
  {
    icon: <Target className="w-10 h-10 text-purple-400" />,
    title: 'Qual seu objetivo?',
    description:
      'Selecione para personalizarmos sua experiência.',
  },
  {
    icon: <Zap className="w-10 h-10 text-yellow-400" />,
    title: 'Pronto para começar!',
    description:
      'Recomendamos iniciar com um Simulado Rápido (20 questões) para calibrar seu nível e identificar lacunas.',
  },
]

const goals = [
  { id: 'first_time', label: 'Primeira vez fazendo ENAMED', emoji: '🎯' },
  { id: 'improve', label: 'Melhorar nota anterior', emoji: '📈' },
  { id: 'maintain', label: 'Manter desempenho alto', emoji: '🏆' },
  { id: 'explore', label: 'Apenas explorando', emoji: '🔍' },
]

export function OnboardingModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      setIsOpen(true)
    }
  }, [])

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
      router.push('/montar-prova?count=20&time=60')
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
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-8 bg-emerald-500'
                    : i < step
                    ? 'w-4 bg-emerald-500/40'
                    : 'w-4 bg-surface-4'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-surface-3 flex items-center justify-center">
              {steps[step].icon}
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {steps[step].title}
          </h3>
          <p className="text-label-secondary text-center text-sm mb-6">
            {steps[step].description}
          </p>

          {/* Step-specific content */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    selectedGoal === goal.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-separator bg-surface-2 text-label-secondary hover:border-surface-4'
                  }`}
                >
                  <span className="text-lg block mb-1">{goal.emoji}</span>
                  {goal.label}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 mb-6">
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
