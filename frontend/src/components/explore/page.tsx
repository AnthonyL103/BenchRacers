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
import { set } from "date-fns"
import { useUser } from '../contexts/usercontext';

export default function ExplorePage() {
  const { user, isAuthenticated } = useUser();
  const [activeTab, setActiveTab] = useState("swipe")
  const [currentCarIndex, setCurrentCarIndex] = useState(0)
  const [swipedCars, setSwipedCars] = useState<string[]>([])
  const [likedCars, setLikedCars] = useState<string[]>([])
  const [filteredcars, setFilteredCars] = useState<typeof cars>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  
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
  
  const handlefilter = (filter: string) => {
    if (activeFilter === filter) {
        setActiveFilter(null);
        setFilteredCars(cars); 
        return;
    }
    
    setActiveFilter(filter);
    
    if (filter === "all") {
        setFilteredCars(cars);
    }
    else if (filter === "JDM") {
        console.log(cars);
        setFilteredCars(cars.filter(car => car.tags?.includes("JDM")));
    }
    else if (filter === "European") {
        setFilteredCars(cars.filter(car => car.tags?.includes("European")));
    }
    else if (filter === "American") {
        setFilteredCars(cars.filter(car => car.tags?.includes("American")));
    }
    else {
        console.error("Unknown filter type:", filter);
    }
};
  const handleLike = async (carId: string) => {
  if (!isAuthenticated) {
    // Redirect to auth page or show modal
    window.location.href = '/auth';
    return;
  }

  console.log("🚀 likeCars called with carID:", carId)
  try {
    const response = await fetch('https://api.benchracershq.com/api/explore/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ carId })
    });
    console.log("🚀 likeCars API response status:", response.status)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log("🚀 likeCars API response data:", data);
    
    console.log("🚀 likeCars success:", data.success);
    if (data.success) {
      setSwipedCars(prev => [...prev, carId])
      goToNextCar()
    }
  } catch (error) {
    console.error("🚀 likeCars error:", error)
  }
};

