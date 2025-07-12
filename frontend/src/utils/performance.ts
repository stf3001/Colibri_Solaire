import { useState, useEffect } from 'react';

/**
 * Hook pour précharger les données critiques de l'app
 * Optimise le chargement des pages fréquemment visitées
 */
export const useDataPreloader = () => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set());

  const preloadRoute = async (routeName: string) => {
    if (preloadedRoutes.has(routeName)) return;
    
    setIsPreloading(true);
    try {
      // Précharger les composants selon la route
      switch (routeName) {
        case 'dashboard':
          await import('../pages/DashboardPage');
          break;
        case 'leads':
          await import('../pages/LeadsPage');
          await import('../pages/LeadForm');
          break;
        case 'commissions':
          await import('../pages/CommissionsPage');
          break;
        case 'admin':
          await import('../pages/Admin');
          break;
        default:
          break;
      }
      
      setPreloadedRoutes(prev => new Set([...prev, routeName]));
    } catch (error) {
      console.warn('Erreur lors du préchargement de', routeName, error);
    } finally {
      setIsPreloading(false);
    }
  };

  const preloadCriticalRoutes = () => {
    // Précharger les routes les plus importantes après 2s
    setTimeout(() => {
      preloadRoute('dashboard');
      preloadRoute('leads');
    }, 2000);
  };

  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

  return {
    preloadRoute,
    isPreloading,
    preloadedRoutes: Array.from(preloadedRoutes)
  };
};

/**
 * Hook pour optimiser le chargement des images
 * Supporte lazy loading et format WebP
 */
export const useOptimizedImage = (src: string, alt: string) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    // Essayer le format WebP d'abord si supporté
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    const optimizedSrc = supportsWebP() && src.includes('unsplash') 
      ? `${src}&fm=webp&q=80` 
      : src;

    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setHasError(true);
      setImageSrc(src); // Fallback à l'image originale
    };
    
    img.src = optimizedSrc;
  }, [src]);

  return {
    src: imageSrc,
    isLoaded,
    hasError,
    alt
  };
};

/**
 * Hook pour détecter la connexion réseau et adapter les performances
 */
export const useNetworkOptimization = () => {
  const [connectionType, setConnectionType] = useState<string>('4g');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // @ts-ignore - Navigator.connection n'est pas standard mais disponible
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const updateConnection = () => {
        setConnectionType(connection.effectiveType || '4g');
        setIsSlowConnection(['slow-2g', '2g', '3g'].includes(connection.effectiveType));
      };
      
      updateConnection();
      connection.addEventListener('change', updateConnection);
      
      return () => {
        connection.removeEventListener('change', updateConnection);
      };
    }
  }, []);

  return {
    connectionType,
    isSlowConnection,
    shouldReduceAnimations: isSlowConnection,
    shouldLazyLoadImages: isSlowConnection
  };
};