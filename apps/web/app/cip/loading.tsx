import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton'

export default function CIPLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-56 rounded mb-2" />
      <Skeleton className="h-5 w-80 max-w-full rounded mb-8" />
      <SkeletonGrid items={6} columns={3} />
    </div>
  )
}
