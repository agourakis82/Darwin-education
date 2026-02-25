'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface NeuralScanningProps {
  duration?: number
  onComplete?: () => void
}

/**
 * High-fidelity neural scanning animation effect.
 * Features a horizontal scanning beam and subtle data flickers.
 */
export function NeuralScanning({ duration = 2.5, onComplete }: NeuralScanningProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, duration * 1000)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (!show) return null

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-2xl">
      {/* Scanning Beam */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-glow-purple"
        initial={{ top: '-10%' }}
        animate={{ top: '110%' }}
        transition={{
          duration,
          ease: "linear",
        }}
      />

      {/* Surface Overlay */}
      <motion.div
        className="absolute inset-0 bg-purple-500/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{
          duration,
          times: [0, 0.5, 1],
        }}
      />

      {/* Scanning Text */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
          Scanning Neural Patterns...
        </span>
      </div>
    </div>
  )
}
