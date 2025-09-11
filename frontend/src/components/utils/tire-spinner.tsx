import React from 'react';

const TireLoadingAnimation = ({ size = 120, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer tire rim */}
        <div 
          className="absolute inset-0 rounded-full border-8 border-gray-300 animate-spin"
          style={{ 
            borderColor: '#374151',
            animationDuration: '1s',
            animationTimingFunction: 'linear'
          }}
        />
        
        {/* Inner rim with spokes */}
        <div 
          className="absolute inset-4 rounded-full bg-gray-700 animate-spin"
          style={{ 
            animationDuration: '1s',
            animationTimingFunction: 'linear'
          }}
        >
          {/* Spokes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-full bg-gray-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rotate-45">
            <div className="w-0.5 h-full bg-gray-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rotate-90">
            <div className="w-0.5 h-full bg-gray-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rotate-[135deg]">
            <div className="w-0.5 h-full bg-gray-500" />
          </div>
        </div>
        
        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 rounded-full border-2 border-gray-600" />
        
        {/* Tire treads (outer dots) */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-1 bg-gray-800 rounded-full animate-spin"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${size/2 - 6}px)`,
              animationDuration: '1s',
              animationTimingFunction: 'linear'
            }}
          />
        ))}
        
        {/* Motion blur effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-30 animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(220, 38, 127, 0.3) 90deg, transparent 180deg)',
            animationDuration: '0.5s',
            animationTimingFunction: 'linear'
          }}
        />
      </div>
      
      {/* Loading text */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Loading...</h3>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

// Example usage with different sizes and in your garage loading state
export default function TireLoadingDemo() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      {/* Main loading animation */}
      <TireLoadingAnimation size={120} />
      
      {/* Alternative smaller version */}
      {/* <TireLoadingAnimation size={80} className="mt-8" /> */}
    </div>
  );
}