"use client"

import { useState, useEffect, useRef, useCallback} from "react"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Heart, MessageCircle, Share2, Filter, Search, X, Info, ExternalLink } from "lucide-react"
import { useCarState, useCarDispatch, CarActionTypes } from "../contexts/carlistcontext" 
import { getS3ImageUrl } from "../utils/s3helper"
import { useUser } from '../contexts/usercontext';
import SwipeablePhotoGallery from "../utils/swipe-photo-tool"
import { Textarea } from "../ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"


export default function ExplorePage() {
  const { user, isAuthenticated } = useUser();
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [swipedCars, setSwipedCars] = useState<string[]>([]);
  const [likedCars, setLikedCars] = useState<string[]>([]);
  const [filteredcars, setFilteredCars] = useState<typeof cars>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [errormessage, setErrorMessage] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
 
  const containerRef = useRef<HTMLDivElement>(null);

  
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
  if (!isAuthenticated) {
    // Redirect to auth page or show modal
    window.location.href = '/auth';
    return;
  }

  console.log(" likeCars called with carID:", carId)
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
    console.log(" likeCars API response data:", data);
    
    if (data.success) {
      setSwipedCars(prev => [...prev, carId])
      goToNextCar()
    } else {
        console.log(" likeCars failed:", data.message);
        setErrorMessage(data.message || "Failed to like car");
    }
  } catch (error) {
    console.error(" likeCars error:", error);
  }
};

