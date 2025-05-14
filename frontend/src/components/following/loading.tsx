import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Skeleton } from "../ui/skeleton"
import { Card, CardContent } from "../ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-full md:w-64" />
          </div>

          <div className="mb-8">
            <Skeleton className="h-10 w-full max-w-md mx-auto mb-8" />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gray-900 border-gray-800">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
