import type { ReactNode } from 'react'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MarketingFooter />
    </>
  )
}
