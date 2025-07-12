// Système de monitoring d'erreurs simple et efficace

interface ErrorEvent {
  id: string;
  type: 'api' | 'ui' | 'auth' | 'performance';
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
}

// Store local des erreurs (max 100 entrées)
const errorStore: ErrorEvent[] = [];
const MAX_ERRORS = 100;

/**
 * Logger d'erreurs centralisé
 */
export const errorLogger = {
  logError: (error: Error | string, type: ErrorEvent['type'] = 'ui', context?: any) => {
    const errorEvent: ErrorEvent = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Ajouter contexte supplémentaire si fourni
    if (context) {
      errorEvent.message += ` | Context: ${JSON.stringify(context)}`;
    }

    // Stocker l'erreur
    errorStore.unshift(errorEvent);
    if (errorStore.length > MAX_ERRORS) {
      errorStore.pop();
    }

    // Log en console selon le type
    switch (type) {
      case 'api':
        console.error('🔴 API Error:', errorEvent.message);
        break;
      case 'auth':
        console.error('🔐 Auth Error:', errorEvent.message);
        break;
      case 'performance':
        console.warn('⚡ Performance Warning:', errorEvent.message);
        break;
      default:
        console.error('❌ UI Error:', errorEvent.message);
    }

    // Stocker en localStorage pour persistance
    try {
      const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      storedErrors.unshift(errorEvent);
      const limitedErrors = storedErrors.slice(0, 50); // Garder seulement 50 erreurs
      localStorage.setItem('app_errors', JSON.stringify(limitedErrors));
    } catch (e) {
      console.warn('Impossible de sauvegarder l\'erreur en localStorage');
    }

    return errorEvent.id;
  },

  getErrors: (type?: ErrorEvent['type']) => {
    return type ? errorStore.filter(err => err.type === type) : errorStore;
  },

  clearErrors: () => {
    errorStore.length = 0;
    localStorage.removeItem('app_errors');
    console.log('🗑️ Erreurs nettoyées');
  },

  getErrorStats: () => {
    const now = Date.now();
    const last24h = errorStore.filter(err => (now - err.timestamp) < 24 * 60 * 60 * 1000);
    const lastHour = errorStore.filter(err => (now - err.timestamp) < 60 * 60 * 1000);

    const statsByType = errorStore.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: errorStore.length,
      last24h: last24h.length,
      lastHour: lastHour.length,
      byType: statsByType,
      mostRecent: errorStore[0]?.timestamp ? new Date(errorStore[0].timestamp) : null
    };
  }
};

/**
 * Hook pour monitorer les erreurs dans les composants
 */
export const useErrorHandler = () => {
  const handleApiError = (error: any, endpoint: string) => {
    const errorMsg = `API ${endpoint}: ${error?.message || 'Erreur inconnue'}`;
    return errorLogger.logError(errorMsg, 'api', { endpoint, status: error?.status });
  };

  const handleUIError = (error: Error, component: string) => {
    const errorMsg = `Component ${component}: ${error.message}`;
    return errorLogger.logError(errorMsg, 'ui', { component });
  };

  const handleAuthError = (error: any) => {
    const errorMsg = `Auth: ${error?.message || 'Erreur d\'authentification'}`;
    return errorLogger.logError(errorMsg, 'auth');
  };

  return {
    handleApiError,
    handleUIError,
    handleAuthError,
    logCustomError: errorLogger.logError
  };
};

// Capturer les erreurs non gérées
window.addEventListener('error', (event) => {
  errorLogger.logError(event.error || event.message, 'ui', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Capturer les promesses rejetées
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError(event.reason?.message || 'Promise rejetée', 'ui', {
    reason: event.reason
  });
});

// Initialiser avec les erreurs stockées
try {
  const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
  errorStore.push(...storedErrors.slice(0, 50));
} catch (e) {
  console.warn('Impossible de charger les erreurs stockées');
}

// Nettoyage automatique des vieilles erreurs (> 7 jours)
setInterval(() => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentErrors = errorStore.filter(err => err.timestamp > weekAgo);
  errorStore.length = 0;
  errorStore.push(...recentErrors);
}, 60 * 60 * 1000); // Chaque heure
