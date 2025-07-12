from fastapi import FastAPI, Request, HTTPException
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.libs.rate_limiter import limiter, custom_rate_limit_exceeded_handler
from app.libs.log_sanitizer import sanitize_log

def setup_rate_limiting_middleware(app: FastAPI) -> None:
    """
    Configure le middleware de rate limiting pour l'application FastAPI.
    
    Args:
        app: Instance FastAPI à configurer
    """
    try:
        # Ajouter le middleware SlowAPI
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)
        
        # Le middleware sera automatiquement utilisé par les décorateurs @limiter.limit
        print(sanitize_log("Rate limiting middleware configured successfully"))
        
    except Exception as e:
        print(sanitize_log("Failed to configure rate limiting middleware"))
        # Ne pas faire planter l'application si le rate limiting échoue
        pass

def get_client_identifier(request: Request) -> str:
    """
    Extrait un identifiant unique du client pour le rate limiting.
    
    Args:
        request: Requête FastAPI
        
    Returns:
        Identifiant unique du client (IP + user_id si authentifié)
    """
    # Récupérer l'IP du client
    client_ip = request.client.host if request.client else "unknown"
    
    # Si l'utilisateur est authentifié, ajouter son ID
    user_id = getattr(request.state, 'user_id', None) if hasattr(request, 'state') else None
    
    if user_id:
        return f"{client_ip}:{user_id}"
    else:
        return client_ip

# Middleware personnalisé pour surveillance des patterns suspects
class RateLimitMonitoringMiddleware:
    """
    Middleware pour surveiller les patterns suspects de rate limiting.
    """
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.suspicious_attempts = {}  # Stockage temporaire des tentatives suspectes
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Surveiller les patterns suspects avant traitement
            await self._monitor_request_pattern(request)
        
        await self.app(scope, receive, send)
    
    async def _monitor_request_pattern(self, request: Request):
        """
        Surveille les patterns de requêtes potentiellement suspects.
        """
        client_id = get_client_identifier(request)
        endpoint = request.url.path
        
        # Patterns suspects à surveiller:
        # 1. Requêtes répétées vers endpoints sensibles
        # 2. Balayage d'endpoints (scanning)
        # 3. Tentatives de bruteforce
        
        suspicious_endpoints = [
            "/api/admin/",
            "/api/auth/", 
            "/api/leads/submit",
            "/api/messaging/"
        ]
        
        if any(endpoint.startswith(sus_ep) for sus_ep in suspicious_endpoints):
            # Log pattern suspect (sans exposer d'infos sensibles)
            print(sanitize_log(f"Monitoring request to sensitive endpoint: {endpoint}"))

__all__ = [
    "setup_rate_limiting_middleware",
    "get_client_identifier",
    "RateLimitMonitoringMiddleware"
]
