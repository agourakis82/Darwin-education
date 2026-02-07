import { Skeleton } from '@/components/ui/Skeleton'

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs Skeleton */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Stats Header Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* Entries Skeleton */}
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}
