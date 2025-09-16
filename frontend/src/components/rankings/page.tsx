import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { ArrowUp, Heart, Trophy, Loader2, Crown, Medal, Award, TrendingUp, Star, X, ExternalLink, MessageCircle, Eye } from "lucide-react"
import { getS3ImageUrl } from "../utils/s3helper"
import TireLoadingAnimation from "../utils/tire-spinner"
import SwipeablePhotoGallery from "../utils/swipe-photo-tool"
import Comments from "../utils/comments"
import { useUser } from '../contexts/usercontext'

import axios from 'axios';

export interface Mod {
  id?: number;
  modID?: number;
  brand: string;
  cost?: number;
  description: string;
  category: string;
  link: string;
  type?: string;
  partNumber?: string;
  isCustom: boolean;
}
interface RankingsCar {
      entryID: number;
      userEmail: string;
      carName: string;
      carMake: string;
      carModel: string;
      carYear?: string;
      carColor?: string;
      basecost?: string; 
      carTrim?: string; 
      description?: string;
      totalMods: number;
      totalCost: number;
      category: string;
      region: string;
      upvotes: number;
      engine?: string;
      transmission?: string;
      drivetrain?: string;
      horsepower?: number;
      torque?: number;
      viewCount: number;
      createdAt: string;
      updatedAt: string;
      profilePhotoKey: string;
      userName: string;
      
  
      tags: string[];              
      mods: Mod[];                 
      
