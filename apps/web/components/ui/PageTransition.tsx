'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { spring } from '@/lib/motion'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className={className}
    >
      {children}
    </motion.div>
  )
}
