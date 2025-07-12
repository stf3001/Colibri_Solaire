from fastapi import APIRouter
from fastapi.responses import JSONResponse
import json

router = APIRouter()

# Configuration du manifest PWA
# Version: 2024-07-02 - Icônes PNG corrigées
MANIFEST_DATA = {
    "name": "AmbassyApp - Partenaires Solaire",
    "short_name": "AmbassyApp",
    "description": "Application pour les apporteurs d'affaires dans le secteur solaire. Gérez vos prospects et commissions facilement.",
    "start_url": "/ambassadeurs/",
    "display": "standalone",
    "background_color": "#f97316",
    "theme_color": "#ea580c",
    "orientation": "portrait-primary",
    "scope": "/ambassadeurs/",
    "lang": "fr",
    "categories": ["business", "productivity", "utilities"],
    "screenshots": [],
    "icons": [
        {
            "src": "/routes/icon-72.png?v=2",
            "sizes": "72x72",
            "type": "image/png"
        },
        {
            "src": "/routes/icon-96.png?v=2",
            "sizes": "96x96",
            "type": "image/png"
        },
        {
            "src": "/routes/icon-128.png?v=2",
            "sizes": "128x128",
            "type": "image/png"
        },
        {
            "src": "/routes/icon-144.png?v=2",
            "sizes": "144x144",
            "type": "image/png"
        },
        {
            "src": "/routes/icon-152.png?v=2",
            "sizes": "152x152",
            "type": "image/png"
        },
        {
            "src": "/routes/icon-192.png?v=2",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/routes/icon-384.png?v=2",
            "sizes": "384x384",
            "type": "image/png"
        },
        {
            "src": "/routes/icon-512.png?v=2",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ],
    "shortcuts": [
        {
            "name": "Tableau de bord",
            "short_name": "Dashboard",
            "description": "Accéder directement au tableau de bord",
            "url": "/ambassadeurs/dashboard-page",
            "icons": [
                {
                    "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f97316' rx='18'/%3E%3Ccircle cx='48' cy='48' r='15' fill='%23fbbf24'/%3E%3C/svg%3E",
                    "sizes": "96x96"
                }
            ]
        },
        {
            "name": "Nouveau Lead",
            "short_name": "Lead",
            "description": "Ajouter un nouveau prospect",
            "url": "/ambassadeurs/lead-form",
            "icons": [
                {
                    "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f97316' rx='18'/%3E%3Ccircle cx='48' cy='48' r='15' fill='%23fbbf24'/%3E%3C/svg%3E",
                    "sizes": "96x96"
                }
            ]
        },
        {
            "name": "Mes Commissions",
            "short_name": "Commissions",
            "description": "Voir mes commissions et paiements",
            "url": "/ambassadeurs/commissions-page",
            "icons": [
                {
                    "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f97316' rx='18'/%3E%3Ccircle cx='48' cy='48' r='15' fill='%23fbbf24'/%3E%3C/svg%3E",
                    "sizes": "96x96"
                }
            ]
        }
    ]
}

@router.get("/manifest.json")
def get_manifest():
    """
    Endpoint pour servir le manifest PWA de l'application AmbassyApp.
    Permet aux navigateurs de détecter l'app comme installable.
    """
    return JSONResponse(
        content=MANIFEST_DATA,
        headers={
            "Content-Type": "application/manifest+json",
            "Cache-Control": "no-cache, no-store, must-revalidate",  # Force refresh
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@router.get("/sw.js")
def get_service_worker():
    """
    Endpoint pour servir le Service Worker JavaScript.
    Gère le cache et le fonctionnement hors ligne.
    """
    sw_content = '''
// Service Worker pour AmbassyApp PWA
const CACHE_NAME = 'ambassyapp-v4';
const STATIC_CACHE_NAME = 'ambassyapp-static-v4';
const API_CACHE_NAME = 'ambassyapp-api-v4';

// Ressources à mettre en cache immédiatement
const STATIC_RESOURCES = [
  '/ambassadeurs/',
  '/ambassadeurs/dashboard-page',
  '/ambassadeurs/lead-form',
  '/ambassadeurs/commissions-page',
  '/ambassadeurs/guide-parrainage-page'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('☀️ Service Worker: Installation...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('☀️ Service Worker: Mise en cache des ressources statiques');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('☀️ Service Worker: Activation...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation terminée');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'activation:', error);
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
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
  
  // Pour tout le reste, stratégie réseau en premier
  event.respondWith(networkFirstStrategy(request));
});

// Stratégie Cache First (pour les ressources statiques)
async function cacheFirstStrategy(request) {
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
async function networkFirstStrategy(request) {
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
function getOfflineFallback() {
  return new Response(`
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
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('☀️ AmbassyApp Service Worker chargé');
'''
    
    from fastapi.responses import Response
    return Response(
        content=sw_content,
        media_type="application/javascript",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# Routes pour remplacer les fichiers .ico par défaut
@router.get("/light.ico")
def get_light_ico():
    """Retourne l'icône soleil en format ICO pour le thème clair."""
    import base64
    from fastapi.responses import Response
    
    # Contenu ICO simple avec notre soleil (format 16x16)
    # Il s'agit d'un ICO orange/jaune basique représentant le soleil
    ico_content = base64.b64decode(
        'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAABILAAASCwAA'
        'AAAAAAAAAAAAAAAA////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//'
        '/wD///8A////AP///wD///8A////AP///wD///8A////AP7+/gGw1JEg8fHwgvHx8IL+/v4B'
        '////AP///wD///8A////AP///wD///8A////AP///wD///8A/v7+AbDUkSDx8fCC8fHwgvHx'
        '8IL+/v4B////AP///wD///8A////AP///wD///8A////APDw8IDw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8IDw8PCA////AP///wD///8A////AP///wDw8PCA8PDwh/Dw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCA////AP///wD///8A////APDw8Ifw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH////AP///wDw8PCA8PDwh/Dw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCA////APDw8Ifw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH////APDw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH////AP///wDw8PCA'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8IcA////AP///wD/'
        '//8A8PDwgPDw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8IDw8PCA////AP///wD///8A////'
        'AP///wD///8A/v7+AbDUkSDx8fCC8fHwgvHx8IL+/v4B////AP///wD///8A////AP///wD/'
        '//8A////AP///wD///8A/v7+AbDUkSDx8fCC8fHwgv7+/gH///8A////AP///wD///8A////'
        'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/'
        '//8A////AP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
    )
    
    return Response(
        content=ico_content,
        media_type="image/vnd.microsoft.icon",
        headers={
            "Cache-Control": "public, max-age=86400",  # 1 jour
        }
    )


@router.get("/dark.ico")
def get_dark_ico():
    """Retourne l'icône soleil en format ICO pour le thème sombre."""
    # Même icône que pour le thème clair (notre soleil)
    return get_light_ico()
