import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero skeleton */}
      <Skeleton className="h-[400px] sm:h-[500px] lg:h-[600px] w-full rounded-xl" />

      {/* Category tiles skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>

      {/* Product sliders skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-[200px] sm:w-[240px] aspect-[3/4] rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
