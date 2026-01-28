import React from 'react';
import { useInView } from 'react-intersection-observer';
import { optimizeSupabaseImage } from '@/lib/utils';
import { User } from 'lucide-react';

const OptimizedImage = ({ src, alt, className, width, height, quality = 75, resize = 'cover', ...props }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const optimizedSrc = src ? optimizeSupabaseImage(src, width, height, quality, resize) : null;

  const Placeholder = () => (
    <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
      <User className="w-1/2 h-1/2 text-gray-400" />
    </div>
  );

  if (resize === 'none') {
    return (
      <div ref={ref} className={className}>
        {inView ? (
          optimizedSrc ? (
            <img
              src={optimizedSrc}
              alt={alt}
              className="w-full h-auto"
              loading="lazy"
              {...props}
            />
          ) : (
            <Placeholder />
          )
        ) : (
          // Placeholder for resize="none" should not force aspect ratio
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={`bg-gray-200 ${className}`}>
      {inView ? (
        optimizedSrc ? (
          <img
            src={optimizedSrc}
            alt={alt}
            className="w-full h-full"
            style={{ objectFit: resize }}
            loading="lazy"
            {...props}
          />
        ) : (
          <Placeholder />
        )
      ) : (
        <div className="w-full h-full" />
      )}
    </div>
  );
};

export default OptimizedImage;