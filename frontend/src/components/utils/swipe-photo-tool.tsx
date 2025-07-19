import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeablePhotoGalleryProps {
  photos: string[];
  carName: string;
  getS3ImageUrl: (key: string) => string;
  className?: string;
  hideControls?: boolean;
}

const SwipeablePhotoGallery: React.FC<SwipeablePhotoGalleryProps> = ({
  photos,
  carName,
  getS3ImageUrl,
  className = "",
  hideControls = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  // Get the current photo or fallback to placeholder
  const getCurrentPhotoUrl = () => {
    if (photos.length === 0) {
      return `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(carName)}`;
    }
    return getS3ImageUrl(photos[currentIndex]);
  };

  const goToNext = () => {
    if (isTransitioning || photos.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrevious = () => {
    if (isTransitioning || photos.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    
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

  return (
    <div className={`relative h-[60vh] overflow-hidden ${className}`} style={{ zIndex: 1 }}>
      {/* Main Image Container */}
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
          alt={`${carName} - Photo ${currentIndex + 1} of ${photos.length}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isTransitioning ? 'opacity-80' : 'opacity-100'
          }`}
          draggable={false}
          style={{ zIndex: 1 }}
        />
      </div>

      {/* Navigation Arrows - Only show if more than 1 photo and not hidden */}
      {photos.length > 1 && !hideControls && (
        <>
          <button
            onClick={goToPrevious}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
            style={{ zIndex: 50 }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
            style={{ zIndex: 50 }}
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Photo Indicators/Dots - Only show if more than 1 photo and not hidden */}
      {photos.length > 1 && !hideControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2" style={{ zIndex: 50 }}>
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Photo Counter - Always show if more than 1 photo */}
      {photos.length > 1 && (
        <div className={`absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm transition-opacity duration-200 ${hideControls ? 'opacity-30' : 'opacity-100'}`} style={{ zIndex: 50 }}>
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Swipe Hint - Only show if not hidden */}
      {photos.length > 1 && !hideControls && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/70 text-sm animate-pulse" style={{ zIndex: 50 }}>
          Swipe or drag to view more photos
        </div>
      )}
    </div>
  );
};

export default SwipeablePhotoGallery;