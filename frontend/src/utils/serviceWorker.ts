
// Service Worker pour la PWA AmbassyApp
// Gère le cache et le fonctionnement hors ligne

const CACHE_NAME = 'ambassyapp-v4';
const STATIC_CACHE_NAME = 'ambassyapp-static-v4';
const API_CACHE_NAME = 'ambassyapp-api-v4';

// Ressources à mettre en cache immédiatement
const STATIC_RESOURCES = [
  '/ambassadeurs/',
  '/ambassadeurs/dashboard-page',
  '/ambassadeurs/lead-form',
  '/ambassadeurs/commissions-page',
  '/ambassadeurs/guide-parrainage',
];

// Installation du Service Worker
if (typeof self !== 'undefined') {
  self.addEventListener('install', (event) => {
    console.log('☀️ PWA: Service Worker installation v4');

    event.waitUntil(
      caches
        .open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('☀️ PWA: Cache des ressources statiques');
          // Ajouter les ressources une par une pour éviter les erreurs de batch
          return Promise.allSettled(
            STATIC_RESOURCES.map(resource => 
              cache.add(resource).catch(err => {
                console.warn(`⚠️ PWA: Impossible de cacher ${resource}:`, err.message);
                return null;
              })
            )
          );
        })
        .then(() => {
          console.log('✅ PWA: Installation terminée');
          return self.skipWaiting();
        })
        .catch((error) => {
          console.warn('⚠️ PWA: Erreur installation (non-bloquante):', error.message);
          // Ne pas bloquer l'installation même en cas d'erreur
          return self.skipWaiting();
        })
    );
  });

  // Activation du Service Worker
  self.addEventListener('activate', (event) => {
    console.log('☀️ PWA: Activation Service Worker v4');

    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (
                !cacheName.includes('v4') &&
                (cacheName.includes('ambassyapp') || cacheName.includes('CACHE'))
              ) {
                console.log('🗑️ PWA: Suppression ancien cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          console.log('✅ PWA: Activation terminée');
          return self.clients.claim();
        })
        .catch((error) => {
          console.warn('⚠️ PWA: Erreur activation (non-bloquante):', error.message);
        })
    );
  });

  // Interception des requêtes réseau
  self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Ignorer les requêtes non-HTTP et Chrome extensions
    if (!request.url.startsWith('http') || request.url.startsWith('chrome-extension://')) {
      return;
    }

    // Ignorer les requêtes de Stack Auth externes
    if (url.hostname.includes('stack-auth') || url.hostname.includes('googleapis')) {
      return;
    }

    // Stratégie pour les API
    if (url.pathname.includes('/api/') || url.pathname.includes('/routes/')) {
      event.respondWith(networkFirstStrategy(request));
      return;
    }

    // Stratégie pour les ressources statiques
    if (url.pathname.startsWith('/ambassadeurs/')) {
      event.respondWith(cacheFirstStrategy(request));
      return;
    }

    // Pour tout le reste, réseau sans cache
    event.respondWith(fetch(request));
  });

  // Gestion des messages du client
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
}

// Stratégie Cache First (pour les ressources statiques)
async function cacheFirstStrategy(request: Request): Promise<Response> {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('📦 Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('🌐 Cache miss, récupération réseau:', request.url);
    const networkResponse = await fetch(request);

    // Mettre en cache la réponse si elle est valide
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('❌ Erreur cache first:', error);

    // Retourner une page hors ligne basique
    if (request.mode === 'navigate') {
      return getOfflineFallback();
    }

    throw error;
  }
}

// Stratégie Network First (pour les API)
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    console.log('🌐 Network first:', request.url);
    const networkResponse = await fetch(request);

    // Mettre en cache les réponses API réussies
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('📦 Fallback cache pour:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    console.error('❌ Erreur network first:', error);
    throw error;
  }
}

// Page de fallback hors ligne
function getOfflineFallback(): Response {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>AmbassyApp - Hors ligne</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .container {
            max-width: 400px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          .sun {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }
          p {
            margin: 0;
            opacity: 0.9;
            line-height: 1.5;
          }
          .retry {
            margin-top: 2rem;
            padding: 12px 24px;
            background: white;
            color: #ea580c;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="sun">☀️</div>
          <h1>AmbassyApp</h1>
          <p>Vous êtes actuellement hors ligne.<br>
          Certaines fonctionnalités peuvent être limitées.</p>
          <button class="retry" onclick="window.location.reload()">Réessayer</button>
        </div>
      </body>
    </html>
  `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

console.log('☀️ AmbassyApp Service Worker chargé');

// Export pour les types
export {};
