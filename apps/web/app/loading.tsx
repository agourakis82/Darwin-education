import { SkeletonGrid } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="h-10 w-64 bg-surface-2 rounded-lg animate-pulse mx-auto mb-4" />
      <div className="h-5 w-96 max-w-full bg-surface-2 rounded animate-pulse mx-auto mb-12" />
      <SkeletonGrid items={6} columns={3} />
    </div>
  )
}
