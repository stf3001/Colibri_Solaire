import React from 'react';
import { useOptimizedImage, useNetworkOptimization } from 'utils/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  placeholder?: string;
}

/**
 * Composant d'image optimisée avec lazy loading et support WebP
 * Adapte automatiquement la qualité selon la connexion réseau
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  lazy = true,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkNoYXJnZW1lbnQuLi48L3RleHQ+Cjwvc3ZnPgo='
}) => {
  const { src: optimizedSrc, isLoaded, hasError } = useOptimizedImage(src, alt);
  const { isSlowConnection } = useNetworkOptimization();
  
  // Réduire la qualité pour les connexions lentes
  const finalSrc = isSlowConnection && src.includes('unsplash') 
    ? `${src}&q=60&w=600` 
    : optimizedSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <img 
          src={placeholder}
          alt="Chargement..."
          className="absolute inset-0 w-full h-full object-cover animate-pulse"
        />
      )}
      
      <img
        src={finalSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        className={`transition-opacity duration-300 w-full h-full object-cover ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onError={() => {
          // Fallback en cas d'erreur
          console.warn('Erreur de chargement image:', src);
        }}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-500 text-sm">Image indisponible</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;