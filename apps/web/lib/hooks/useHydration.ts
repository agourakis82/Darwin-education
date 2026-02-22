'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect when client-side hydration is complete.
 * Useful for preventing hydration mismatches with Zustand persist
 * or other client-only state.
 * 
 * @returns boolean indicating if hydration is complete
 * 
 * @example
 * function CATProgress() {
 *   const hydrated = useHydration();
 *   const { precision } = useCATSelectors();
 *   
 *   if (!hydrated) {
 *     return <Skeleton className="h-4 w-20" />;
 *   }
 *   
 *   return <span>{precision.toFixed(1)}% precisão</span>;
 * }
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