const handleComment = (carId: string) => {
  if (!isAuthenticated) {
    // Redirect to auth page or show modal
    window.location.href = '/auth';
    return;
  }
  
  // Add your comment functionality here
  console.log("Comment on car:", carId);
  // For now, just redirect to the car detail page
  window.location.href = `/car/${carId}`;
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
      
      setFilteredCars(cars);
      
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
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="swipe">Swipe View</TabsTrigger>
              </TabsList>
             <div className="flex gap-2">
                <Button 
                    variant={activeFilter === "JDM" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => handlefilter("JDM")}
                    className={activeFilter === "JDM" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                    JDM
                </Button>
                <Button 
                    variant={activeFilter === "European" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => handlefilter("European")}
                    className={activeFilter === "European" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                    European
                </Button>
                <Button 
                    variant={activeFilter === "American" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => handlefilter("American")}
                    className={activeFilter === "American" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                    American
                </Button>
                </div>
            </div>



                <TabsContent value="swipe" className="mt-6">
                <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-400 mb-4">{remainingCars} cars remaining to review</div>

                    <div className="w-full max-w-3xl">
                    {currentCar && (
                        <Card className="overflow-hidden bg-gray-900 border-gray-800 car-card-shadow swipe-card-large text-white">
                        <div className="relative h-[70vh] md:h-[80vh]">
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

                            {/* Top stats overlay */}
                            <div className="absolute top-4 left-4 flex gap-2 z-10">
                            <div className="flex items-center gap-1 bg-black/70 rounded-full px-3 py-1">
                                <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                                <span className="text-sm">{currentCar.upvotes || 0}</span>
                            </div>
                            {currentCar.viewCount && (
                                <div className="bg-black/70 rounded-full px-3 py-1">
                                <span className="text-sm">{currentCar.viewCount} views</span>
                                </div>
                            )}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-bold text-2xl mb-1">{currentCar.carName}</h3>
                                    <p className="text-gray-300 text-lg">{currentCar.carMake} {currentCar.carModel}</p>
                                    <p className="text-gray-400">By @{currentCar.userID}</p>
                                </div>
                                </div>

                                {/* Enhanced tags and info */}
                                <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-sm text-white border-white/30 bg-black/40">
                                    {currentCar.carMake}
                                </Badge>
                                {currentCar.carModel && (
                                    <Badge variant="outline" className="text-sm text-white border-white/30 bg-black/40">
                                    {currentCar.carModel}
                                    </Badge>
                                )}
                                {currentCar.region && (
                                    <Badge variant="outline" className="text-sm text-white border-white/30 bg-black/40">
                                    {currentCar.region}
                                    </Badge>
                                )}
                                {currentCar.carColor && (
                                    <Badge variant="outline" className="text-sm text-white border-white/30 bg-black/40">
                                    {currentCar.carColor}
                                    </Badge>
                                )}
                                {currentCar.category && (
                                    <Badge variant="outline" className="text-sm text-white border-white/30 bg-black/40">
                                    {currentCar.category}
                                    </Badge>
                                )}
                                {/* Show tags if they exist */}
                                {currentCar.tags && currentCar.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-sm text-white border-white/30 bg-black/40">
                                    {tag}
                                    </Badge>
                                ))}
                                </div>

                                {/* Cost and Mods info */}
                                {(currentCar.totalMods || currentCar.totalCost) && (
                                <div className="flex gap-4 text-sm">
                                    {currentCar.totalMods && (
                                    <div className="bg-black/40 rounded-lg px-3 py-2">
                                        <span className="text-gray-300">Mods: </span>
                                        <span className="text-white font-semibold">{currentCar.totalMods}</span>
                                    </div>
                                    )}
                                    {currentCar.totalCost && (
                                    <div className="bg-black/40 rounded-lg px-3 py-2">
                                        <span className="text-gray-300">Total Cost: </span>
                                        <span className="text-white font-semibold">${currentCar.totalCost.toLocaleString()}</span>
                                    </div>
                                    )}
                                </div>
                                )}

                                {/* Description */}
                                {currentCar.description && (
                                <div className="bg-black/40 rounded-lg p-3">
                                    <p className="text-sm text-gray-200 line-clamp-3">{currentCar.description}</p>
                                </div>
                                )}

                                {/* Created date */}
                                {currentCar.createdAt && (
                                <div className="text-xs text-gray-400">
                                    Posted: {new Date(currentCar.createdAt).toLocaleDateString()}
                                </div>
                                )}
                            </div>
                            </div>
                        </div>

                        <CardContent className="p-4">
                            <div className="flex justify-between gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 text-black hover:bg-gray-300 hover:text-black"
                                onClick={() => handlePass(currentCar.entryID?.toString() || "")}
                            >
                                <X className="h-5 w-5 mr-2 text-gray-500" />
                                Pass
                            </Button>
                           <Button
                            variant="outline"
                            size="lg"
                            className={`flex-1 text-black hover:bg-gray-300 hover:text-black ${!isAuthenticated ? 'opacity-60' : ''}`}
                            onClick={() => {
                                if (!isAuthenticated) {
                                window.location.href = '/auth';
                                return;
                                }
                                handleLike(currentCar.entryID?.toString() || "");
                            }}
                            title={!isAuthenticated ? "Login to like cars" : "Like this car"}
                            >
                            <Heart className="h-5 w-5 mr-2 text-red-500" fill="currentColor" />
                            {isAuthenticated ? 'Like' : 'Login to Like'}
                            </Button>
                            <Button 
                            variant="ghost" 
                            size="lg" 
                            className={`text-white hover:bg-gray-800 hover:text-white px-6 ${!isAuthenticated ? 'opacity-60' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleComment(currentCar.entryID?.toString() || "");
                            }}
                            title={!isAuthenticated ? "Login to comment" : "Comment on this car"}
                            >
                            <MessageCircle className="h-5 w-5 mr-2" />
                            {isAuthenticated ? 'Comment' : 'Login to Comment'}
                            </Button>
                            </div>
                        </CardContent>
                        </Card>
                    )}
                    </div>
                </div>
                </TabsContent>
            
            <TabsContent value="grid" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(filteredcars.length > 0 ? filteredcars : cars).map((car) => (
                <Link href={`/car/${car.entryID}`} key={car.entryID}>
                    <Card className="overflow-hidden bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200 hover:shadow-xl">
                    <div className="relative h-48 overflow-hidden">
                        <img 
                        src={car.s3ContentID 
                            ? getS3ImageUrl(car.s3ContentID)
                            : `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(car.carName)}`
                        } 
                        alt={car.carName} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute top-2 right-2">
                        <div className="flex items-center gap-1 bg-black/70 rounded-full px-2 py-1">
                            <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
                            <span className="text-xs text-white">{car.upvotes || 0}</span>
                        </div>
                        </div>
                    </div>
                    
                    <CardContent className="p-4">
                        <div className="space-y-3">
                        {/* Car Name and User */}
                        <div>
                            <h3 className="font-bold text-lg text-white truncate">{car.carName}</h3>
                            <p className="text-gray-400 text-sm">By @{car.userID}</p>
                        </div>

                        {/* Tags/Badges */}
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs text-white border-gray-600">
                            {car.carMake}
                            </Badge>
                            {car.carModel && (
                            <Badge variant="outline" className="text-xs text-white border-gray-600">
                                {car.carModel}
                            </Badge>
                            )}
                            {car.region && (
                            <Badge variant="outline" className="text-xs text-white border-gray-600">
                                {car.region}
                            </Badge>
                            )}
                            {car.carColor && (
                            <Badge variant="outline" className="text-xs text-white border-gray-600">
                                {car.carColor}
                            </Badge>
                            )}
                        </div>

                        {/* Stats */}
                        {(car.totalMods || car.totalCost || car.viewCount) && (
                            <div className="flex justify-between text-xs text-gray-400">
                            {car.totalMods && (
                                <span>{car.totalMods} mods</span>
                            )}
                            {car.totalCost && (
                                <span>${car.totalCost?.toLocaleString()}</span>
                            )}
                            {car.viewCount && (
                                <span>{car.viewCount} views</span>
                            )}
                            </div>
                        )}

                        {/* Description */}
                        {car.description && (
                            <p className="text-gray-300 text-sm line-clamp-2">{car.description}</p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-2">
                            <div className="flex gap-2">
                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-3 text-white hover:bg-gray-800 ${!isAuthenticated ? 'opacity-60' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleLike(car.entryID?.toString() || "");
                            }}
                            title={!isAuthenticated ? "Login to like cars" : "Like this car"}
                            >
                            <Heart className="h-4 w-4 mr-1" />
                            {isAuthenticated ? 'Like' : 'Login to Like'}
                            </Button>
                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-3 text-white hover:bg-gray-800 ${!isAuthenticated ? 'opacity-60' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleComment(car.entryID?.toString() || "");
                            }}
                            title={!isAuthenticated ? "Login to comment" : "Comment on this car"}
                            >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {isAuthenticated ? 'Comment' : 'Login to Comment'}
                            </Button>
                            </div>
                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-white hover:bg-gray-800"
                            onClick={(e) => {
                                e.preventDefault();
                                // Add share functionality here
                            }}
                            >
                            <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            
            {/* Empty State */}
            {filteredcars.length === 0 && cars.length === 0 && (
                <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No cars found</p>
                <Button onClick={fetchCars} className="mt-4">
                    Load Cars
                </Button>
                </div>
            )}
            
            {/* Filtered Empty State */}
            {filteredcars.length === 0 && cars.length > 0 && activeFilter && (
                <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No cars found for "{activeFilter}" filter</p>
                <Button 
                    onClick={() => {
                    setActiveFilter(null);
                    setFilteredCars(cars);
                    }} 
                    className="mt-4"
                >
                    Clear Filter
                </Button>
                </div>
            )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}