import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function SimuladoLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 rounded mb-6" />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-surface-1 border border-separator rounded-xl p-6">
          <Skeleton className="h-4 w-24 rounded mb-4" />
          <SkeletonText lines={3} />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
