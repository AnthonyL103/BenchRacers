"use client"

import { useState, useEffect, useRef} from "react"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card} from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Heart, MessageCircle, X, ArrowUp, ExternalLink } from "lucide-react"
import { useCarState, useCarDispatch, CarActionTypes} from "../contexts/carlistcontext" 
import { getS3ImageUrl } from "../utils/s3helper"
import { useUser } from '../contexts/usercontext';
import SwipeablePhotoGallery from "../utils/swipe-photo-tool"
import Comments from "../utils/comments"
import TireLoadingAnimation from "../utils/tire-spinner"


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
  const [isMobile, setIsMobile] = useState(false)
  
  const { cars, isLoading, error } = useCarState()
  const dispatch = useCarDispatch()
 
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCar = cars[currentCarIndex]

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      const target = e.target as HTMLElement
      const scrollableContainer = target.closest('[class*="overflow-y-auto"]')
      
      if (scrollableContainer) {
        const canScrollUp = scrollableContainer.scrollTop > 0
        const canScrollDown = scrollableContainer.scrollTop < (scrollableContainer.scrollHeight - scrollableContainer.clientHeight)
        
        if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
          return
        }
      }
      
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
      const target = e.target as HTMLElement
      const scrollableContainer = target.closest('[class*="overflow-y-auto"]')
      
      if (scrollableContainer) {
        return
      }
      
      startY = e.touches[0].clientY
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating) return
      
      const target = e.target as HTMLElement
      const scrollableContainer = target.closest('[class*="overflow-y-auto"]')
      
      if (scrollableContainer) {
        return
      }
      
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
      
      const activeElement = document.activeElement as HTMLElement
      const scrollableContainer = activeElement?.closest('[class*="overflow-y-auto"]')
      const isInputFocused = activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT'
      
      if (scrollableContainer || isInputFocused) {
        return
      }
      
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
        if (data.hasUpvoted) {
          dispatch({
            type: CarActionTypes.UPVOTE_CAR,
            payload: carId
          });
          setLikedCars(prev => [...prev, carId])
        } else {
          dispatch({
            type: CarActionTypes.UNUPVOTE_CAR,
            payload: carId
          });
          setLikedCars(prev => prev.filter(id => id !== carId))
        }
        console.log("data", data)
        console.log("just liked/unliked", cars)
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
            'authorization': `Bearer ${localStorage.getItem('token') || ''}`
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
      <div className="flex flex-col bg-gray-950 min-h-screen">
        <Navbar />
        <div className="flex justify-center items-start">
            <TireLoadingAnimation />
        </div>
      </div>
    )
  }
  
  if (error && cars.length === 0) {
  return (
    <div className="flex flex-col bg-gray-950 min-h-screen">
      <Navbar />
      <main className="flex-1 flex justify-center items-center px-4">
        <div className="text-center">
          <div className="mb-4 text-white text-lg">
            Error loading cars: {error}
          </div>
          <Button onClick={fetchCars} className="bg-primary hover:bg-red-700 text-white px-4 py-2">
            Retry
          </Button>
        </div>
      </main>
    </div>
  )
}