      mainPhotoKey?: string;       
      allPhotoKeys: string[];     
      photos?: { s3Key: string; isMainPhoto: boolean }[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: RankingsCar[];
  count: number;
}

const MODAL_SLIDES = [
  { id: 'photo', name: 'Photos' },
  { id: 'details', name: 'Details' },
  { id: 'comments', name: 'Comments' }
];

export default function RankingsPage() {
  const { user, isAuthenticated } = useUser();
  const [topCars, setTopCars] = useState<RankingsCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedCar, setSelectedCar] = useState<RankingsCar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

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
    fetchTopCars();
  }, []);

  const fetchTopCars = async () => {
    try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await axios.get('https://api.benchracershq.com/api/rankings/top10', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        });

        const { success, data, message } = response.data;
        
        console.log('Rankings API response:', response.data);
        

        if (!success) {
        throw new Error(message || 'Failed to fetch rankings');
        }

        setTopCars(data);
    } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('Failed to load rankings. Please try again.');
    } finally {
        setLoading(false);
    }
    };

  const openModal = (car: RankingsCar) => {
    setSelectedCar(car);
    setIsModalOpen(true);
    setCurrentSlide(0);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
    setCurrentSlide(0);
    document.body.style.overflow = 'unset';
  };

  const goToSlide = (slideIndex: number) => {
    if (isAnimating || slideIndex === currentSlide || slideIndex < 0 || slideIndex >= MODAL_SLIDES.length) return

    setIsAnimating(true)
    setCurrentSlide(slideIndex)
    
    if (containerRef.current) {
        containerRef.current.style.transform = `translateY(-${slideIndex * 100}vh)`
    }

    setTimeout(() => {
        setIsAnimating(false)
    }, 800)
  }

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
        // Update the car in topCars array
        setTopCars(prev => prev.map(car => 
          car.entryID.toString() === carId 
            ? { ...car, upvotes: data.hasUpvoted ? car.upvotes + 1 : car.upvotes - 1 }
            : car
        ));

        // Update selected car if it's open in modal
        if (selectedCar && selectedCar.entryID.toString() === carId) {
          setSelectedCar(prev => prev ? {
            ...prev,
            upvotes: data.hasUpvoted ? prev.upvotes + 1 : prev.upvotes - 1
          } : null);
        }
      } else {
        alert(data.message || "Failed to like car");
      }
    } catch (error) {
      console.error("Like cars error:", error);
    }
  };

  // Modal navigation with keyboard/scroll (similar to explore)
  useEffect(() => {
    if (!isModalOpen) return;

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
          
          if (e.deltaY > 0 && currentSlide < MODAL_SLIDES.length - 1) {
              goToSlide(currentSlide + 1)
          } else if (e.deltaY < 0 && currentSlide > 0) {
              goToSlide(currentSlide - 1)
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
        case 'Escape':
          closeModal()
          break
        case 'ArrowDown':
        case ' ':
          e.preventDefault()
          if (currentSlide < MODAL_SLIDES.length - 1) {
            goToSlide(currentSlide + 1)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (currentSlide > 0) {
            goToSlide(currentSlide - 1)
          }
          break
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen, currentSlide, isAnimating])

  if (loading) {
    return (
       <div className="flex flex-col bg-gray-950 min-h-screen">
              <Navbar />
              <div className="flex justify-center items-start">
                  <TireLoadingAnimation />
              </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Rankings
            </h1>
          </div>
        </div>
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-red-400 mb-4">{error}</p>
                <button 
                  onClick={fetchTopCars}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const top3 = topCars.slice(0, 3);
  const leaderboard = topCars.slice(3, 10);

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600 fill-amber-600" />;
      default: return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch(rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-black";
      case 3: return "bg-gradient-to-r from-amber-500 to-amber-700 text-black";
      default: return "bg-gray-700 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      {/* Header Section */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Rankings
              </h1>
              <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Discover the most loved car builds in the community
            </p>
            
            {/* Stats Bar */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
                <span className="text-yellow-500 font-bold text-lg">{topCars.length}</span>
                <span className="text-gray-400 text-sm ml-1">Ranked Cars</span>
              </div>
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
                <span className="text-red-500 font-bold text-lg">
                  {topCars.reduce((sum, car) => sum + car.upvotes, 0).toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm ml-1">Total Votes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="py-8">
        <div className="container mx-auto px-4">
          
          {/* Podium Section */}
          {top3.length >= 3 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
                Top 3 Champions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* 2nd Place */}
                <div className="order-2 md:order-1">
                  <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden group cursor-pointer"
                        onClick={() => openModal(top3[1])}>
                    <div className="relative h-72">
                      <img
                        src={top3[1]?.mainPhotoKey 
                          ? getS3ImageUrl(top3[1]?.mainPhotoKey) 
                          : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(top3[1]?.carName)}`
                        }
                        alt={top3[1]?.carName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                      
                      {/* View Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30">
                          <Eye className="h-5 w-5 mr-2" />
                          View Details
                        </Button>
                      </div>
                      
                      {/* Rank Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getRankBadgeColor(2)} font-bold text-lg px-4 py-2 shadow-lg`}>
                          <Medal className="h-5 w-5 mr-2" />
                          2nd Place
                        </Badge>
                      </div>
                      
                      {/* User Info */}
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white/30">
                            <AvatarImage 
                              src={top3[1]?.profilePhotoKey ? getS3ImageUrl(top3[1]?.profilePhotoKey) : undefined}
                              alt={`${top3[1]?.userName}'s profile`}
                            />
                            <AvatarFallback className="bg-gray-600 text-white text-sm">
                              {top3[1]?.userName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm font-medium">@{top3[1]?.userName}</span>
                        </div>
                      </div>
                      
                      {/* Vote Count */}
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                          <Heart className="h-5 w-5 text-white" fill="currentColor" />
                          <span className="text-white font-bold">{top3[1]?.upvotes?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Car Info */}
                      <div className="absolute bottom-4 left-4 max-w-[60%] pr-4">
                        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg break-words leading-tight">{top3[1]?.carName}</h3>
                        <p className="text-gray-200 text-sm drop-shadow-md break-words">
                          {top3[1]?.carMake} {top3[1]?.carModel}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 1st Place - Larger and centered */}
                <div className="order-1 md:order-2">
                  <Card className="bg-gradient-to-b from-yellow-900/30 to-gray-900 border-yellow-500/50 hover:border-yellow-400 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-yellow-500/20 overflow-hidden group relative z-10 cursor-pointer"
                        onClick={() => openModal(top3[0])}>
                    <div className="relative h-80">
                      <img
                        src={top3[0]?.mainPhotoKey 
                          ? getS3ImageUrl(top3[0]?.mainPhotoKey) 
                          : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(top3[0]?.carName)}`
                        }
                        alt={top3[0]?.carName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Winner Glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/50 via-transparent to-yellow-900/30" />
                      
                      {/* View Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-yellow-500/20 backdrop-blur-sm text-white border border-yellow-500/50 hover:bg-yellow-500/30">
                          <Eye className="h-5 w-5 mr-2" />
                          View Champion
                        </Button>
                      </div>
                      
                      {/* Rank Badge */}
                      
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getRankBadgeColor(1)} font-bold text-lg px-4 py-2 shadow-lg`}>
                          <Medal className="h-5 w-5 mr-2" />
                          1st Place
                        </Badge>
                      </div>
                      
                      {/* User Info */}
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white/30">
                            <AvatarImage 
                              src={top3[1]?.profilePhotoKey ? getS3ImageUrl(top3[1]?.profilePhotoKey) : undefined}
                              alt={`${top3[1]?.userName}'s profile`}
                            />
                            <AvatarFallback className="bg-gray-600 text-white text-sm">
                              {top3[1]?.userName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm font-medium">@{top3[1]?.userName}</span>
                        </div>
                      </div>
                      
                      {/* Vote Count */}
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-2 bg-red-500 backdrop-blur-sm rounded-full px-5 py-3 shadow-xl">
                          <Heart className="h-6 w-6 text-white animate-pulse" fill="currentColor" />
                          <span className="text-white font-bold text-lg">{top3[0]?.upvotes?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Car Info */}
                      <div className="absolute bottom-4 left-4 max-w-[60%] pr-4">
                        <h3 className="text-white font-bold text-2xl mb-1 drop-shadow-lg break-words leading-tight">{top3[0]?.carName}</h3>
                        <p className="text-gray-200 drop-shadow-md break-words text-sm">
                          {top3[0]?.carMake} {top3[0]?.carModel}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 3rd Place */}
                <div className="order-3">
                  <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden group cursor-pointer"
                        onClick={() => openModal(top3[2])}>
                    <div className="relative h-72">
                      <img
                        src={top3[2]?.mainPhotoKey 
                          ? getS3ImageUrl(top3[2]?.mainPhotoKey) 
                          : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(top3[2]?.carName)}`
                        }
                        alt={top3[2]?.carName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                      
                      {/* View Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30">
                          <Eye className="h-5 w-5 mr-2" />
                          View Details
                        </Button>
                      </div>
                      
                      {/* Rank Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getRankBadgeColor(3)} font-bold text-lg px-4 py-2 shadow-lg`}>
                          <Award className="h-5 w-5 mr-2" />
                          3rd Place
                        </Badge>
                      </div>
                      
                      {/* User Info */}
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2">
                          <Avatar className="h-8 w-8 ring-2 ring-white/30">
                            <AvatarImage 
                              src={top3[2]?.profilePhotoKey ? getS3ImageUrl(top3[2]?.profilePhotoKey) : undefined}
                              alt={`${top3[2]?.userName}'s profile`}
                            />
                            <AvatarFallback className="bg-gray-600 text-white text-sm">
                              {top3[2]?.userName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm font-medium">@{top3[2]?.userName}</span>
                        </div>
                      </div>
                      
                      {/* Vote Count */}
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                          <Heart className="h-5 w-5 text-white" fill="currentColor" />
                          <span className="text-white font-bold">{top3[2]?.upvotes?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Car Info */}
                      <div className="absolute bottom-4 left-4 max-w-[60%] pr-4">
                        <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg break-words leading-tight">{top3[2]?.carName}</h3>
                        <p className="text-gray-200 text-sm drop-shadow-md break-words">
                          {top3[2]?.carMake} {top3[2]?.carModel}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Section */}
          {leaderboard.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-gray-400" />
                Full Leaderboard
              </h2>
              
              <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {leaderboard.map((car, i) => (
                      <div key={car.entryID} className="flex items-center gap-4 p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group"
                           onClick={() => openModal(car)}>
                        {/* Rank Number */}
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full border border-gray-600 group-hover:border-gray-500 transition-colors">
                          <span className="font-bold text-lg text-white">#{i + 4}</span>
                        </div>
                        
                        {/* Car Image */}
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-600 group-hover:border-gray-500 transition-colors">
                          <img
                            src={car?.mainPhotoKey 
                              ? getS3ImageUrl(car?.mainPhotoKey) 
                              : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(car?.carName)}`
                            }
                            alt={car?.carName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        
                        {/* Car Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg group-hover:text-yellow-400 transition-colors truncate">
                            {car.carName}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {car.carMake} {car.carModel}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6 ring-1 ring-gray-600">
                              <AvatarImage 
                                src={car?.profilePhotoKey ? getS3ImageUrl(car?.profilePhotoKey) : undefined}
                                alt={`${car?.userName}'s profile`}
                              />
                              <AvatarFallback className="bg-gray-600 text-white text-xs">
                                {car?.userName?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-400 text-sm">@{car.userName}</span>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                            <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                            <span className="text-white font-semibold">{car.upvotes?.toLocaleString()}</span>
                          </div>
                          
                          {/* Performance badges */}
                          <div className="flex gap-1">
                            {car.horsepower && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 text-orange-300 border-orange-400/30 bg-orange-500/10">
                                {car.horsepower} HP
                              </Badge>
                            )}
                            {car.totalMods && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 text-blue-300 border-blue-400/30 bg-blue-500/10">
                                {car.totalMods} mods
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* View Button */}
                        <div className="w-8 text-center">
                          <Eye className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors mx-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {topCars.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-md mx-auto">
                <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
                <p className="text-gray-400 mb-4">Cars will appear here once they start receiving votes!</p>
                <p className="text-sm text-gray-500">
                  Be the first to explore and vote for amazing builds
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && selectedCar && (
        <div className="fixed inset-0 z-50 bg-gray-950">
          <style>{`
            html, body {
              overflow: hidden;
              height: 100%;
            }
            
            .slide-container {
              transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              will-change: transform;
            }
            
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

          {/* Close Button */}
          <Button
            className="fixed top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-white/20"
            size="sm"
            onClick={closeModal}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Progress bar */}
          <div className={`fixed top-0 left-0 w-full bg-black/20 z-40 ${isMobile ? 'h-1' : 'h-1 md:h-1.5'}`}>
            <div 
              className="h-full bg-red-500 transition-all duration-800 ease-out"
              style={{ width: `${((currentSlide + 1) / MODAL_SLIDES.length) * 100}%` }}
            />
          </div>

          <div 
            ref={containerRef}
            className="slide-container"
            style={{ height: `${MODAL_SLIDES.length * 100}vh` }}
          >
            {/* Section 1: Photo Gallery */}
            <section className="h-screen relative bg-gray-950">
              <div className="absolute inset-0">
                <SwipeablePhotoGallery
                  photos={selectedCar.allPhotoKeys}
                  carName={selectedCar.carName || "Car"}
                  userPhoto={selectedCar.profilePhotoKey}
                  username={selectedCar.userName}
                  region={selectedCar.region}
                  getS3ImageUrl={getS3ImageUrl}
                  hideControls={false}
                  className="w-full h-full"
                />
              </div>

              {/* Car title overlay */}
              <div className={`absolute z-20 ${isMobile ? 'top-16 left-2 right-2' : 'mt-16 left-5'}`}>
                <div className={`bg-gradient-to-br from-black/80 via-black/70 to-black/60 border border-white/20 shadow-2xl shadow-black/50 hover:shadow-3xl hover:shadow-purple-500/20 transition-all duration-500 group ${isMobile ? 'rounded-2xl px-4 py-4' : 'rounded-2xl md:rounded-3xl px-8 py-6'}`}>
                  
                  <div className="relative z-10">
                    <h1 className={`font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent tracking-tight drop-shadow-2xl ${isMobile ? 'text-lg mb-2' : 'text-xl sm:text-xl md:text-2xl mb-3'}`}>
                      {selectedCar.carName}
                    </h1>
                    
                    <p className={`text-gray-200/90 font-medium tracking-wide drop-shadow-lg ${isMobile ? 'text-sm mb-3' : 'text-lg mb-4'}`}>
                      {selectedCar.carMake} {selectedCar.carModel}
                    </p>
                    
                    <div className={`flex pt-2 ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
                      <Avatar className={`ring-2 ring-gradient-to-r ring-white/30 ring-offset-2 ring-offset-black/20 transition-all duration-300 group-hover:ring-blue-400/60 group-hover:ring-4 group-hover:scale-110 shadow-xl ${isMobile ? 'h-10 w-10' : 'h-14 w-14'}`}>
                        <AvatarImage 
                          className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-110" 
                          src={selectedCar.profilePhotoKey 
                            ? getS3ImageUrl(selectedCar.profilePhotoKey)
                            : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(user?.name || "User")}`
                          } 
                          alt={`${selectedCar.userName}'s profile`}
                        />
                        <AvatarFallback className={`bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-inner ${isMobile ? 'text-sm' : 'text-lg'}`}>
                          {selectedCar.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col justify-center min-w-0">
                        <p className={`text-white font-bold leading-tight drop-shadow-lg truncate bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          By @{selectedCar.userName}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                          <p className={`text-white/70 leading-tight font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            {selectedCar.region}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Action Buttons */}
              <div className={`absolute z-20 left-1/2 transform -translate-x-1/2 ${isMobile ? 'bottom-4 px-2' : 'bottom-10'}`}>
                <div className={`flex gap-3 ${isMobile ? 'flex-col w-full max-w-sm' : 'flex-col sm:flex-row gap-6'}`}>
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
                      handleLike(selectedCar.entryID?.toString() || "");
                    }}
                  >
                    <Heart className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-6 h-6 mr-3'}`} />
                    <span>
                      {isAuthenticated ? (isMobile ? 'Upvote' : 'Upvote This Build') : (isMobile ? 'Login' : 'Login To Upvote')}
                    </span>
                    {selectedCar.upvotes > 0 && <span className={isMobile ? 'text-xs ml-1' : 'ml-2'}>({selectedCar.upvotes})</span>}
                  </Button>

                  <Button 
                    size={isMobile ? "default" : "lg"}
                    variant="ghost"
                    className={`flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 hover:from-blue-600 hover:to-indigo-600 transition-transform ${isMobile ? 'rounded-xl text-sm px-6 py-3' : 'rounded-xl md:rounded-2xl text-lg px-10 py-6'}`}
                    onClick={() => goToSlide(2)}
                  >
                    <MessageCircle className={isMobile ? 'h-4 w-4 mr-2' : 'h-6 w-6 mr-3'} />
                    <span>Comments</span>
                  </Button>
                </div>
              </div>
            </section>

            {/* Section 2: Build Details */}
            <section className={`h-screen bg-gray-950 overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
              <div className={`h-full flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
                
                <div className={`flex justify-between items-start flex-shrink-0 ${isMobile ? 'flex-col gap-3' : 'flex-row items-center'}`}>
                  <div>
                    <h2 className={`font-bold text-white mb-2 ${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
                      Build Details
                    </h2>
                    <p className={`text-gray-300 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                      {selectedCar.carMake} {selectedCar.carModel}
                    </p>
                  </div>
                  <div className={`${isMobile ? 'self-start' : 'text-right'}`}>
                    <div className={`text-gray-400 mb-1 ${isMobile ? 'text-sm' : 'text-lg'}`}>Total Investment</div>
                    <div className={`font-bold text-green-400 ${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
                      ${selectedCar.totalCost.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className={`grid gap-3 md:gap-4 flex-shrink-0 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  <div className={`text-center bg-gray-800/50 rounded-xl border border-gray-700 ${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className={`font-bold text-white mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{selectedCar.totalMods}</div>
                    <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Modifications</div>
                  </div>
                  {selectedCar.horsepower ? (
                    <div className={`text-center bg-orange-900/30 rounded-xl border border-orange-800/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                      <div className={`font-bold text-orange-300 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{selectedCar.horsepower}</div>
                      <div className={`text-orange-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Horsepower</div>
                    </div>
                  ) : (
                    <div className={`text-center bg-gray-800/20 rounded-xl border border-gray-700/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                      <div className={`font-bold text-gray-500 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>-</div>
                      <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Horsepower</div>
                    </div>
                  )}
                  
                  {selectedCar.torque ? (
                    <div className={`text-center bg-blue-900/30 rounded-xl border border-blue-800/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                      <div className={`font-bold text-blue-300 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{selectedCar.torque}</div>
                      <div className={`text-blue-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>{isMobile ? 'Torque' : 'Torque (lb-ft)'}</div>
                    </div>
                  ) : (
                    <div className={`text-center bg-gray-800/20 rounded-xl border border-gray-700/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                      <div className={`font-bold text-gray-500 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>-</div>
                      <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Torque</div>
                    </div>
                  )}
                  
                  <div className={`text-center bg-purple-900/30 rounded-xl border border-purple-800/50 ${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className={`font-bold text-purple-300 mb-1 ${isMobile ? 'text-lg' : 'text-2xl'}`}>{selectedCar.upvotes}</div>
                    <div className={`text-purple-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Likes</div>
                  </div>
                </div>

                {/* Description and Tags */}
                <div className={`flex flex-col flex-shrink-0 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                  <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-3'}`}>
                    <Badge variant="outline" className={`text-white border-white/30 bg-white/10 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}>
                      {selectedCar.carMake}
                    </Badge>
                    <Badge variant="outline" className={`text-white border-white/30 bg-white/10 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}>
                      {selectedCar.region}
                    </Badge>
                    <Badge variant="outline" className={`text-white border-white/30 bg-white/10 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'}`}>
                      {selectedCar.category}
                    </Badge>
                  </div>

                  {selectedCar.description && (
                    <div>
                      <h3 className={`font-semibold text-white mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}>About This Build</h3>
                      <p className={`text-gray-300 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>{selectedCar.description}</p>
                    </div>
                  )}
                </div>

                {/* Modifications Section */}
                <div className="flex flex-col flex-1 min-h-0">
                  {selectedCar.mods && selectedCar.mods.length > 0 ? (
                    <>
                      <div className={`flex-shrink-0 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                        <h3 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                          <span className="text-orange-400">🔧</span>
                          Modifications ({selectedCar.mods.length})
                        </h3>
                      </div>
                      
                      <div className={`flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 ${isMobile ? 'mobile-scrollbar pr-1' : 'pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'}`}>
                        {selectedCar.mods.map((mod, index) => (
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

                      <div className={`border-t border-gray-700 flex-shrink-0 ${isMobile ? 'pt-2' : 'pt-3'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-gray-300 font-medium ${isMobile ? 'text-sm' : ''}`}>Total Parts:</span>
                          <span className={`text-green-400 font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                            ${selectedCar.mods.reduce((sum, mod) => sum + (mod.cost || 0), 0).toLocaleString()}
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

            {/* Section 3: Comments */}
            <section className={`h-screen bg-gray-950 overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
              <div className={`h-full flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
                <div className="flex-1 min-h-0">
                  <Comments 
                    entryID={selectedCar.entryID?.toString() || ""} 
                    className="h-full"
                  />
                </div>
                
                <div className="flex justify-center flex-shrink-0 pb-4">
                  <Button 
                    size={isMobile ? "default" : "lg"}
                    className={`group relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 hover:rotate-1 transform-gpu ${isMobile ? 'w-full text-sm px-6 py-3 rounded-xl' : 'w-full max-w-sm text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl md:rounded-2xl'}`}
                    onClick={() => goToSlide(0)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    
                    <svg 
                      className={`transform transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 ${isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 sm:w-6 sm:h-6 mr-2'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 10l7-7m0 0l7 7m-7-7v18" 
                      />
                    </svg>
                    
                    <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide">
                      Back to Top
                    </span>
                    
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-2 left-4 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{animationDelay: '0s'}} />
                      <div className="absolute top-3 right-6 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{animationDelay: '0.5s'}} />
                      <div className="absolute bottom-3 left-8 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{animationDelay: '1s'}} />
                    </div>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
      
    </div>
  );
}