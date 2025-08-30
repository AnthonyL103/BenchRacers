import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PrefetchPageLinks } from 'react-router-dom';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const totalSlides = photos.length;


  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };



  useEffect(() => {
    const handleResize = () => {
      setCurrentSlide(curr => curr);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!photos || photos.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-200 ${className}`}>
        <p className="text-gray-500">No photos available</p>
      </div>
    );
  }

  return (
    <div className={`flex ${className}`}>
      {!hideControls && totalSlides > 1 && (
        <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
            style={{ zIndex: 5 }}
            aria-label="Previous photo"
        >
        <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      <div className="w-full h-full overflow-hidden relative">

        <div 
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`
          }}
        >
          {photos.map((photo, index) => (
            <img
              key={index}
              src={getS3ImageUrl(photo)}
              className="w-full h-full h-[300px] sm:h-[500px] md:h-[600px] lg:h-[600px] xl:h-[650px] 2xl:h-[700px] flex-shrink-0 object-cover"
              alt={`${carName} - Image ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        
        {/* Dots indicator */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {!hideControls && totalSlides > 1 && (
        <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50"
            style={{ zIndex: 5 }}
            aria-label="Next photo"
            >
            <ChevronRight className="w-6 h-6" />
        </button>
      )}
      
      
    </div>
  );
};

export default SwipeablePhotoGallery;