import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Navbar } from "./utils/navbar"
import { Footer } from "./utils/footer"
import { ArrowRight, Heart, ThumbsUp, Trophy, Upload, ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"

const SLIDES = [
    { id: 'hero', name: 'Home' },
    { id: 'how-it-works', name: 'How It Works' },
    { id: 'cta', name: 'Get Started' }
  ]

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  

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

// we dont need to use use callback here, its way to overkill for such a small function an contributes to too many re renders.
// Use callback is better for passing function to chil components or when the functiun is massive, its dependancies
//  are when those change the function re-creates.
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
                  // Call function directly instead of through callback
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

  return (
    <div className="h-screen overflow-hidden relative">
      <style>{`
        html, body {
          overflow: hidden;
          height: 100%;
        }
        
        .slide-container {
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        
        .slide-enter {
          opacity: 0;
          transform: translateY(30px);
        }
        
        .slide-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.6s ease-out;
        }
        
        .slide-exit {
          opacity: 1;
          transform: translateY(0);
        }
        
        .slide-exit-active {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 0.6s ease-in;
        }

        .stagger-1 { 
          animation-delay: 0.1s; 
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.1s forwards;
        }
        .stagger-2 { 
          animation-delay: 0.3s; 
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.3s forwards;
        }
        .stagger-3 { 
          animation-delay: 0.5s; 
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.5s forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-indicator {
          transition: all 0.3s ease;
        }
        
        .slide-indicator.active {
          background: #DD1C49;
          transform: scale(1.2);
        }
      `}</style>

      


      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black/20 z-50">
        <div 
          className="h-full bg-primary transition-all duration-800 ease-out"
          style={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      

      <div 
        ref={containerRef}
        className="slide-container"
        style={{ height: `${SLIDES.length * 100}vh` }}
      >
        {/* Hero Slide */}
        <section className="h-screen relative justify-around">
            <Navbar />
          <div className="absolute inset-0 z-0">
            <img
              src="/nissan-skyline-r32-5575992_1920.jpg"
              alt="Featured car"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          
          <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mt-10 md:mt-60">
            <div className={`max-w-4xl mx-auto space-y-6 sm:space-y-8 p-6 sm:p-8 lg:p-12 bg-black/40 backdrop-blur-sm rounded-xl ${currentSlide === 0 ? 'stagger-1' : ''}`}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                Rate. Build. Inspire.
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl">
                The ultimate platform for car enthusiasts to showcase their builds, vote on others, and get inspired.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
                <Link href="/garage" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                    Upload Your Car
                  </Button>
                </Link>
                <Link href="/explore" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-black sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:bg-white/80">
                    Explore Builds
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="h-screen bg-gray-950 flex overflow-hidden justify-around">
          <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 mt-10 md:mt-60">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16 text-white ${currentSlide === 1 ? 'stagger-1' : ''}`}>
              How It Works
            </h2>
            
            <div className="grid grid-cols-3 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Upload Step */}
              <div className={`flex flex-col items-center text-center space-y-3 sm:space-y-4 lg:space-y-6 ${currentSlide === 1 ? 'stagger-1' : ''}`}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Upload</h3>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                  Share photos and details of your car build with the community.
                </p>
              </div>

              {/* Vote Step */}
              <div className={`flex flex-col items-center text-center space-y-3 sm:space-y-4 lg:space-y-6 ${currentSlide === 1 ? 'stagger-2' : ''}`}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 hover:scale-110 transition-transform duration-300">
                  <ThumbsUp className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Vote</h3>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                  Swipe and vote on other enthusiasts' builds to help them rank.
                </p>
              </div>

              {/* Get Ranked Step */}
              <div className={`flex flex-col items-center text-center space-y-3 sm:space-y-4 lg:space-y-6 ${currentSlide === 1 ? 'stagger-3' : ''}`}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Get Ranked</h3>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                  See how your build ranks against others in your category.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Slide */}
        <section className="h-screen bg-gray-900 flex flex-col justify-around items-center">
          <div className="container px-4 sm:px-6 lg:px-8 text-center space-y-8 sm:space-y-12 mt-10 md:mt-60">
            <div className={`max-w-4xl mx-auto space-y-6 sm:space-y-8 ${currentSlide === 2 ? 'stagger-1' : ''}`}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Ready to showcase your ride?
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Join thousands of car enthusiasts who are already sharing their builds and getting feedback.
              </p>
            </div>
            
            <div className={`flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-8 ${currentSlide === 2 ? 'stagger-2' : ''}`}>
              <Link href="/garage" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                  Upload Your Car
                </Button>
              </Link>
              <Link href="/explore" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-black sm:w-auto gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:bg-white/80">
                  Explore Builds
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </Link>
            </div>
            
           
          </div>
          
           <Button 
            size="lg" 
            className="w-full max-w-sm group relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 hover:rotate-1 transform-gpu"
            onClick={goToSlide.bind(null, 0)}
            >
            {/* Animated background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Animated shine effect */}
            <div className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {/* Icon with animation */}
            <svg 
                className="w-5 h-5 sm:w-6 sm:h-6 mr-2 transform transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" 
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
            
            {/* Text with subtle animation */}
            <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide">
                Back to Top
            </span>
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-4 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{animationDelay: '0s'}} />
                <div className="absolute top-3 right-6 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{animationDelay: '0.5s'}} />
                <div className="absolute bottom-3 left-8 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{animationDelay: '1s'}} />
            </div>
            </Button>
          
        
          
        </section>
      </div>

      <Footer />
    </div>
  )
}