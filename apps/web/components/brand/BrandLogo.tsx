'use client'

import Image from 'next/image'

interface BrandLogoProps {
  variant?: 'horizontal' | 'symbol'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  priority?: boolean
}

const sizeMap = {
  horizontal: {
    sm: { width: 156, height: 32 },
    md: { width: 190, height: 38 },
    lg: { width: 240, height: 48 },
  },
  symbol: {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
  },
} as const

export function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  priority = false,
}: BrandLogoProps) {
  const dimensions = sizeMap[variant][size]

  const lightSrc =
    variant === 'horizontal'
      ? '/brand/logo/darwin-logo-horizontal-full-light.svg'
      : '/brand/logo/darwin-symbol-full-light.svg'
  const darkSrc =
    variant === 'horizontal'
      ? '/brand/logo/darwin-logo-horizontal-full-dark.svg'
      : '/brand/logo/darwin-symbol-full-dark.svg'

  return (
    <span className={`relative inline-flex items-center ${className}`} aria-label="Darwin Education">
      <Image
        src={lightSrc}
        alt="Darwin Education"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="dark:hidden"
      />
      <Image
        src={darkSrc}
        alt="Darwin Education"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="hidden dark:block"
      />
    </span>
  )
}