if (cars.length === 0 && !isLoading) {
  return (
    <div className="flex flex-col bg-gray-950 min-h-screen">
      <Navbar />
      <main className="flex-1 flex justify-center items-center px-4">
        <div className="text-center">
          <div className="mb-4 text-white text-lg">No cars found.</div>
          <Button onClick={fetchCars} className="bg-primary hover:bg-red-700 text-white px-4 py-2">
            Refresh
          </Button>
        </div>
      </main>
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
        
        /* Custom scrollbar for mobile */
        .mobile-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        
        .mobile-scrollbar::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.3);
        }
        
        .mobile-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.6);
          border-radius: 1px;
        }
      `}</style>

      {/* Progress bar - Mobile responsive */}
      <div className={`fixed top-0 left-0 w-full bg-black/20 z-50 ${isMobile ? 'h-1' : 'h-1 md:h-1.5'}`}>
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
        {/* Section 1: Photo Gallery - Mobile Optimized */}
        <section className="h-screen relative bg-gray-950">
          <Navbar />
          <div className="absolute inset-0">
            <SwipeablePhotoGallery
              photos={currentCar.allPhotoKeys}
              carName={currentCar.carName || "Car"}
              userPhoto={currentCar.profilephotokey}
              username={currentCar.userName}
              region={currentCar.region}
              getS3ImageUrl={getS3ImageUrl}
              hideControls={false}
              className="w-full h-full"
            />
          </div>

          {/* Car title overlay - Mobile responsive */}
          <div className={`absolute z-20 ${isMobile ? 'top-16 left-2 right-2' : 'mt-5 left-5'}`}>
            <div className={`bg-gradient-to-br from-black/80 via-black/70 to-black/60 border border-white/20 shadow-2xl shadow-black/50 hover:shadow-3xl hover:shadow-purple-500/20 transition-all duration-500 group ${isMobile ? 'rounded-2xl px-4 py-4' : 'rounded-2xl md:rounded-3xl px-8 py-6'}`}>
              
              {/* Animated gradient border */}
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm ${isMobile ? 'rounded-2xl' : 'rounded-2xl md:rounded-3xl'}`}></div>
              
              {/* Main content */}
              <div className="relative z-10">
                {/* Car name with gradient text */}
                <h1 className={`font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent tracking-tight drop-shadow-2xl ${isMobile ? 'text-2xl mb-2' : 'text-3xl sm:text-2xl md:text-3xl mb-3'}`}>
                  {currentCar.carName}
                </h1>
                
                {/* Car make/model with subtle glow */}
                <p className={`text-gray-200/90 font-medium tracking-wide drop-shadow-lg ${isMobile ? 'text-xl mb-3' : 'text-2xl mb-4'}`}>
                  {currentCar.carMake} {currentCar.carModel}
                </p>
                
                {/* User info section with enhanced layout */}
                <div className={`flex pt-2 ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
                  <Avatar className={`ring-2 ring-gradient-to-r ring-white/30 ring-offset-2 ring-offset-black/20 transition-all duration-300 group-hover:ring-blue-400/60 group-hover:ring-4 group-hover:scale-110 shadow-xl ${isMobile ? 'h-10 w-10' : 'h-14 w-14'}`}>
                    <AvatarImage 
                      className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-110" 
                      src={currentCar.profilephotokey 
                        ? getS3ImageUrl(currentCar.profilephotokey)
                        : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(user?.name || "User")}`
                      } 
                      alt={`${currentCar.userName}'s profile`}
                    />
                    <AvatarFallback className={`bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-inner ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                      {currentCar.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col justify-center min-w-0">
                    <p className={`text-white font-bold leading-tight drop-shadow-lg truncate bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                      By @{currentCar.userName}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                      <p className={`text-white/70 leading-tight font-medium ${isMobile ? 'text-lg' : 'text-lg'}`}>
                        {currentCar.region}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subtle animated particles effect */}
              <div className={`absolute inset-0 overflow-hidden pointer-events-none ${isMobile ? 'rounded-2xl' : 'rounded-2xl md:rounded-3xl'}`}>
                <div className="absolute top-2 left-4 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
                <div className="absolute bottom-3 right-6 w-1 h-1 bg-blue-400/40 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 right-3 w-0.5 h-0.5 bg-purple-400/50 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
              </div>
            </div>
          </div>
          
          {/* Bottom Action Buttons - Mobile responsive */}
          <div className={`absolute z-20 left-1/2 transform -translate-x-1/2 ${isMobile ? 'bottom-4 px-2' : 'bottom-10'}`}>
            <div className={`flex gap-3 ${isMobile ? 'flex-col w-full max-w-sm' : 'flex-col sm:flex-row gap-6'}`}>
              <Button
                size={isMobile ? "default" : "lg"}
                className={`flex-1 bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg hover:scale-105 hover:from-gray-700 hover:to-gray-600 transition-transform ${isMobile ? 'rounded-xl text-sm px-6 py-3' : 'rounded-xl md:rounded-2xl text-lg px-10 py-6'}`}
                onClick={() => handlePass(currentCar.entryID?.toString() || "")}
              >
                <X className={`text-red-400 ${isMobile ? 'h-4 w-4 mr-2' : 'h-6 w-6 mr-3'}`} />
                Next Car
              </Button>

              <Button
                size={isMobile ? "default" : "lg"}
                className={`flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:scale-105 hover:from-pink-600 hover:to-red-600 transition-transform ${
                  !isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''
                } ${isMobile ? 'rounded-xl text-sm px-6 py-3' : 'rounded-xl md:rounded-2xl text-lg px-10 py-6'}`}
                disabled={!isAuthenticated}
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = '/auth';
                    return;
                  }
                  handleLike(currentCar.entryID?.toString() || "");
                }}
              >
                <Heart className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-6 h-6 mr-3'} ${currentCar.hasUpvoted ? 'fill-current' : ''}`} />
                <span>
                  {isAuthenticated ? (isMobile ? 'Upvote' : 'Upvote This Build') : (isMobile ? 'Login' : 'Login To Upvote')}
                </span>
                {currentCar.upvotes > 0 && <span className={isMobile ? 'text-xs ml-1' : 'ml-2'}>({currentCar.upvotes})</span>}
                {currentCar.hasUpvoted && <span className={`bg-white/20 px-2 py-1 rounded-full ${isMobile ? 'text-xs ml-1' : 'ml-2 text-sm'}`}>Liked</span>}
              </Button>

              <Button 
                size={isMobile ? "default" : "lg"}
                variant="ghost"
                className={`flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 hover:from-blue-600 hover:to-indigo-600 transition-transform ${
                  !isAuthenticated ? 'opacity-60 cursor-not-allowed' : ''
                } ${isMobile ? 'rounded-xl text-sm px-6 py-3' : 'rounded-xl md:rounded-2xl text-lg px-10 py-6'}`}
                onClick={(e) => {
                  e.preventDefault();
                  goToSlide(2);
                }}
              >
                <MessageCircle className={isMobile ? 'h-4 w-4 mr-2' : 'h-6 w-6 mr-3'} />
                <span>
                  {isAuthenticated ? `Comments (${currentCar.commentCount})` : (isMobile ? 'Login' : 'Login to Comment')}
                </span>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: Build Details - Mobile Optimized */}
        <section className={`h-screen bg-gray-950 overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
          <div className={`h-full flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
            
            {/* Build Title - Mobile responsive */}
            <div className={`flex justify-between items-start flex-shrink-0 ${isMobile ? 'flex-col gap-3' : 'flex-row items-center'}`}>
              <div>
                <h2 className={`font-bold text-white mb-2 ${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
                  Build Details
                </h2>
                <p className={`text-gray-300 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                  {currentCar.carMake} {currentCar.carModel}
                </p>
              </div>
              
                {/* 
                <div className={`${isMobile ? 'self-start' : 'text-right'}`}>
                <div className={`text-gray-400 mb-1 ${isMobile ? 'text-sm' : 'text-lg'}`}>Total Investment</div>
                <div className={`font-bold text-green-400 ${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
                  ${currentCar.totalCost.toLocaleString()}
                </div>
              </div>*/}
                
            </div>

            {/* Stats Row - Mobile responsive grid */}
            <div className={`grid gap-2 md:gap-4 flex-shrink-0 ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
              <div className={`text-center bg-gray-800/50 rounded-xl border border-gray-700 ${isMobile ? 'p-3' : 'p-4'}`}>
                <div className={`font-bold text-white mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{currentCar.totalMods}</div>
                <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Modifications</div>
              </div>
              {/*{currentCar.horsepower ? (
                <div className={`text-center bg-orange-900/30 rounded-xl border border-orange-800/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className={`font-bold text-orange-300 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{currentCar.horsepower}</div>
                  <div className={`text-orange-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Horsepower</div>
                </div>
              ) : (
                <div className={`text-center bg-gray-800/20 rounded-xl border border-gray-700/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className={`font-bold text-gray-500 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>-</div>
                  <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Horsepower</div>
                </div>
              )}*/}
              
              
              {/* Torque and Likes - Always show but adjust layout */}
              {/* {currentCar.torque ? (
                <div className={`text-center bg-blue-900/30 rounded-xl border border-blue-800/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className={`font-bold text-blue-300 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{currentCar.torque}</div>
                  <div className={`text-blue-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>{isMobile ? 'Torque' : 'Torque (lb-ft)'}</div>
                </div>
              ) : (
                <div className={`text-center bg-gray-800/20 rounded-xl border border-gray-700/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <div className={`font-bold text-gray-500 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>-</div>
                  <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Torque</div>
                </div>
              )}*/}
              
              
              <div className={`text-center bg-purple-900/30 rounded-xl border border-purple-800/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                <div className={`font-bold text-purple-300 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{currentCar.upvotes}</div>
                <div className={`text-purple-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Likes</div>
              </div>
            </div>

            {/* Description and Tags - Mobile responsive */}
            <div className={`flex flex-col flex-shrink-0 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              {/* Tags */}
              <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <Badge variant="outline" className={`text-white border-white/30 bg-white/10 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}>
                  {currentCar.carMake}
                </Badge>
                <Badge variant="outline" className={`text-white border-white/30 bg-white/10 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}>
                  {currentCar.region}
                </Badge>
                <Badge variant="outline" className={`text-white border-white/30 bg-white/10 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}>
                  {currentCar.category}
                </Badge>
              </div>

              {/* Description */}
              {currentCar.description && (
                <div>
                  <h3 className={`font-semibold text-white mb-3 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>About This Build</h3>
                  <p className={`text-gray-300 leading-relaxed ${isMobile ? 'text-xl' : 'text-2xl'}`}>Description: {currentCar.description}</p>
                </div>
              )}
            </div>

            {/* Modifications Section - Mobile optimized scrolling */}
            <div className="flex flex-col flex-1 min-h-0">
              {currentCar.mods && currentCar.mods.length > 0 ? (
                <>
                  <div className={`flex-shrink-0 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                    <h3 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                      <span className="text-orange-400">🔧</span>
                      Modifications ({currentCar.mods.length})
                    </h3>
                  </div>
                  
                  {/* Scrollable Modifications List - Mobile optimized */}
                  <div className={`flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 ${isMobile ? 'mobile-scrollbar pr-1' : 'pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'}`}>
                    {currentCar.mods.map((mod, index) => (
                      <div 
                        key={mod.modID || index}
                        className={`bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/80 transition-all duration-200 ${isMobile ? 'p-3' : 'p-4'}`}
                      >
                        <div className={`flex justify-between items-start mb-2 ${isMobile ? 'flex-col gap-2' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-white font-semibold mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                              {mod.brand}
                            </h4>
                            <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {mod.category}
                            </p>
                          </div>
                          <div className={`${isMobile ? 'flex items-center gap-2 self-start' : 'text-right ml-4'}`}>
                            <span className={`text-green-400 font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                              ${mod.cost?.toLocaleString() || '0'}
                            </span>
                            {mod.isCustom && (
                              <Badge variant="outline" className={`text-yellow-300 border-yellow-400/50 bg-yellow-500/20 ${isMobile ? 'text-xs px-2 py-0' : 'text-xs px-2 py-0 mt-1 ml-2'}`}>
                                Custom
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {mod.type && (
                            <div className="flex gap-2">
                              <span className="text-gray-500">Type:</span>
                              <span className="text-gray-300">{mod.type}</span>
                            </div>
                          )}
                          {mod.partNumber && (
                            <div className="flex gap-2">
                              <span className="text-gray-500">Part #:</span>
                              <span className="text-gray-300 font-mono break-all">{mod.partNumber}</span>
                            </div>
                          )}
                        </div>

                        {mod.description && (
                          <p className={`text-gray-400 mt-2 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {mod.description}
                          </p>
                        )}

                        {mod.link && (
                          <a 
                            href={mod.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline transition-colors mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}
                          >
                            View Product
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total Footer - Mobile responsive */}
                  <div className={`border-t border-gray-700 flex-shrink-0 ${isMobile ? 'pt-2' : 'pt-3'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-gray-300 font-medium ${isMobile ? 'text-sm' : ''}`}>Total Parts:</span>
                      <span className={`text-green-400 font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                        ${currentCar.mods.reduce((sum, mod) => sum + (mod.cost || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className={`font-bold text-white mb-3 ${isMobile ? 'text-xl' : 'text-2xl'}`}>No Modifications Listed</h3>
                    <p className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>This build doesn't have any modifications listed yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Comments - Mobile Optimized */}
        <section className={`h-screen bg-gray-950 overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
          <div className={`h-full flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
            {/* Comments Component - Mobile responsive */}
            <div className="flex-1 min-h-0">
              <Comments 
                entryID={currentCar.entryID?.toString() || ""} 
                className="h-full"
              />
            </div>
            
            {/* Back to Top Button - Mobile responsive */}
            <div className="flex justify-center flex-shrink-0 pb-4">
              <Button size="lg" variant="outline" onClick={goToSlide.bind(null, 0) }className="w-full text-black sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:bg-white/80">
                  Back to Top
                  <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}