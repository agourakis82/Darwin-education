interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-3 rounded-lg relative overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SkeletonAvatar({ size = 'md', className = '' }: SkeletonAvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <Skeleton
      className={`rounded-full ${sizeStyles[size]} ${className}`}
      aria-hidden="true"
    />
  )
}

interface SkeletonCardProps {
  lines?: number
  showAvatar?: boolean
  className?: string
}

export function SkeletonCard({
  lines = 3,
  showAvatar = false,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`
        bg-surface-2 rounded-lg shadow-elevation-1 p-6
        ${className}
      `}
      aria-hidden="true"
    >
      <div className={`flex gap-4 ${showAvatar ? '' : 'flex-col'}`}>
        {showAvatar && <SkeletonAvatar size="md" />}
        <div className="flex-1 w-full">
          <Skeleton className="h-6 w-2/3 rounded mb-4" />
          <SkeletonText lines={Math.max(1, lines - 1)} className="w-full" />
        </div>
      </div>
    </div>
  )
}

interface SkeletonListProps {
  items?: number
  showAvatar?: boolean
  className?: string
}

export function SkeletonList({
  items = 3,
  showAvatar = false,
  className = '',
}: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} lines={2} showAvatar={showAvatar} />
      ))}
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-10 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface SkeletonGridProps {
  items?: number
  columns?: number
  className?: string
}

export function SkeletonGrid({
  items = 6,
  columns = 3,
  className = '',
}: SkeletonGridProps) {
  return (
    <div
      className={`grid gap-4 ${
        columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      } ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}
