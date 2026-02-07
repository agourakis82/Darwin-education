import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function DesempenhoLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 rounded mb-8" />
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
