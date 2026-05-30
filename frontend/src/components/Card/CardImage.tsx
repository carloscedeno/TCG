import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { getOptimizedScryfallUrl } from '../../utils/imageOptimization';

interface CardImageProps {
  src?: string;
  alt: string;
  className?: string;
  testId?: string;
  size?: 'small' | 'normal' | 'large';
  fallbackIconSize?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  style?: React.CSSProperties;
}

export const CardImage: React.FC<CardImageProps> = ({ src, alt, className = '', testId = 'product-image', size = 'normal', fallbackIconSize = 40, objectFit = 'cover', style }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const optimizedSrc = getOptimizedScryfallUrl(src, size);

  // Reiniciar el estado si cambia la imagen (ej: flip de DFC)
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [optimizedSrc]);

  if (!optimizedSrc || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center w-full h-full text-neutral-600 p-4 ${className}`}>
        <Shield size={fallbackIconSize} className="mb-2 opacity-20" />
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">Imagen No Disponible</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-transparent overflow-hidden ${className}`}>
      {/* Skeleton Shimmer Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 bg-slate-800/50 animate-pulse flex items-center justify-center">
          <Shield size={fallbackIconSize} className="opacity-10" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      )}

      {/* Actual Image */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-${objectFit} transition-opacity duration-500 ease-in-out absolute inset-0 z-10 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        data-testid={testId}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={style}
      />
    </div>
  );
};
