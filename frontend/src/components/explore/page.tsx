"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../navbar"
import { Footer } from "../footer"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Input } from "../ui/input"
import { Heart, MessageCircle, Share2, Filter, Search, X, Info } from "lucide-react"

// Mock data for demonstration
const mockCars = [
  {
    id: "1",
    name: "Nissan Skyline GT-R R34",
    owner: "godzilla",
    image: "/placeholder.svg?height=1200&width=800",
    likes: 1024,
    tags: ["JDM", "Turbo", "Track"],
    description:
      "Fully built RB26DETT pushing 650whp with a single Garrett GTX3582R turbo. Full Nismo aero kit and TE37 wheels. This Bayside Blue R34 has been my dream build for over 5 years.",
  },
  {
    id: "2",
    name: "BMW M4 Competition",
    owner: "bmwfanatic",
    image: "/placeholder.svg?height=1200&width=800",
    likes: 876,
    tags: ["European", "Tuned", "Track"],
    description:
      'FBO with downpipes, custom tune, and KW V3 coilovers. Running 20" BBS FI-R wheels with Michelin PS4S tires. Pushing 550whp and 560wtq on 93 octane.',
  },
  {
    id: "3",
    name: "Toyota Supra MK4",
    owner: "2jzpower",
    image: "/placeholder.svg?height=1200&width=800",
    likes: 756,
    tags: ["JDM", "Turbo", "Classic"],
    description:
      "Single turbo 2JZ build with 800whp. Full Ridox aero kit and custom titanium exhaust. Completely rebuilt bottom end with Titan Motorsports rods and CP pistons.",
  },
  {
    id: "4",
    name: "Honda Civic Type R",
    owner: "vtecjunkie",
    image: "/placeholder.svg?height=1200&width=800",
    likes: 645,
    tags: ["JDM", "Hot Hatch", "Daily"],
    description:
      "K20C1 with bolt-ons and custom ECU tune. Functional aero upgrades and Advan Racing GT wheels. Daily driven but track ready with Öhlins coilovers.",
  },
  {
    id: "5",
    name: "Ford Mustang GT",
    owner: "musclecar",
    image: "/placeholder.svg?height=1200&width=800",
    likes: 589,
    tags: ["American", "Muscle", "V8"],
    description:
      "Supercharged Coyote 5.0 with full exhaust and suspension upgrades. Whipple Gen 3 supercharger pushing 750whp. Custom interior with Recaro seats and roll cage.",
  },
]

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("swipe")
  const [currentCarIndex, setCurrentCarIndex] = useState(0)
  const [swipedCars, setSwipedCars] = useState<string[]>([])
  const [likedCars, setLikedCars] = useState<string[]>([])

  const handleLike = (carId: string) => {
    setLikedCars([...likedCars, carId])
    setSwipedCars([...swipedCars, carId])
    goToNextCar()
  }

  const handlePass = (carId: string) => {
    setSwipedCars([...swipedCars, carId])
    goToNextCar()
  }

  const goToNextCar = () => {
    if (currentCarIndex < mockCars.length - 1) {
      setCurrentCarIndex(currentCarIndex + 1)
    } else {
      // Reset to first car or show "no more cars" message
      setCurrentCarIndex(0)
      setSwipedCars([])
    }
  }

  const currentCar = mockCars[currentCarIndex]
  const remainingCars = mockCars.length - swipedCars.length

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">Explore Builds</h1>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Search builds..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="swipe">Swipe View</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  All
                </Button>
                <Button variant="outline" size="sm">
                  JDM
                </Button>
                <Button variant="outline" size="sm">
                  European
                </Button>
                <Button variant="outline" size="sm">
                  American
                </Button>
              </div>
            </div>

            <TabsContent value="grid" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCars.map((car, i) => (
                  <Link href={`/car/${car.id}`} key={i}>
                    <Card className="overflow-hidden bg-gray-900 border-gray-800 swipe-card car-card-shadow">
                      <div className="relative h-64">
                        <Image src={car.image || "/placeholder.svg"} alt={car.name} fill className="object-cover" />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-white">{car.name}</h3>
                            <p className="text-gray-400 text-sm">By @{car.owner}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart
                              className={`h-4 w-4 ${likedCars.includes(car.id) ? "text-primary fill-primary" : "text-gray-400"}`}
                            />
                            <span className="text-sm">{car.likes}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {car.tags.map((tag, j) => (
                            <Badge key={j} variant="outline" className="text-xs text-white">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-between">
                          <div className="flex gap-3">
                            <Button variant="ghost" size="sm" className="h-8 px-2 bg-white hover:bg-gray-200">
                              <Heart className="h-4 w-4 mr-1 " />
                              Like
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 bg-white hover:bg-gray-200">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Comment
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="swipe" className="mt-6">
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-400 mb-4">{remainingCars} cars remaining to review</div>

                <div className="w-full max-w-3xl">
                  <Card className="overflow-hidden bg-gray-900 border-gray-800 car-card-shadow swipe-card-large text-white">
                    <div className="relative h-[70vh] md:h-[80vh]">
                      <Image
                        src={currentCar.image || "/placeholder.svg"}
                        alt={currentCar.name}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 car-image-gradient" />

                      <Link
                        href={`/car/${currentCar.id}`}
                        className="absolute top-4 right-4 bg-black/60 rounded-full p-2 hover:bg-black/80 z-10"
                      >
                        <Info className="h-5 w-5" />
                      </Link>

                      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-2xl">{currentCar.name}</h3>
                            <div className="flex items-center gap-1 bg-black/60 rounded-full px-3 py-1">
                              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                              <span className="text-sm">{currentCar.likes}</span>
                            </div>
                          </div>
                          <p className="text-gray-300">By @{currentCar.owner}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentCar.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-white">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-300 mt-2 line-clamp-3">{currentCar.description}</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between gap-4">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 text-black"
                          onClick={() => handlePass(currentCar.id)}
                        >
                          <X className="h-5 w-5 mr-2 text-gray-500" />
                          Pass
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 text-black"
                          onClick={() => handleLike(currentCar.id)}
                        >
                          <Heart className="h-5 w-5 mr-2 text-red-500" fill="currentColor" />
                          Like
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
