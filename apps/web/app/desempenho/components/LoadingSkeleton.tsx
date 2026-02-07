'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Header */}
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-surface-2 rounded w-1/4" />
            <div className="h-4 bg-surface-2 rounded w-1/3" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-pulse">
          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="h-8 bg-surface-2 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-surface-2 rounded w-1/2 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score History Chart */}
              <Card>
                <CardHeader>
                  <div className="h-6 bg-surface-2 rounded w-1/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-surface-2/50 rounded" />
                </CardContent>
              </Card>

              {/* Area Performance Radar */}
              <Card>
                <CardHeader>
                  <div className="h-6 bg-surface-2 rounded w-1/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-80 bg-surface-2/50 rounded" />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-surface-2 rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 bg-surface-2/50 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Attempts Table */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-surface-2 rounded w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-surface-2/50 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
