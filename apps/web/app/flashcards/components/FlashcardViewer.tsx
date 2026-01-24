'use client'

import { motion } from 'framer-motion'

interface FlashcardViewerProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

export function FlashcardViewer({ front, back, isFlipped, onFlip }: FlashcardViewerProps) {
  return (
    <div
      className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900
            border border-slate-700 rounded-2xl p-8 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">
              Pergunta
            </div>
            <p className="text-xl md:text-2xl text-white font-medium leading-relaxed">
              {front}
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-900/30 to-slate-900
            border border-emerald-800/50 rounded-2xl p-8 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">
            <div className="text-xs text-emerald-500 uppercase tracking-wider mb-4">
              Resposta
            </div>
            <p className="text-xl md:text-2xl text-white font-medium leading-relaxed">
              {back}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Flip indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-slate-500 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Clique para virar</span>
      </div>
    </div>
  )
}
