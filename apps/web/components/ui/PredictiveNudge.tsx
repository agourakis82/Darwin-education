'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

interface PredictiveNudgeProps {
  message: string
  delay?: number
}

/**
 * Glassmorphic predictive UX nudge.
 * Appears floating in the corner to provide dopamine hits or insights.
 */
export function PredictiveNudge({ message, delay = 2 }: PredictiveNudgeProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={spring.bouncy}
          className="fixed bottom-6 right-6 z-[60] max-w-sm"
        >
          <div className="relative group">
            {/* Glow Background */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-surface-1/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/10 shadow-inner-shine">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  Previsão SOTA+++
                </h4>
                <p className="text-sm text-label-primary leading-relaxed pr-4">
                  {message}
                </p>
              </div>

              <button 
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 text-label-quaternary hover:text-label-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
