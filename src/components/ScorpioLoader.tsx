"use client";

import React from 'react';

// With image version - matches your logo
export const ScorpioLoader = ({ logoSrc = "/logo/logo.jpg" }) => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="relative">
        {/* Your actual logo */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <img 
            src={logoSrc} 
            alt="Loading" 
            className="w-full h-full object-contain opacity-90"
            style={{
              animation: 'breathe 2s ease-in-out infinite'
            }}
          />
          
          {/* Outer rotating ring */}
          <div 
            className="absolute inset-0 border-2 border-transparent border-t-white rounded-full"
            style={{ animation: 'spin 3s linear infinite' }}
          ></div>
          
          {/* Inner counter-rotating ring */}
          <div 
            className="absolute inset-4 border-2 border-transparent border-b-white/60 rounded-full"
            style={{ animation: 'spin 2s linear infinite reverse' }}
          ></div>
          
          {/* Pulsing background glow */}
          <div className="absolute inset-0 bg-white/5 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
        </div>
      </div>
      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            opacity: 0.7;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ScorpioLoader;

