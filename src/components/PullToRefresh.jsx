import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PullToRefresh({ onRefresh, children, className }) {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  
  // Maximum distance to pull in pixels
  const MAX_PULL = 150;
  // Threshold to trigger refresh
  const REFRESH_THRESHOLD = 80;

  useEffect(() => {
    // Prevent native pull-to-refresh behavior
    document.body.style.overscrollBehaviorY = 'contain';
    
    return () => {
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, []);

  const handleTouchStart = (e) => {
    // Only activate if we are at the top of the page
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;

    if (delta > 0) {
      // Apply resistance/damping
      // Logarithmic damping feels more natural than linear
      const damped = Math.min(Math.pow(delta, 0.8), MAX_PULL);
      setTranslateY(damped);
      
      // Try to prevent native scroll if we are handling the pull
      if (e.cancelable && delta < MAX_PULL) {
         // e.preventDefault(); 
         // Note: Calling preventDefault on touchmove is often problematic with passive listeners
         // We rely on overscroll-behavior: contain instead.
      }
    } else {
      // User is scrolling up/normally
      setTranslateY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    
    setPulling(false);
    
    if (translateY > REFRESH_THRESHOLD) {
      setRefreshing(true);
      setTranslateY(REFRESH_THRESHOLD); // Snap to loading position
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setTranslateY(0);
      }
    } else {
      setTranslateY(0);
    }
    
    setStartY(0);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative min-h-screen", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Indicator - Fixed at top, behind content */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pt-4 z-0 pointer-events-none overflow-hidden"
        style={{ height: MAX_PULL }}
      >
        <div 
          className="transition-all duration-200 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md border border-gray-100"
          style={{ 
            transform: `scale(${Math.min(translateY / REFRESH_THRESHOLD, 1.2)})`,
            opacity: Math.min(translateY / (REFRESH_THRESHOLD * 0.5), 1)
          }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <ArrowDown 
              className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${translateY > REFRESH_THRESHOLD ? 'rotate-180' : ''}`} 
            />
          )}
        </div>
      </div>

      {/* Content - Moves down */}
      <motion.div
        animate={{ y: translateY }}
        transition={{ 
          type: "spring", 
          stiffness: refreshing ? 200 : 300, 
          damping: refreshing ? 20 : 30 
        }}
        className="relative z-10 bg-gray-50 min-h-screen shadow-sm" 
        // bg-gray-50 is important to cover the loader when y=0
      >
        {children}
      </motion.div>
    </div>
  );
}