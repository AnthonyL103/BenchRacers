"use client"

import { useState, useEffect, useRef, useCallback} from "react"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card} from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Heart, MessageCircle, X, ExternalLink } from "lucide-react"
import { useCarState, useCarDispatch, CarActionTypes, Comment} from "../contexts/carlistcontext" 
import { getS3ImageUrl } from "../utils/s3helper"
import { useUser } from '../contexts/usercontext';
import SwipeablePhotoGallery from "../utils/swipe-photo-tool"
import Comments from "../utils/comments"

const SLIDES = [
  { id: 'photo', name: 'Photos' },
  { id: 'details', name: 'Details' },
  { id: 'comments', name: 'Comments' }
];


export default function ExplorePage() {
  const { user, isAuthenticated } = useUser();
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [swipedCars, setSwipedCars] = useState<string[]>([]);
  const [likedCars, setLikedCars] = useState<string[]>([]);

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const { cars, isLoading, error } = useCarState()
  const dispatch = useCarDispatch()
 
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCar = cars[currentCarIndex]

  useEffect(() => {
    if (cars.length === 0) {
      fetchCars()
    }
  }, [cars.length])
  
  
  const goToSlide = (slideIndex: number) => {
    if (isAnimating || slideIndex === currentSlide || slideIndex < 0 || slideIndex >= SLIDES.length) return

    setIsAnimating(true)
    setCurrentSlide(slideIndex)
    
    if (containerRef.current) {
        containerRef.current.style.transform = `translateY(-${slideIndex * 100}vh)`
    }

    setTimeout(() => {
        setIsAnimating(false)
    }, 800)
  }

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1)
    }
  }

  useEffect(() => {
    let startY = 0
    let lastWheelTime = 0
    let accumulatedDelta = 0
    const WHEEL_DELAY = 1000
    const DELTA_THRESHOLD = 100
    
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        
        const now = Date.now()
        
        if (now - lastWheelTime < WHEEL_DELAY || isAnimating) {
            return
        }
        
        accumulatedDelta += Math.abs(e.deltaY)
        
        if (Math.abs(e.deltaY) > 10 || accumulatedDelta > DELTA_THRESHOLD) {
            lastWheelTime = now
            accumulatedDelta = 0
            
            if (e.deltaY > 0 && currentSlide < SLIDES.length - 1) {
                setCurrentSlide(prev => {
                  const nextIndex = prev + 1;
                  if (nextIndex < SLIDES.length) {
                    setIsAnimating(true);
                    if (containerRef.current) {
                      containerRef.current.style.transform = `translateY(-${nextIndex * 100}vh)`;
                    }
                    setTimeout(() => setIsAnimating(false), 800);
                    return nextIndex;
                  }
                  return prev;
                });
            } else if (e.deltaY < 0 && currentSlide > 0) {
                setCurrentSlide(prev => {
                  const prevIndex = prev - 1;
                  if (prevIndex >= 0) {
                    setIsAnimating(true);
                    if (containerRef.current) {
                      containerRef.current.style.transform = `translateY(-${prevIndex * 100}vh)`;
                    }
                    setTimeout(() => setIsAnimating(false), 800);
                    return prevIndex;
                  }
                  return prev;
                });
            }
        }
    }

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating) return
      
      const currentY = e.touches[0].clientY
      const diff = startY - currentY
      
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSlide < SLIDES.length - 1) {
          nextSlide()
        } else if (diff < 0 && currentSlide > 0) {
          prevSlide()
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return
      
      switch(e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowUp':
          e.preventDefault()
          prevSlide()
          break
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSlide, isAnimating])
  

  const handleLike = async (carId: string) => {
  if (!isAuthenticated) {
    // Redirect to auth page or show modal
    window.location.href = '/auth';
    return;
  }

  try {
    const response = await fetch('https://api.benchracershq.com/api/explore/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ carId })
    });
    const data = await response.json();
    
    if (data.success) {
      setSwipedCars(prev => [...prev, carId])
      setLikedCars(prev => [...prev, carId])
      goToNextCar()
    } else {
        alert(data.message || "Failed to like car");
    }
  } catch (error) {
    console.error(" likeCars error:", error);
  }
};



