import { useState, useEffect } from 'react';

// Interface pour les entrées de cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
  size?: number; // Taille estimée pour le monitoring mémoire
}

// Configuration du cache optimisée pour réduire l'utilisation mémoire
const CACHE_CONFIG = {
  dashboard: 20000, // 20 secondes (réduit de 30s)
  leads: 30000,     // 30 secondes (réduit de 60s)
  commissions: 60000, // 1 minute (réduit de 2min)
  messages: 20000,  // 20 secondes (réduit de 30s)
  admin: 30000,     // 30 secondes (réduit de 60s)
};

// Limites pour le garbage collection
const GC_CONFIG = {
  maxEntries: 50,        // Maximum 50 entrées en cache
  maxMemoryMB: 20,       // Maximum 20MB de cache estimé
  gcInterval: 2 * 60 * 1000, // Garbage collection toutes les 2 minutes
  forceGcThreshold: 0.8  // Force GC à 80% des limites
};

// Store de cache en mémoire
const apiCache = new Map<string, CacheEntry<any>>();
let totalCacheSize = 0; // Taille estimée du cache en bytes

// Fonction pour estimer la taille d'un objet
function estimateObjectSize(obj: any): number {
  const jsonString = JSON.stringify(obj);
  return new Blob([jsonString]).size;
}

// Garbage collection intelligent
function runGarbageCollection(force = false) {
  const now = Date.now();
  const entries = Array.from(apiCache.entries());
  const totalEntries = entries.length;
  const totalSizeMB = totalCacheSize / (1024 * 1024);
  
  // Conditions pour déclencher le GC
  const shouldGC = force || 
    totalEntries > GC_CONFIG.maxEntries * GC_CONFIG.forceGcThreshold ||
    totalSizeMB > GC_CONFIG.maxMemoryMB * GC_CONFIG.forceGcThreshold;

  if (!shouldGC) return;

  console.log(`🗑️ Démarrage GC: ${totalEntries} entrées, ${totalSizeMB.toFixed(2)}MB`);
  
  // Supprimer les entrées expirées
  let removedExpired = 0;
  for (const [key, entry] of entries) {
    if ((now - entry.timestamp) > entry.ttl) {
      totalCacheSize -= entry.size || 0;
      apiCache.delete(key);
      removedExpired++;
    }
  }

  // Si encore trop d'entrées, supprimer les plus anciennes
  const remainingEntries = Array.from(apiCache.entries());
  if (remainingEntries.length > GC_CONFIG.maxEntries) {
    const sorted = remainingEntries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
    const toRemove = sorted.slice(0, remainingEntries.length - GC_CONFIG.maxEntries);
    
    for (const [key, entry] of toRemove) {
      totalCacheSize -= entry.size || 0;
      apiCache.delete(key);
    }
  }

  const finalSize = (totalCacheSize / (1024 * 1024)).toFixed(2);
  console.log(`✅ GC terminé: ${apiCache.size} entrées, ${finalSize}MB (supprimé ${removedExpired} expirées)`);
}

/**
 * Hook pour gérer le cache des API calls avec optimisations mémoire
 */
export const useApiCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheType: keyof typeof CACHE_CONFIG = 'dashboard'
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const ttl = CACHE_CONFIG[cacheType];

  const fetchData = async (forceRefresh = false) => {
    const now = Date.now();
    const cacheEntry = apiCache.get(key);

    // Vérifier si on a des données en cache valides
    if (!forceRefresh && cacheEntry && (now - cacheEntry.timestamp) < cacheEntry.ttl) {
      console.log(`🔄 Cache hit pour ${key}`);
      setData(cacheEntry.data);
      return cacheEntry.data;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🌐 Fetch API pour ${key}`);
      const result = await fetcher();
      
      // Estimer la taille des données
      const dataSize = estimateObjectSize(result);
      
      // Supprimer l'ancienne entrée si elle existe
      if (cacheEntry) {
        totalCacheSize -= cacheEntry.size || 0;
      }
      
      // Stocker en cache avec monitoring de taille
      const newEntry: CacheEntry<T> = {
        data: result,
        timestamp: now,
        ttl,
        size: dataSize
      };
      
      apiCache.set(key, newEntry);
      totalCacheSize += dataSize;

      // Déclencher GC si nécessaire
      runGarbageCollection();

      setData(result);
      setLastFetch(now);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      
      // En cas d'erreur, utiliser le cache si disponible
      if (cacheEntry) {
        console.log(`⚠️ Erreur API, utilisation du cache pour ${key}`);
        setData(cacheEntry.data);
        return cacheEntry.data;
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [key]);

  const invalidateCache = () => {
    const entry = apiCache.get(key);
    if (entry) {
      totalCacheSize -= entry.size || 0;
      apiCache.delete(key);
    }
    fetchData(true);
  };

  const refreshData = () => fetchData(true);

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refreshData,
    invalidateCache,
    isCached: !!apiCache.get(key)
  };
};

/**
 * Utilitaires pour gérer le cache globalement avec monitoring mémoire
 */
export const cacheUtils = {
  clear: () => {
    apiCache.clear();
    totalCacheSize = 0;
    console.log('🗑️ Cache API vidé complètement');
  },
  
  clearByPattern: (pattern: string) => {
    for (const [key, entry] of apiCache) {
      if (key.includes(pattern)) {
        totalCacheSize -= entry.size || 0;
        apiCache.delete(key);
      }
    }
    console.log(`🗑️ Cache vidé pour pattern: ${pattern}`);
  },
  
  forceGC: () => {
    runGarbageCollection(true);
  },
  
  getStats: () => {
    const stats = {
      totalEntries: apiCache.size,
      totalSizeMB: (totalCacheSize / (1024 * 1024)).toFixed(2),
      maxEntriesLimit: GC_CONFIG.maxEntries,
      maxMemoryLimitMB: GC_CONFIG.maxMemoryMB,
      entries: Array.from(apiCache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((Date.now() - entry.timestamp) / 1000),
        ttl: Math.round(entry.ttl / 1000),
        sizeMB: ((entry.size || 0) / (1024 * 1024)).toFixed(3),
        isExpired: (Date.now() - entry.timestamp) > entry.ttl
      }))
    };
    
    console.log('📊 Stats du cache API:', stats);
    return stats;
  }
};

// Garbage collection automatique optimisé
setInterval(() => {
  runGarbageCollection();
}, GC_CONFIG.gcInterval);

// Force GC au chargement de la page pour nettoyer le cache persistant
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => runGarbageCollection(true), 1000);
  });
}
