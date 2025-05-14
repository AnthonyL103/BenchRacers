import { Navbar } from "../utils/navbar"
import { Footer } from "../footer"
import { Skeleton } from "../ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Image Gallery Skeleton */}
        <section className="relative bg-black">
          <div className="relative h-[50vh] md:h-[70vh]">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="container py-4 overflow-x-auto">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-20 w-32 flex-shrink-0 rounded-md" />
              ))}
            </div>
          </div>
        </section>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((index) => (
                  <Skeleton key={index} className="h-6 w-16 rounded-full" />
                ))}
              </div>

              {/* Description */}
              <div>
                <Skeleton className="h-8 w-40 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Modifications */}
              <div>
                <Skeleton className="h-8 w-40 mb-4" />
                <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <Skeleton key={index} className="h-6 w-full" />
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-24 w-full rounded-lg mb-2" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-8">
              {/* Specs */}
              <Skeleton className="h-80 w-full rounded-lg" />

              {/* Rating */}
              <Skeleton className="h-60 w-full rounded-lg" />

              {/* Owner */}
              <Skeleton className="h-40 w-full rounded-lg" />

              {/* Similar Cars */}
              <div>
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
