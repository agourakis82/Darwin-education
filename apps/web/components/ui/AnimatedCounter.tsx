'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useTransform, animate, motion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  decimals?: number
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 1.5,
  className = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (latest) => {
    const num = decimals > 0
      ? latest.toFixed(decimals)
      : Math.round(latest).toLocaleString('pt-BR')
    return `${prefix}${num}${suffix}`
  })

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: 'easeOut',
      })
      return controls.stop
    }
  }, [isInView, value, duration, motionValue])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
}
