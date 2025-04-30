
import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { ArrowRight, Heart, ThumbsUp, Trophy, Upload } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src="/placeholder.svg?height=1080&width=1920"
              alt="Featured car"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 hero-gradient" />
          </div>
          <div className="container relative z-10">
            <div className="max-w-2xl space-y-6">
              <Badge className="text-lg py-1.5 px-3 bg-primary text-white">Bench Racers</Badge>
              <h1 className="text-4xl md:text-6xl font-bold">Rate. Build. Inspire.</h1>
              <p className="text-xl text-gray-200">
                The ultimate platform for car enthusiasts to showcase their builds, vote on others, and get inspired.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/upload">
                  <Button size="lg" className="gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Your Car
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button size="lg" variant="outline" className="gap-2">
                    Explore Builds
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-950">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Upload</h3>
                <p className="text-gray-400">Share photos and details of your car build with the community.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <ThumbsUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Vote</h3>
                <p className="text-gray-400">Swipe and vote on other enthusiasts' builds to help them rank.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Get Ranked</h3>
                <p className="text-gray-400">See how your build ranks against others in your category.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Cars This Week */}
        <section className="py-20">
          <div className="container">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Top Cars This Week</h2>
              <Link href="/rankings">
                <Button variant="ghost" className="gap-2">
                  View All Rankings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Link href={`/car/${i}`} key={i}>
                  <Card className="overflow-hidden bg-gray-900 border-gray-800 swipe-card car-card-shadow">
                    <div className="relative h-64">
                      <Image
                        src={`/placeholder.svg?height=600&width=800`}
                        alt={`Top car ${i}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-white">#{i}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-white">2023 Toyota GR86</h3>
                          <p className="text-gray-400 text-sm">Modified by @user{i}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                          <span className="text-sm">{980 - i * 100}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs text-white">
                          Tuned
                        </Badge>
                        <Badge variant="outline" className="text-xs text-white">
                          Track
                        </Badge>
                        <Badge variant="outline" className="text-xs text-white">
                          JDM
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-primary/10">
          <div className="container text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to showcase your ride?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of car enthusiasts who are already sharing their builds and getting feedback.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/upload">
                <Button size="lg" className="gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your Car
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="gap-2">
                  Explore Builds
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
