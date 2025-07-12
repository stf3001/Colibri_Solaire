// Utilitaires d'optimisation des performances

import { errorLogger } from './errorMonitoring';

/**
 * Surveillant de performances Web Vitals
 */
export const performanceMonitor = {
  // Mesurer le temps de chargement des pages
  measurePageLoad: (pageName: string) => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      
      if (loadTime > 3000) {
        errorLogger.logError(
          `Page ${pageName} lente: ${loadTime.toFixed(0)}ms`,
          'performance',
          { pageName, loadTime }
        );
      } else {
        console.log(`⚡ Page ${pageName} chargée en ${loadTime.toFixed(0)}ms`);
      }
      
      return loadTime;
    };
  },

  // Mesurer les Core Web Vitals
  measureWebVitals: () => {
    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcp = entry.startTime;
          console.log(`🎨 First Contentful Paint: ${fcp.toFixed(0)}ms`);
          
          if (fcp > 2000) {
            errorLogger.logError(
              `FCP lent: ${fcp.toFixed(0)}ms`,
              'performance',
              { metric: 'FCP', value: fcp }
            );
          }
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Performance Observer non supporté');
    }
  },

  // Analyser l'utilisation mémoire
  checkMemoryUsage: () => {
    if ('memory' in performance) {
      // @ts-ignore
      const memory = performance.memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
      
      console.log(`💾 Mémoire: ${used}MB / ${total}MB`);
      
      if (used > 100) { // Plus de 100MB
        errorLogger.logError(
          `Utilisation mémoire élevée: ${used}MB`,
          'performance',
          { memoryUsed: used, memoryTotal: total }
        );
      }
      
      return { used, total, percentage: (used / total) * 100 };
    }
    
    return null;
  },

  // Détecter les composants qui re-render trop souvent
  trackReRenders: (componentName: string) => {
    const renders = window.__componentRenders || {};
    window.__componentRenders = renders;
    
    renders[componentName] = (renders[componentName] || 0) + 1;
    
    if (renders[componentName] > 10) {
      errorLogger.logError(
        `Composant ${componentName} re-render excessif: ${renders[componentName]}x`,
        'performance',
        { component: componentName, renders: renders[componentName] }
      );
    }
  }
};

/**
 * Hook pour optimiser les composants
 */
export const usePerformanceOptimization = (componentName: string) => {
  const measureRender = performanceMonitor.measurePageLoad(componentName);
  
  // Tracker les re-renders
  performanceMonitor.trackReRenders(componentName);
  
  return {
    measureRender,
    checkMemory: performanceMonitor.checkMemoryUsage
  };
};

/**
 * Optimisations de bundle et lazy loading
 */
export const bundleOptimizer = {
  // Précharger les chunks importants
  preloadCriticalChunks: () => {
    const criticalRoutes = [
      () => import('../pages/DashboardPage'),
      () => import('../pages/LeadsPage'),
      () => import('../components/MessagingSection')
    ];
    
    // Précharger après 2 secondes d'inactivité
    setTimeout(() => {
      criticalRoutes.forEach(route => {
        route().catch(err => {
          console.warn('Erreur préchargement:', err);
        });
      });
    }, 2000);
  },

  // Analyser la taille du bundle
  analyzeBundleSize: () => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    scripts.forEach(script => {
      fetch(script.src, { method: 'HEAD' })
        .then(response => {
          const size = parseInt(response.headers.get('content-length') || '0');
          totalSize += size;
          console.log(`📦 Script ${script.src.split('/').pop()}: ${(size / 1024).toFixed(1)}KB`);
        })
        .catch(() => {});
    });
    
    return totalSize;
  }
};

// Initialisation automatique
performanceMonitor.measureWebVitals();
bundleOptimizer.preloadCriticalChunks();

// Vérification mémoire périodique
setInterval(() => {
  performanceMonitor.checkMemoryUsage();
}, 5 * 60 * 1000); // Toutes les 5 minutes

// Types pour la déclaration globale
declare global {
  interface Window {
    __componentRenders?: Record<string, number>;
  }
}
