import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Loading skeleton for the adaptive setup page.
 * Matches the structure of the actual content for smooth transitions.
 */
export function AdaptiveSetupSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0">
      <header className="sticky top-0 z-10 border-b border-separator bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero image placeholder */}
        <Skeleton className="h-44 md:h-52 rounded-2xl" />

        {/* Area selection card */}
        <div className="darwin-panel rounded-2xl p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Configuration card */}
        <div className="darwin-panel rounded-2xl p-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>

        {/* How it works card */}
        <div className="darwin-panel rounded-2xl p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
            <Skeleton className="h-20 flex-1" />
          </div>
        </div>

        {/* Start button */}
        <Skeleton className="h-14 rounded-xl" />
      </main>
    </div>
  );
}
