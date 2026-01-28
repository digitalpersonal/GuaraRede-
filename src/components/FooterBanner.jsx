import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';

const FooterBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBanners(data || []);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchBanners)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading || banners.length === 0) return null;

  return (
    <div className="w-full bg-gray-50 border-t border-gray-100 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nossos Parceiros</h3>
        </div>
        
        <div className="relative max-w-5xl mx-auto h-32 md:h-40 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              {banners[currentIndex].link_url ? (
                <a 
                  href={banners[currentIndex].link_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full h-full flex items-center justify-center relative"
                >
                  <OptimizedImage 
                    src={banners[currentIndex].image_url} 
                    alt={banners[currentIndex].title}
                    className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              ) : (
                <OptimizedImage 
                  src={banners[currentIndex].image_url} 
                  alt={banners[currentIndex].title}
                  className="max-h-full max-w-full object-contain" 
                />
              )}
            </motion.div>
          </AnimatePresence>

          {banners.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.preventDefault(); handlePrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); handleNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FooterBanner;