'use client'

import { createContext, useContext, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
})

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
}

export function Tabs({ value, onValueChange, className, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('', className)} {...props} />
    </TabsContext.Provider>
  )
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        'darwin-panel inline-flex h-11 items-center justify-center rounded-xl border border-separator/75 p-1 text-label-secondary',
        className
      )}
      role="tablist"
      {...props}
    />
  )
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const ctx = useContext(TabsContext)
  const isActive = ctx.value === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'darwin-focus-ring inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all',
        isActive
          ? 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-300 shadow-inner-shine'
          : 'border border-transparent text-label-secondary hover:border-separator/75 hover:bg-surface-3/65 hover:text-label-primary',
        className
      )}
      {...props}
    />
  )
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ className, value, ...props }: TabsContentProps) {
  const ctx = useContext(TabsContext)
  if (ctx.value !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('mt-2', className)}
      {...props}
    />
  )
}
