"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Input } from "../ui/input"
import { Heart, MessageCircle, Share2, Filter, Search, X, Info } from "lucide-react"
import { useCarState, useCarDispatch, CarActionTypes } from "../contexts/carlistcontext" 
import { getS3ImageUrl } from "../utils/s3helper"

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("swipe")
  const [currentCarIndex, setCurrentCarIndex] = useState(0)
  const [swipedCars, setSwipedCars] = useState<string[]>([])
  const [likedCars, setLikedCars] = useState<string[]>([])
  
  const { cars, isLoading, error } = useCarState()
  const dispatch = useCarDispatch()
  
  console.log("🟦 Component render - cars length:", cars.length);
  console.log("🟦 Component render - isLoading:", isLoading);
  console.log("🟦 Component render - error:", error);
  console.log("🟦 Component render - dispatch function:", typeof dispatch);
  
  useEffect(() => {
    console.log("🟦 useEffect triggered - cars.length:", cars.length);
    if (cars.length === 0) {
      fetchCars()
    }
  }, [cars.length])
  
  useEffect(() => {
    console.log("🟦 Cars state updated in component:", cars);
  }, [cars])
  
  const handleLike = async (carId: string) => {
    console.log("🚀 likeCars called with carID:", carId)
    try {
        const response = await fetch('https://api.benchracershq.com/api/explore/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ carId })
        });
        console.log("🚀 likeCars API response status:", response.status)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("🚀 likeCars API response data:", data);
        
        if (data.success) {
            setSwipedCars(prev => [...prev, carId])
            goToNextCar()
        }
        
        
    } catch (error) {
        console.error("🚀 likeCars error:", error)
        
    }
  };
  
  const fetchCars = async () => {
    console.log("🚀 fetchCars called");
    try {
      console.log("🚀 About to dispatch FETCH_CARS_REQUEST");
      
      // Start loading
      dispatch({
        type: CarActionTypes.FETCH_CARS_REQUEST
      })
      
      console.log("🚀 FETCH_CARS_REQUEST dispatched");
      
      const response = await fetch('https://api.benchracershq.com/api/explore/cars', { 
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            swipedCars, 
            likedCars,
            limit: 10
        })
      });
      
      console.log("🚀 API response received:", response.status);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const apiResponse = await response.json();
      console.log("🚀 API Response:", apiResponse);
      
      const newCars = apiResponse.data || apiResponse;
      console.log("🚀 Extracted cars:", newCars);
      console.log("🚀 Is newCars an array?", Array.isArray(newCars));
      console.log("🚀 newCars length:", newCars.length);
      
      console.log("🚀 About to dispatch FETCH_CARS_SUCCESS with payload:", newCars);
      
      // Manually dispatch success with the cars data
      dispatch({
        type: CarActionTypes.FETCH_CARS_SUCCESS,
        payload: newCars
      });
      
      console.log("🚀 FETCH_CARS_SUCCESS dispatched");
      
    } catch (error) {
      console.error("🚀 Fetch cars error:", error);
      console.log("🚀 About to dispatch FETCH_CARS_FAILURE");
      
      // Manually dispatch failure
      dispatch({
        type: CarActionTypes.FETCH_CARS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      console.log("🚀 FETCH_CARS_FAILURE dispatched");
    }
  };

  const handlePass = (carId: string) => {
    setSwipedCars(prev => [...prev, carId])
    goToNextCar()
  }

  const goToNextCar = () => {
    if (currentCarIndex < cars.length - 1) {
      setCurrentCarIndex(currentCarIndex + 1)
    } else {
      fetchCars()
      setCurrentCarIndex(0)
    }
  }

  // Debug: manually set some test data
  const handleTestData = () => {
    console.log("🧪 Test data button clicked");
    console.log("🧪 Dispatch function:", dispatch);
    console.log("🧪 CarActionTypes:", CarActionTypes);
    
    const testCars = [
      {
        entryID: 1,
        userID: "testuser1",
        carName: "Test Car 1",
        carMake: "Toyota",
        carModel: "Supra",
        s3ContentID: "/placeholder.svg",
        totalMods: 5,
        totalCost: 10000,
        category: "Sports",
        region: "JDM",
        upvotes: 25,
        viewCount: 100,
        createdAt: "2024-01-01",
        description: "Test car description"
      },
      {
        entryID: 2,
        userID: "testuser2",
        carName: "Test Car 2",
        carMake: "Honda",
        carModel: "Civic",
        s3ContentID: "/placeholder.svg",
        totalMods: 3,
        totalCost: 5000,
        category: "Tuner",
        region: "JDM",
        upvotes: 15,
        viewCount: 50,
        createdAt: "2024-01-02",
        description: "Another test car"
      }
    ];

    console.log("🧪 About to dispatch test data:", testCars);
    console.log("🧪 Action type:", CarActionTypes.FETCH_CARS_SUCCESS);

    dispatch({
      type: CarActionTypes.FETCH_CARS_SUCCESS,
      payload: testCars
    });
    
    console.log("🧪 Test data dispatched");
  };

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
  
  if (error && cars.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div>
            Error loading cars: {error}. 
            <Button onClick={fetchCars} className="ml-2">Retry</Button>
            <Button onClick={handleTestData} variant="outline" className="ml-2">Load Test Data</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  if (cars.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex justify-center items-center">
          <div>
            No cars found. 
            <Button onClick={fetchCars} className="ml-2">Refresh</Button>
            <Button onClick={handleTestData} variant="outline" className="ml-2">Load Test Data</Button>
          </div>
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
              <Button onClick={handleTestData} variant="outline" size="sm">
                Test Data
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
                  {currentCar && (
                    <Card className="overflow-hidden bg-gray-900 border-gray-800 car-card-shadow swipe-card-large text-white">
                      <div className="relative h-70vh] md:h-[80vh]">
                        <img
                          src={currentCar.s3ContentID 
                        ? getS3ImageUrl(currentCar.s3ContentID)
                        : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(currentCar.carName)}`
                          }
                          alt={currentCar.carName}
                          className="absolute inset-0 w-full h-full object-cover"
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
                  )}
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