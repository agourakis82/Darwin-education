'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import type { ReactNode } from 'react'

interface AnimatedListProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export const animatedItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: spring.gentle,
  },
}

export function AnimatedList({ children, className, staggerDelay = 0.06 }: AnimatedListProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay },
        },
      }}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={animatedItem} className={className}>
      {children}
    </motion.div>
  )
}
