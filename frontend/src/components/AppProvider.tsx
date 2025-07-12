import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useDataPreloader, useNetworkOptimization } from "utils/performance";
import { useEffect } from "react";
import { stackClientApp } from "app/auth";
import { StackProvider } from "@stackframe/react";
import { performanceMonitor, bundleOptimizer } from "utils/performanceOptimizer";
import { errorLogger } from "utils/errorMonitoring";

interface Props {
  children: ReactNode;
}

// Create a client with optimized performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - Données restent fraîches plus longtemps
      cacheTime: 1000 * 60 * 30, // 30 minutes - Cache conservé en mémoire
      retry: 2, // Retry une fois de plus pour la fiabilité
      refetchOnWindowFocus: false, // Évite les refetch inutiles au focus
      refetchOnMount: false, // Ne refetch que si stale
      refetchOnReconnect: 'always', // Refetch à la reconnexion réseau
    },
    mutations: {
      retry: 1, // Retry les mutations une fois
    },
  },
});

/**
 * Composant interne pour gérer les optimisations performances
 */
const PerformanceManager = ({ children }: { children: ReactNode }) => {
  const { preloadRoute } = useDataPreloader();
  const { isSlowConnection, shouldReduceAnimations } = useNetworkOptimization();

  useEffect(() => {
    // Adapter les performances selon la connexion
    if (isSlowConnection) {
      // Réduire les animations pour connexions lentes
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
    }
    
    // Précharger les routes critiques selon la connexion
    if (!isSlowConnection) {
      // Préchargement intelligent basé sur l'usage probable
      setTimeout(() => {
        preloadRoute('dashboard');
        preloadRoute('leads');
      }, 3000);
    }
  }, [isSlowConnection, preloadRoute]);

  // Optimiser les styles CSS pour mobile
  useEffect(() => {
    // Activer l'accélération GPU pour les animations critiques
    const style = document.createElement('style');
    style.textContent = `
      .touch-manipulation {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform;
      }
      
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
};

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 * Note: ThemeProvider is already included in AppWrapper.tsx and does not need to be added here.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialiser les optimisations de performance
  useEffect(() => {
    console.log('☀️ AmbassyApp - Initialisation des optimisations');
    
    // Mesurer le temps de chargement initial
    const measureAppLoad = performanceMonitor.measurePageLoad('AppProvider');
    
    // Précharger les chunks critiques
    bundleOptimizer.preloadCriticalChunks();
    
    // Log de démarrage réussi
    setTimeout(() => {
      const loadTime = measureAppLoad();
      console.log(`✅ AmbassyApp chargée en ${loadTime.toFixed(0)}ms`);
      
      // Analyser la mémoire après chargement
      performanceMonitor.checkMemoryUsage();
    }, 100);
    
    return () => {
      errorLogger.logError('AppProvider unmounted', 'ui');
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PerformanceManager>
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={4000}
          toastOptions={{
            className: 'touch-manipulation'
          }}
        />
      </PerformanceManager>
    </QueryClientProvider>
  );
};