const fetchCars = async () => {
    try {
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_REQUEST
      })
      
      
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
      
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const apiResponse = await response.json();
      
      const newCars = apiResponse.data || apiResponse;
      
    
      dispatch({
        type: CarActionTypes.FETCH_CARS_SUCCESS,
        payload: newCars
      });
            
      
    } catch (error) {
      console.error(" Fetch cars error:", error);
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
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
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  
  


  return (
    <div className="h-screen overflow-hidden relative bg-gray-950">
      <style>{`
        html, body {
          overflow: hidden;
          height: 100%;
        }
        
        .slide-container {
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
      `}</style>

      

      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black/20 z-50">
        <div 
          className="h-full bg-red-500 transition-all duration-800 ease-out"
          style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      

      <div 
        ref={containerRef}
        className="slide-container"
        style={{ height: `${SLIDES.length * 100}vh` }}
      >
        {/* Section 1: Photo Gallery */}
        <section className="h-screen relative bg-gray-950">
            <Navbar />
          <div className="absolute inset-0">
            <SwipeablePhotoGallery
              photos={currentCar.allPhotoKeys}
              carName={currentCar.carName || "Car"}
              getS3ImageUrl={getS3ImageUrl}
              hideControls={false}
              className="w-full h-full"
            />
          </div>
          
          {/* User info overlay - top left */}
          <div className="absolute top-4 left-4 flex flex-col gap-3 z-20">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg hover:bg-black/70 transition-all duration-200">
              <div className="relative group">
                <Avatar className="h-12 w-12 ring-2 ring-white/20 ring-offset-2 ring-offset-transparent transition-all duration-200 group-hover:ring-white/40 group-hover:scale-105">
                  <AvatarImage 
                    className="w-full h-full object-cover object-center" 
                    src={currentCar.profilephotokey 
                      ? getS3ImageUrl(currentCar.profilephotokey)
                      : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(user?.name || "User")}`
                    } 
                    alt={`${currentCar.userName}'s profile`}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {currentCar.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <p className="text-white/90 text-sm font-medium leading-tight drop-shadow-sm truncate">
                  By @{currentCar.userName}
                </p>
                <p className="text-white/60 text-xs leading-tight">
                  {currentCar.region}
                </p>
              </div>
            </div>
          </div>
          
          {/* Likes overlay - top right */}
          <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shadow-lg hover:bg-black/70 transition-all duration-200 hover:scale-105">
              <div className="relative">
                <Heart 
                  className="h-5 w-5 text-red-500 drop-shadow-sm transition-transform duration-200 hover:scale-110" 
                  fill="currentColor" 
                />
                <div className="absolute inset-0 h-5 w-5 text-red-500/30 blur-sm">
                  <Heart className="h-5 w-5" fill="currentColor" />
                </div>
              </div>
              <span className="text-sm font-medium text-white drop-shadow-sm">
                {currentCar.upvotes.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Car title overlay - bottom */}
          <div className="absolute mt-5 left-1/2 transform -translate-x-1/2 z-20">
            <div className="text-center bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 shadow-lg">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                {currentCar.carName}
              </h1>
              <p className="text-lg text-gray-300">
                {currentCar.carMake} {currentCar.carModel}
              </p>
            </div>
          </div>
          
          {/* Bottom Action Buttons */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col sm:flex-row gap-6">
            <Button
            size="lg"
            className="flex-1 text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg hover:scale-105 hover:from-gray-700 hover:to-gray-600 transition-transform"
            onClick={() => handlePass(currentCar.entryID?.toString() || "")}
            >
            <X className="h-6 w-6 mr-3 text-red-400" />
            Next Car
            </Button>

            <Button
            size="lg"
            className={`flex-1 text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:scale-105 hover:from-pink-600 hover:to-red-600 transition-transform ${
                !isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={() => {
                if (!isAuthenticated) {
                window.location.href = '/auth';
                return;
                }
                handleLike(currentCar.entryID?.toString() || "");
            }}
            >
            <Heart className="h-6 w-6 mr-3" />
            {isAuthenticated ? 'Like This Build' : 'Login to Like'}
            </Button>

            <Button 
            size="lg"
            variant="ghost"
            className={`flex-1 text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 hover:from-blue-600 hover:to-indigo-600 transition-transform ${
                !isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={(e) => {
                e.preventDefault();
                goToSlide(2);
            }}
            >
            <MessageCircle className="h-6 w-6 mr-3" />
            {isAuthenticated ? `Comments (${currentCar.commentCount})` : 'Login to Comment'}
            </Button>
        </div>
        </div>

        </section>

        <section className="h-screen bg-gray-950 p-8 overflow-hidden">
        <div className="h-full grid grid-cols-12 grid-rows-6 gap-6">
            
            {/* Build Title - Top Row */}
            <div className="col-span-12 row-span-1 flex justify-between items-center">
            <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Build Details
                </h2>
                <p className="text-2xl text-gray-300">
                {currentCar.carMake} {currentCar.carModel}
                </p>
            </div>
            <div className="text-right">
                <div className="text-lg text-gray-400 mb-1">Total Investment</div>
                <div className="text-4xl md:text-5xl font-bold text-green-400">
                ${currentCar.totalCost.toLocaleString()}
                </div>
            </div>
            </div>

            {/* Stats Row */}
            <div className="col-span-full row-span-1 grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-2xl font-bold text-white mb-1">{currentCar.totalMods}</div>
                <div className="text-sm text-gray-400">Modifications</div>
            </div>
            {currentCar.horsepower ? (
                <div className="text-center p-4 bg-orange-900/30 rounded-xl border border-orange-800/50">
                <div className="text-2xl font-bold text-orange-300 mb-1">{currentCar.horsepower}</div>
                <div className="text-sm text-orange-400">Horsepower</div>
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-800/20 rounded-xl border border-gray-700/50">
                <div className="text-2xl font-bold text-gray-500 mb-1">-</div>
                <div className="text-sm text-gray-500">Horsepower</div>
                </div>
            )}
            {currentCar.torque ? (
                <div className="text-center p-4 bg-blue-900/30 rounded-xl border border-blue-800/50">
                <div className="text-2xl font-bold text-blue-300 mb-1">{currentCar.torque}</div>
                <div className="text-sm text-blue-400">Torque (lb-ft)</div>
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-800/20 rounded-xl border border-gray-700/50">
                <div className="text-2xl font-bold text-gray-500 mb-1">-</div>
                <div className="text-sm text-gray-500">Torque</div>
                </div>
            )}
            <div className="text-center p-4 bg-purple-900/30 rounded-xl border border-purple-800/50">
                <div className="text-2xl font-bold text-purple-300 mb-1">{currentCar.upvotes}</div>
                <div className="text-sm text-purple-400">Likes</div>
            </div>
            </div>

            {/* Description and Tags */}
            <div className="col-span-full flex flex-col space-y-4">
            {/* Tags */}
            <div className="flex gap-3 flex-wrap">
                <Badge variant="outline" className="text-white border-white/30 bg-white/10 px-4 py-2">
                {currentCar.carMake}
                </Badge>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10 px-4 py-2">
                {currentCar.region}
                </Badge>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10 px-4 py-2">
                {currentCar.category}
                </Badge>
            </div>

            {/* Description */}
            {currentCar.description && (
                <div className="flex-1 overflow-y-auto">
                <h3 className="text-xl font-semibold text-white mb-3">About This Build</h3>
                <p className="text-gray-300 leading-relaxed text-base pr-4">{currentCar.description}</p>
                </div>
            )}
            </div>

            {/* Modifications Section */}
            <div className="col-span-full row-span-12 bg-gray-900/50 rounded-xl p-6 flex flex-col">
            {currentCar.mods && currentCar.mods.length > 0 ? (
                <>
                <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-orange-400">🔧</span>
                    Modifications ({currentCar.mods.length})
                    </h3>
                </div>
                
                {/* Scrollable Modifications List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {currentCar.mods.map((mod, index) => (
                    <div 
                        key={mod.modID || index}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/80 transition-all duration-200"
                    >
                        <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold text-base mb-1">
                            {mod.brand}
                            </h4>
                            <p className="text-gray-400 text-sm">
                            {mod.category}
                            </p>
                        </div>
                        <div className="text-right ml-4">
                            <span className="text-green-400 font-bold text-lg">
                            ${mod.cost?.toLocaleString() || '0'}
                            </span>
                            {mod.isCustom && (
                            <Badge variant="outline" className="text-xs px-2 py-0 text-yellow-300 border-yellow-400/50 bg-yellow-500/20 mt-1 ml-2">
                                Custom
                            </Badge>
                            )}
                        </div>
                        </div>

                        <div className="space-y-1 text-sm">
                        {mod.type && (
                            <div className="flex gap-2">
                            <span className="text-gray-500">Type:</span>
                            <span className="text-gray-300">{mod.type}</span>
                            </div>
                        )}
                        {mod.partNumber && (
                            <div className="flex gap-2">
                            <span className="text-gray-500">Part #:</span>
                            <span className="text-gray-300 font-mono">{mod.partNumber}</span>
                            </div>
                        )}
                        </div>

                        {mod.description && (
                        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                            {mod.description}
                        </p>
                        )}

                        {mod.link && (
                        <a 
                            href={mod.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline transition-colors text-sm mt-2"
                        >
                            View Product
                            <ExternalLink className="w-3 h-3" />
                        </a>
                        )}
                    </div>
                    ))}
                </div>

                {/* Total Footer */}
                <div className="pt-3 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">Total Parts:</span>
                    <span className="text-green-400 font-bold text-xl">
                        ${currentCar.mods.reduce((sum, mod) => sum + (mod.cost || 0), 0).toLocaleString()}
                    </span>
                    </div>
                </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">No Modifications Listed</h3>
                    <p className="text-gray-400">This build doesn't have any modifications listed yet.</p>
                </div>
                </div>
            )}
            </div>

            {/* Bottom Left Space for Additional Info if needed */}
            <div className="col-span-5 row-span-2 flex items-end">
            {/* This space can be used for additional build info or left empty for visual balance */}
            </div>

        </div>
        </section>

        {/* Section 4: Comments - Full Screen */}
        <section className="h-screen bg-gray-800 p-8 overflow-hidden">
        <Comments 
            entryID={currentCar.entryID?.toString() || ""} 
            className=""
        />
        </section>
      </div>

    </div>
  );}