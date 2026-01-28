import React, { useState } from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";

const PostMedia = ({ mediaUrls = [], videoUrl = null, contentMode = false, feedMode = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [playVideo, setPlayVideo] = useState(!feedMode); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Safety check: ensure arrays are valid
  const safeMediaUrls = Array.isArray(mediaUrls) ? mediaUrls : [];
  const hasMedia = safeMediaUrls.length > 0;

  // If no media and no video, return null immediately
  if (!hasMedia && !videoUrl) return null;

  const nextImage = (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev + 1) % safeMediaUrls.length);
  };

  const prevImage = (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev - 1 + safeMediaUrls.length) % safeMediaUrls.length);
  };
  
  // Ensure index is within bounds (reset if urls changed)
  if (currentImageIndex >= safeMediaUrls.length && safeMediaUrls.length > 0) {
      setCurrentImageIndex(0);
  }

  return (
    <div className="mb-4 space-y-3 w-full">
      {/* Video Section */}
      {videoUrl && (
        <div className={`w-full rounded-lg overflow-hidden bg-black shadow-sm relative flex items-center justify-center ${feedMode ? 'max-h-[500px]' : 'max-h-[80vh]'}`}>
          {!playVideo ? (
            <div 
                className="w-full h-full relative flex items-center justify-center aspect-video cursor-pointer bg-gray-900 group"
                onClick={() => setPlayVideo(true)}
            >
                {/* Thumbnail overlay if available, otherwise black bg */}
                <div className="w-16 h-16 bg-white/20 group-hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all transform group-hover:scale-110 z-10">
                    <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                </div>
                <p className="absolute bottom-4 text-white/70 text-sm font-medium z-10">Toque para assistir</p>
            </div>
          ) : (
            <video 
              controls 
              autoPlay={!feedMode}
              playsInline
              loop={!feedMode}
              className="max-w-full max-h-full w-auto h-auto object-contain mx-auto"
              style={{ maxHeight: feedMode ? '500px' : '80vh' }}
              preload="metadata"
            >
              <source src={videoUrl} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo.
            </video>
          )}
        </div>
      )}

      {/* Images Carousel */}
      {hasMedia && (
        <div className={`relative group w-full flex items-center justify-center rounded-lg overflow-hidden bg-gray-50 border border-gray-100 ${feedMode ? 'max-h-[500px] min-h-[250px]' : 'max-h-[80vh] min-h-[300px]'}`}>
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogTrigger asChild>
                    <div className="w-full h-full flex items-center justify-center cursor-pointer relative">
                        {/* 
                           Updated styling for proper containment:
                           - max-w-full / max-h-full: Ensures it fits within parent
                           - w-auto / h-auto: Maintains aspect ratio
                           - object-contain: Prevents cropping
                        */}
                        <OptimizedImage 
                            src={safeMediaUrls[currentImageIndex]} 
                            alt={`Imagem ${currentImageIndex + 1}`} 
                            className={`block max-w-full max-h-full w-auto h-auto object-contain mx-auto transition-opacity duration-300 hover:opacity-95 ${feedMode ? 'max-h-[500px]' : 'max-h-[80vh]'}`}
                            resize="contain"
                            width={feedMode ? 800 : 1200}
                            height={feedMode ? 800 : 1200}
                            priority={!feedMode && currentImageIndex === 0} 
                        />
                        {safeMediaUrls.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full z-10 border border-white/10">
                                {currentImageIndex + 1} / {safeMediaUrls.length}
                            </div>
                        )}
                    </div>
                </DialogTrigger>
                
                {/* Lightbox Content */}
                <DialogContent 
                  className="max-w-screen-xl w-full h-full max-h-screen p-0 bg-black/95 border-none text-white flex flex-col justify-center focus:outline-none"
                  aria-describedby={undefined}
                >
                   <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-50">
                      <button 
                        onClick={() => setIsLightboxOpen(false)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors focus:outline-none z-50 cursor-pointer"
                        aria-label="Fechar"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                   </div>
                  
                  <div className="w-full h-full flex items-center justify-center relative p-4">
                      {/* Verify source again before rendering in lightbox */}
                      {safeMediaUrls[currentImageIndex] && (
                          <img 
                            src={safeMediaUrls[currentImageIndex]} 
                            alt="Full size" 
                            className="max-w-full max-h-[85vh] object-contain shadow-2xl" 
                          />
                      )}
                      
                      {/* Lightbox Navigation */}
                      {safeMediaUrls.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(e); }}
                                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-all focus:outline-none"
                                aria-label="Imagem anterior"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(e); }}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-all focus:outline-none"
                                aria-label="Próxima imagem"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </>
                      )}
                  </div>
                </DialogContent>
            </Dialog>

            {/* Carousel Navigation (Overlay on thumbnail) */}
            {safeMediaUrls.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                    >
                        <ChevronRight size={20} />
                    </Button>
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {safeMediaUrls.map((_, idx) => (
                            <div 
                                key={idx}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
      )}
    </div>
  );
};

export default PostMedia;