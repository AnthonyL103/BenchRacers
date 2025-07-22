"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Heart, MessageCircle, Share2, Filter, Search, X, Info } from "lucide-react"
import { useCarState, useCarDispatch, CarActionTypes } from "../contexts/carlistcontext" 
import { getS3ImageUrl } from "../utils/s3helper"
import { set } from "date-fns"
import { useUser } from '../contexts/usercontext';
import { Textarea } from "../ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import SwipeablePhotoGallery from "../utils/swipe-photo-tool"
import { ChevronLeft, ChevronRight } from 'lucide-react';


export default function ExplorePage() {
  const { user, isAuthenticated } = useUser();
  const [activeTab, setActiveTab] = useState("swipe");
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
  const [hideGalleryControls, setHideGalleryControls] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
 
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;
  
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
    const data = await response.json();
    console.log("🚀 likeCars API response data:", data);
    
    if (data.success) {
      setSwipedCars(prev => [...prev, carId])
      goToNextCar()
    } else {
        console.log("🚀 likeCars failed:", data.message);
        setErrorMessage(data.message || "Failed to like car");
    }
  } catch (error) {
    console.error("🚀 likeCars error:", error);
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

const getCurrentPhotoUrl = () => {
    if (currentCar.allPhotoKeys.length === 0) {
      return `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(currentCar.carName)}`;
    }
    return getS3ImageUrl(currentCar.allPhotoKeys[currentIndex]);
  };

  const goToNext = () => {
    if (isTransitioning || currentCar.allPhotoKeys.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % currentCar.allPhotoKeys.length);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrevious = () => {
    if (isTransitioning || currentCar.allPhotoKeys.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + currentCar.allPhotoKeys.length) % currentCar.allPhotoKeys.length);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Mouse drag handlers for desktop
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const distance = dragStart - e.clientX;
    
    // Optional: Add visual feedback during drag
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const distance = dragStart - e.clientX;
    const isLeftDrag = distance > minSwipeDistance;
    const isRightDrag = distance < -minSwipeDistance;

    if (isLeftDrag) {
      goToNext();
    } else if (isRightDrag) {
      goToPrevious();
    }

    setIsDragging(false);
    setDragStart(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_SUCCESS,
        payload: newCars
      });
      
      setFilteredCars(cars);
      
      console.log("🚀 FETCH_CARS_SUCCESS dispatched");
      
    } catch (error) {
      console.error("🚀 Fetch cars error:", error);
      console.log("🚀 About to dispatch FETCH_CARS_FAILURE");
      
      dispatch({
        type: CarActionTypes.FETCH_CARS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      console.log("🚀 FETCH_CARS_FAILURE dispatched");
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
  const remainingCars = cars.length - swipedCars.length

  return (
  <div className="min-h-screen bg-gray-950">
    {/* Header */}
    <Navbar />
    <div className="border-b border-gray-800 bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold text-white">Explore Builds</h1>
      </div>
    </div>
    
    <div className="flex flex-col items-center h-full mt-5 mb-5">
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden bg-gray-900 border-gray-800 text-white">
          <div className="relative h-[75vh]">
            <div
              ref={containerRef}
              className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
              style={{ zIndex: 1 }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => {
                setIsDragging(false);
                setDragStart(null);
              }}
            >
              <img
                src={getCurrentPhotoUrl()}
                alt={`${currentCar.carName} - Photo ${currentIndex + 1} of ${currentCar.allPhotoKeys.length}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300  ease-in-out${
                  isTransitioning ? 'opacity-80' : 'opacity-100'
                }`}
                draggable={false}
                style={{ zIndex: 1 }}
              />
            </div>
        
            {/* Navigation Arrows - Only show if more than 1 photo and not hidden */}
            {currentCar.allPhotoKeys.length > 1 && !hideGalleryControls && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={isTransitioning}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
                  style={{ zIndex: 5 }}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                  onClick={goToNext}
                  disabled={isTransitioning}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
                  style={{ zIndex: 5 }}
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* User info overlay - top left */}
            <div className="absolute top-4 left-4 flex flex-col gap-3 z-[100] animate-in fade-in-0 slide-in-from-left-2 duration-300" style={{ zIndex: 5 }}>
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-lg hover:bg-black/70 transition-all duration-200">
                {/* Avatar with ring and hover effect */}
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

                {/* User info text */}
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
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-[100] animate-in fade-in-0 slide-in-from-right-2 duration-300" style={{ zIndex: 5 }}>
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shadow-lg hover:bg-black/70 transition-all duration-200 hover:scale-105">
                <div className="relative">
                  <Heart 
                    className="h-5 w-5 text-red-500 drop-shadow-sm transition-transform duration-200 hover:scale-110" 
                    fill="currentColor" 
                  />
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 h-5 w-5 text-red-500/30 blur-sm">
                    <Heart className="h-5 w-5" fill="currentColor" />
                  </div>
                </div>
                <span className="text-sm font-medium text-white drop-shadow-sm">
                  {currentCar.upvotes.toLocaleString()}
                </span>
              </div>
            </div>

            {showUserInfo ? (
            <div 
                className="absolute bottom-4 left-4 pointer-events-none" 
                style={{ zIndex: 5 }}
            >
                {/* Compact content container with its own background - only as wide as needed */}
                <div 
                className="relative p-3 pointer-events-auto inline-block bg-gradient-to-t from-black/60 via-black/40 to-black/50 backdrop-blur-sm rounded-tr-xl border-t border-r border-white/20"
                onMouseEnter={() => setHideGalleryControls(true)}
                onMouseLeave={() => setHideGalleryControls(false)}
                >
                <button
                    onClick={() => setShowUserInfo(false)}
                    className="absolute -top-1 -right-1 bg-black/80 hover:bg-black/90 text-white rounded-full p-1 transition-all duration-200 hover:scale-105"
                    aria-label="Close info"
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="mb-2">
                    <h3 className="font-bold text-xl text-white mb-0.5 drop-shadow-lg">
                    {currentCar.carName}
                    </h3>
                    <p className="text-gray-200 text-sm font-medium drop-shadow-md">
                    {currentCar.carMake} {currentCar.carModel}
                    </p>
                </div>

                {/* Compact stats inline */}
                <div className="flex gap-2 text-xs mb-2">
                    <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 hover:bg-black/80 transition-all duration-200">
                    <span className="text-gray-300">Mods: </span>
                    <span className="text-white font-bold">{currentCar.totalMods}</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 hover:bg-black/80 transition-all duration-200">
                    <span className="text-gray-300">Cost: </span>
                    <span className="text-white font-bold">${currentCar.totalCost.toLocaleString()}</span>
                    </div>
                </div>

                {/* Small badges inline */}
                <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-white border-white/30 bg-white/10 backdrop-blur-sm">
                    {currentCar.carMake}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-white border-white/30 bg-white/10 backdrop-blur-sm">
                    {currentCar.region}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-white border-white/30 bg-white/10 backdrop-blur-sm">
                    {currentCar.category}
                    </Badge>
                </div>
                 <div className="flex gap-2 mt-3">
                    {currentCar.horsepower && (
                        <Badge variant="outline" className="text-xs px-2 py-1 text-orange-300 border-orange-400/30 bg-orange-500/10 backdrop-blur-sm">
                            ⚡ {currentCar.horsepower} HP
                        </Badge>
                    )}
                    {currentCar.torque && (
                        <Badge variant="outline" className="text-xs px-2 py-1 text-blue-300 border-blue-400/30 bg-blue-500/10 backdrop-blur-sm">
                            🔧 {currentCar.torque} lb-ft
                        </Badge>
                    )}
                </div>
                <div className="mt-2 text-gray-300 text-sm whitespace-pre-line max-w-xs">
                    <p className="break-words leading-relaxed">{currentCar.description}</p>
                </div>
                </div>
            </div>
            ) : (
            <button 
                onClick={() => setShowUserInfo(true)} 
                className="absolute bottom-4 left-4 p-3 pointer-events-auto inline-block bg-gradient-to-t from-black/60 via-black/40 to-black/50 backdrop-blur-sm rounded-tr-xl border-t border-r border-white/20 text-white hover:bg-black/70 transition-all duration-200"
                style={{ zIndex: 5 }}
            > 
                Show Info 
            </button>
            )}
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
                Next
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
                <Heart className="h-5 w-5 mr-2" />
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
                title={!isAuthenticated 
                  ? "Login to comment" 
                  : `Comment on this car - ${comments.length || 0} comments`
                }
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                {isAuthenticated ? `Comments (${comments.length})` : 'Login to Comment'}
              </Button>
            </div>
          </CardContent>
          
          {errormessage && errormessage.length > 0 && (
            <Card className="mt-4 bg-red-900 border-red-800">
              <div className="p-4 text-white">
                <p className="font-semibold">Error: {errormessage}</p>
              </div>
            </Card> 
          )}
        </Card>
      </div>
    </div>

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