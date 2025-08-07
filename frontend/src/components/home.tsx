
import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Navbar } from "./utils/navbar"
import { Footer } from "./utils/footer"
import { ArrowRight, Heart, ThumbsUp, Trophy, Upload } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* W full H full basically expands the image the fill the whole thing no matter size object center keeps it centered*/}

        <section className="relative h-[80vh] flex items-center">
         <div className="absolute inset-0 z-0">
            <img
                src="/nissan-skyline-r32-5575992_1920.jpg"
                alt="Featured car"
                
                className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/40" />
            </div>
          <div className="container relative z-10">
            <div className="max-w-2xl space-y-6 p-4 bg-black bg-opacity-60 rounded-lg">

               
                <h1 className="text-4xl md:text-6xl font-bold text-white">Rate. Build. Inspire.</h1>
               
              
              <p className="text-xl text-gray-200">
                The ultimate platform for car enthusiasts to showcase their builds, vote on others, and get inspired.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/garage">
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

        <section className="py-10 bg-gray-950">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-[10vw] h-[16vh] rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-full w-full text-primary" />
                </div>
                <h3 className="text-4xl font-bold text-white">Upload</h3>
                <p className="text-gray-400 text-3xl">Share photos and details of your car build with the community.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-[10vw] h-[16vh] rounded-full flex items-center justify-center mb-4">
                  <ThumbsUp className="h-full w-full text-primary" />
                </div>
                <h3 className="text-4xl font-bold text-white">Vote</h3>
                <p className="text-gray-400 text-3xl">Swipe and vote on other enthusiasts' builds to help them rank.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-[10vw] h-[16vh] rounded-full flex items-center justify-center mb-4">
                  <Trophy className="h-full w-full text-primary" />
                </div>
                <h3 className="text-4xl font-bold text-white">Get Ranked</h3>
                <p className="text-gray-400 text-3xl">See how your build ranks against others in your category.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-900">
          <div className="container text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to showcase your ride?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of car enthusiasts who are already sharing their builds and getting feedback.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/garage">
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
