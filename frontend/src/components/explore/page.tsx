"use client"

import { useState, useEffect } from "react"
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
import { useCarState, useCarDispatch, CarActionTypes } from "../contexts/carlistcontext" // Import your car context

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("swipe")
  const [currentCarIndex, setCurrentCarIndex] = useState(0)
  const [swipedCars, setSwipedCars] = useState<string[]>([])
  const [likedCars, setLikedCars] = useState<string[]>([])
  
  // Use your car context
  const { cars, isLoading, error } = useCarState()
  const dispatch = useCarDispatch()
  
  useEffect(() => {
    // Fetch cars from the server when the component mounts
    if (cars.length === 0) {
      fetchCars()
    }
  }, [cars.length])
  
  const fetchCars = async () => {
    try {
      // Dispatch loading state
      dispatch({
        type: CarActionTypes.FETCH_CARS_REQUEST
      })
      
      const response = await fetch('http://getcarroute', {
        method: 'POST', // Changed to POST since you're sending data
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ swipedCars, likedCars })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const newCars = await response.json();
      
      // Update state with new cars
      dispatch({
        type: CarActionTypes.FETCH_CARS_SUCCESS,
        payload: newCars
      });
    } catch (error) {
      dispatch({
        type: CarActionTypes.FETCH_CARS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  const handleLike = (carId: string) => {
    setLikedCars(prev => [...prev, carId])
    setSwipedCars(prev => [...prev, carId])
    goToNextCar()
  }

  const handlePass = (carId: string) => {
    setSwipedCars(prev => [...prev, carId])
    goToNextCar()
  }

  const goToNextCar = () => {
    if (currentCarIndex < cars.length - 1) {
      setCurrentCarIndex(currentCarIndex + 1)
    } else {
      // Out of cars, fetch more
      fetchCars()
      // Reset index
      setCurrentCarIndex(0)
    }
  }

  // If there are no cars or loading, show loading state
  if (isLoading && cars.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div>Loading cars...</div>
        </main>
        <Footer />
      </div>
    )
  }
  
  // If there's an error, show error message
  if (error && cars.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div>Error loading cars: {error}. <Button onClick={fetchCars}>Retry</Button></div>
        </main>
        <Footer />
      </div>
    )
  }
  
  // If we have no cars even after trying to load, show empty state
  if (cars.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div>No cars found. <Button onClick={fetchCars}>Refresh</Button></div>
        </main>
        <Footer />
      </div>
    )
  }

  const currentCar = cars[currentCarIndex]
  const remainingCars = cars.length - swipedCars.length

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
                {cars.map((car, i) => (
                  <Link href={`/car/${car.entryID}`} key={car.entryID}>
                    <Card className="overflow-hidden bg-gray-900 border-gray-800 swipe-card car-card-shadow">
                      <div className="relative h-64">
                        <Image src={car.s3ContentID || "/placeholder.svg"} alt={car.carName} fill className="object-cover" />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-white">{car.carName}</h3>
                            <p className="text-gray-400 text-sm">By @{car.userID}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart
                              className={`h-4 w-4 ${likedCars.includes(car.entryID?.toString() || "") ? "text-primary fill-primary" : "text-gray-400"}`}
                            />
                            <span className="text-sm">{car.upvotes}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs text-white">
                            {car.carMake}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-white">
                            {car.region}
                          </Badge>
                          {car.carColor && (
                            <Badge variant="outline" className="text-xs text-white">
                              {car.carColor}
                            </Badge>
                          )}
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
                        src={currentCar.s3ContentID || "/placeholder.svg"}
                        alt={currentCar.carName}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 car-image-gradient" />

                      <Link
                        href={`/car/${currentCar.entryID}`}
                        className="absolute top-4 right-4 bg-black/60 rounded-full p-2 hover:bg-black/80 z-10"
                      >
                        <Info className="h-5 w-5" />
                      </Link>

                      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-2xl">{currentCar.carName}</h3>
                            <div className="flex items-center gap-1 bg-black/60 rounded-full px-3 py-1">
                              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                              <span className="text-sm">{currentCar.upvotes}</span>
                            </div>
                          </div>
                          <p className="text-gray-300">By @{currentCar.userID}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs text-white">
                              {currentCar.carMake}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-white">
                              {currentCar.region}
                            </Badge>
                            {currentCar.carColor && (
                              <Badge variant="outline" className="text-xs text-white">
                                {currentCar.carColor}
                              </Badge>
                            )}
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
                          onClick={() => handlePass(currentCar.entryID?.toString() || "")}
                        >
                          <X className="h-5 w-5 mr-2 text-gray-500" />
                          Pass
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 text-black"
                          onClick={() => handleLike(currentCar.entryID?.toString() || "")}
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