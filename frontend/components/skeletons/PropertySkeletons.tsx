import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading profissional para página de detalhes de propriedade
 */
export function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-12 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Skeleton */}
      <div className="pt-20 sm:pt-24 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="w-full pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 xl:gap-12">
            {/* Gallery Column */}
            <div className="lg:col-span-2">
              {/* Mobile Gallery Skeleton */}
              <div className="lg:hidden mb-8">
                <Skeleton className="h-80 sm:h-96 rounded-2xl" />
              </div>

              {/* Desktop Gallery Skeleton */}
              <div className="hidden lg:block mb-8">
                <Skeleton className="h-[600px] rounded-2xl" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-16 w-20 rounded-lg" />
                  <Skeleton className="h-16 w-20 rounded-lg" />
                  <Skeleton className="h-16 w-20 rounded-lg" />
                  <Skeleton className="h-16 w-20 rounded-lg" />
                  <Skeleton className="h-16 w-20 rounded-lg" />
                </div>
              </div>

              {/* Property Info Skeleton */}
              <div className="space-y-8">
                {/* Title and Price Card */}
                <div className="bg-white rounded-lg border border-gray-100 p-6">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-10 w-40" />
                </div>

                {/* Features Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>

                {/* Description Skeleton */}
                <div className="bg-white rounded-lg border border-gray-100 p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Contact Card Skeleton */}
                <div className="bg-white rounded-lg border border-gray-100 p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full" />
                </div>

                {/* Realtor Card Skeleton */}
                <div className="bg-white rounded-lg border border-gray-100 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading para card de propriedade
 */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Skeleton className="h-64 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading para lista de propriedades
 */
export function PropertyListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