const fetchComments = async (entryID: string, page = 1, limit = 20) => {
  try {
    const response = await fetch(`https://api.benchracershq.com/api/explore/getcomments/${entryID}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

const addComment = async (entryID: string, commentText: string, parentCommentID = null) => {
  try {
    const response = await fetch('https://api.benchracershq.com/api/explore/addcomments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        entryID,
        commentText,
        parentCommentID
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add comment');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

useEffect(() => {
    if (errormessage && errormessage.length > 0) {
        setTimeout(() => {
            setErrorMessage("");
        }, 8000);
    }
}, [errormessage]);


const handleComment = async (carId: string) => {
  if (!isAuthenticated) {
    window.location.href = '/auth';
    return;
  }
  
  setSelectedCarId(carId);
  setShowCommentModal(true);
  setIsLoadingComments(true);
  
  try {
    const commentsData = await fetchComments(carId);
    if (commentsData.success) {
      setComments(commentsData.data.comments);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  } finally {
    setIsLoadingComments(false);
  }
};

const handleSubmitComment = async () => {
  if (!commentText.trim() || !selectedCarId || isSubmittingComment) return;
  
  setIsSubmittingComment(true);
  
  try {
    const result = await addComment(selectedCarId, commentText.trim());
    if (result.success) {
      // Add new comment to the list
      setComments(prev => [result.data, ...prev]);
      setCommentText("");
      
      // Update the car's comment count in the local state
      const updatedCars = cars.map(car => 
        car.entryID?.toString() === selectedCarId 
          ? { ...car, commentCount: (car.commentCount || 0) + 1 }
          : car
      );
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_SUCCESS,
        payload: updatedCars
      });
    }
  } catch (error) {
    console.error('Error submitting comment:', error);
    alert('Failed to submit comment. Please try again.');
  } finally {
    setIsSubmittingComment(false);
  }
};

const CommentItem = ({ comment }: { comment: any }) => (
  <div className="border-b border-gray-700 pb-3 mb-3 last:border-b-0">
    <div className="flex justify-between items-start mb-2">
      <span className="font-semibold text-white">{comment.userName}</span>
      <span className="text-xs text-gray-400">
        {new Date(comment.createdAt).toLocaleDateString()}
      </span>
    </div>
    <p className="text-gray-300 text-sm">{comment.commentText}</p>
    {comment.replies && comment.replies.length > 0 && (
      <div className="ml-4 mt-3 space-y-2">
        {comment.replies.map((reply: any) => (
          <CommentItem key={reply.commentID} comment={reply} />
        ))}
      </div>
    )}
  </div>
);
  
const fetchCars = async () => {
    console.log(" fetchCars called");
    try {
      console.log(" About to dispatch FETCH_CARS_REQUEST");
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_REQUEST
      })
      
      console.log(" FETCH_CARS_REQUEST dispatched");
      
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
      
      console.log(" API response received:", response.status);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const apiResponse = await response.json();
      console.log(" API Response:", apiResponse);
      
      const newCars = apiResponse.data || apiResponse;
      console.log(" Extracted cars:", newCars);
      console.log(" Is newCars an array?", Array.isArray(newCars));
      console.log(" newCars length:", newCars.length);
      
      console.log(" About to dispatch FETCH_CARS_SUCCESS with payload:", newCars);
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_SUCCESS,
        payload: newCars
      });
      
      setFilteredCars(newCars);
      
      console.log(" FETCH_CARS_SUCCESS dispatched");
      
    } catch (error) {
      console.error(" Fetch cars error:", error);
      console.log(" About to dispatch FETCH_CARS_FAILURE");
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      console.log(" FETCH_CARS_FAILURE dispatched");
    }
  };

  const handlePass = (carId: string) => {
    setSwipedCars(prev => [...prev, carId])
    setErrorMessage("");
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

  const currentCar = cars[currentCarIndex]
  
  const SLIDES = [
  { id: 'photo', name: 'Photos' },
  { id: 'details', name: 'Details' },
  { id: 'mods', name: 'Modifications' }
];


  const goToSlide = useCallback((slideIndex: number) => {
    if (isAnimating || slideIndex === currentSlide || slideIndex < 0 || slideIndex >= SLIDES.length) return

    setIsAnimating(true)
    setCurrentSlide(slideIndex)
    
    if (containerRef.current) {
        containerRef.current.style.transform = `translateY(-${slideIndex * 100}vh)`
    }

    setTimeout(() => {
        setIsAnimating(false)
    }, 800)
  }, [currentSlide, isAnimating, SLIDES.length])

  const nextSlide = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1)
    }
  }, [currentSlide, goToSlide, SLIDES.length])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1)
    }
  }, [currentSlide, goToSlide])

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
                nextSlide()
            } else if (e.deltaY < 0 && currentSlide > 0) {
                prevSlide()
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
  }, [[currentSlide, isAnimating, nextSlide, prevSlide]])

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
                handleComment(currentCar.entryID?.toString() || "");
            }}
            >
            <MessageCircle className="h-6 w-6 mr-3" />
            {isAuthenticated ? `Comments (${comments.length})` : 'Login to Comment'}
            </Button>
        </div>
        </div>

        </section>

        {/* Section 2: Car Details */}
        <section className="h-screen bg-gray-950 flex items-center overflow-y-auto">
          <div className="container px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-950/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                    Build Details
                  </h2>
                  <p className="text-xl text-gray-300">
                    {currentCar.carMake} {currentCar.carModel}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Total Investment</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-400">
                    ${currentCar.totalCost.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-xl font-bold text-white">{currentCar.totalMods}</div>
                  <div className="text-sm text-gray-400">Modifications</div>
                </div>
                {currentCar.horsepower && (
                  <div className="text-center p-4 bg-orange-900/30 rounded-lg border border-orange-800/50">
                    <div className="text-xl font-bold text-orange-300">{currentCar.horsepower}</div>
                    <div className="text-sm text-orange-400">Horsepower</div>
                  </div>
                )}
                {currentCar.torque && (
                  <div className="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-800/50">
                    <div className="text-xl font-bold text-blue-300">{currentCar.torque}</div>
                    <div className="text-sm text-blue-400">Torque (lb-ft)</div>
                  </div>
                )}
                <div className="text-center p-4 bg-purple-900/30 rounded-lg border border-purple-800/50">
                  <div className="text-xl font-bold text-purple-300">{currentCar.upvotes}</div>
                  <div className="text-sm text-purple-400">Likes</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-3 flex-wrap mb-6">
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
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">About This Build</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">{currentCar.description}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Modifications & Actions */}
        <section className="h-screen bg-gray-900 flex items-center overflow-y-auto">
          <div className="container px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
            {currentCar.mods && currentCar.mods.length > 0 ? (
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 sm:p-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-orange-400">🔧</span>
                  Modifications ({currentCar.mods.length})
                </h3>
                
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 mb-8">
                  {currentCar.mods.map((mod, index) => (
                    <div 
                      key={mod.modID || index}
                      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:bg-gray-800/80 transition-all duration-200 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-lg group-hover:text-gray-200 transition-colors">
                            {mod.brand}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {mod.category}
                          </p>
                        </div>
                        <div className="flex flex-col items-end ml-4">
                          <span className="text-green-400 font-bold text-xl">
                            ${mod.cost?.toLocaleString() || '0'}
                          </span>
                          {mod.isCustom && (
                            <Badge variant="outline" className="text-xs px-2 py-0 text-yellow-300 border-yellow-400/50 bg-yellow-500/20 mt-1">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>

                      {(mod.type || mod.partNumber) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          {mod.type && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Type:</span>
                              <span className="text-gray-300">{mod.type}</span>
                            </div>
                          )}
                          {mod.partNumber && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Part #:</span>
                              <span className="text-gray-300 font-mono">{mod.partNumber}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {mod.description && (
                        <p className="text-gray-400 mb-3 leading-relaxed">
                          {mod.description}
                        </p>
                      )}

                      {mod.link && (
                        <a 
                          href={mod.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline transition-colors"
                        >
                          View Product
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Footer */}
                <div className="pt-6 border-t border-gray-700 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium text-xl">
                      Total Parts Investment:
                    </span>
                    <span className="text-green-400 font-bold text-2xl">
                      ${currentCar.mods.reduce((sum, mod) => sum + (mod.cost || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">No Modifications Listed</h3>
                <p className="text-gray-400">This build doesn't have any modifications listed yet.</p>
              </div>
            )}

            {/* Action Buttons */}
            
          </div>
        </section>
      </div>

      {errormessage && errormessage.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="bg-red-900 border-red-800">
            <div className="p-4 text-white">
              <p className="font-semibold">Error: {errormessage}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Comment Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Comments ({comments.length})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Comment form */}
            {isAuthenticated && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  rows={3}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    {commentText.length}/1000 characters
                  </span>
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmittingComment || commentText.length > 1000}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Comments list */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem key={comment.commentID} comment={comment} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );}