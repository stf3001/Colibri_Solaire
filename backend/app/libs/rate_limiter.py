from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request, HTTPException
from app.env import Mode, mode
import databutton as db
from app.libs.log_sanitizer import sanitize_log
from typing import Callable, Union
from functools import wraps

# Configuration des limites par type d'endpoint
RATE_LIMITS = {
    # Endpoints sensibles d'administration
    "admin": "500/minute",
    "admin_strict": "100/minute",
    
    # Endpoints d'authentification (protection bruteforce)
    "auth": "20/minute", 
    "auth_strict": "5/minute",
    
    # Endpoints de soumission de leads (protection spam)
    "leads_submit": "10/minute",
    "leads_general": "100/minute",
    
    # Endpoints de messaging (anti-spam)
    "messaging": "30/minute",
    "messaging_admin": "200/minute",
    
    # Endpoints publics standard
    "public": "200/minute",
    "public_heavy": "50/minute",
    
    # Endpoints de paiement/commissions (critiques)
    "payment": "20/minute",
    
    # Contrats et documents
    "contracts": "50/minute"
}

def get_rate_limiter_key_func(request: Request) -> str:
    """
    Détermine la clé pour le rate limiting.
    Utilise l'IP du client et potentiellement l'ID utilisateur.
    """
    client_ip = get_remote_address(request)
    
    # Si utilisateur authentifié, on peut combiner IP + user_id pour plus de granularité
    user_id = getattr(request.state, 'user_id', None) if hasattr(request, 'state') else None
    
    if user_id:
        # Format: IP:USER_ID pour utilisateurs authentifiés
        return f"{client_ip}:{user_id}"
    else:
        # Format: IP seulement pour utilisateurs anonymes
        return client_ip

def get_redis_url() -> Union[str, None]:
    """
    Récupère l'URL Redis selon l'environnement.
    """
    if mode == Mode.PROD:
        # En production, utiliser Redis externe si disponible
        redis_url = db.secrets.get("REDIS_URL")
        if redis_url:
            return redis_url
        # Fallback: Redis local en production
        return "redis://localhost:6379/0"
    else:
        # En développement, utiliser le stockage en mémoire pour simplicité
        return None

# Création du limiter principal
try:
    redis_url = get_redis_url()
    if redis_url:
        limiter = Limiter(
            key_func=get_rate_limiter_key_func,
            storage_uri=redis_url,
            default_limits=["1000/minute"]  # Limite globale de sécurité
        )
        print(sanitize_log(f"Rate limiter initialized with Redis backend"))
    else:
        # Fallback: stockage en mémoire pour développement
        limiter = Limiter(
            key_func=get_rate_limiter_key_func,
            default_limits=["1000/minute"]
        )
        print(sanitize_log(f"Rate limiter initialized with memory backend (dev mode)"))
except Exception as e:
    # Fallback de sécurité: stockage en mémoire
    limiter = Limiter(
        key_func=get_rate_limiter_key_func,
        default_limits=["1000/minute"]
    )
    print(sanitize_log(f"Rate limiter fallback to memory backend due to Redis connection issue"))

def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Gestionnaire personnalisé pour les erreurs de rate limiting.
    Retourne une réponse HTTP 429 avec message informatif.
    """
    # Log de l'incident (sanitisé)
    client_ip = get_remote_address(request)
    print(sanitize_log(f"Rate limit exceeded for client from endpoint {request.url.path}"))
    
    # Message utilisateur clair
    response = {
        "detail": f"Trop de requêtes. Limite: {exc.detail}. Veuillez patienter avant de réessayer.",
        "error_code": "RATE_LIMIT_EXCEEDED",
        "retry_after": 60  # Suggérer d'attendre 60 secondes
    }
    
    raise HTTPException(
        status_code=429,
        detail=response["detail"],
        headers={"Retry-After": "60"}
    )

# Décorateurs de convenance pour les différents types d'endpoints
def rate_limit_admin(func: Callable) -> Callable:
    """Décorateur pour endpoints admin - limites élevées"""
    return limiter.limit(RATE_LIMITS["admin"])(func)

def rate_limit_admin_strict(func: Callable) -> Callable:
    """Décorateur pour endpoints admin critiques - limites strictes"""
    return limiter.limit(RATE_LIMITS["admin_strict"])(func)

def rate_limit_auth(func: Callable) -> Callable:
    """Décorateur pour endpoints d'authentification"""
    return limiter.limit(RATE_LIMITS["auth"])(func)

def rate_limit_auth_strict(func: Callable) -> Callable:
    """Décorateur pour login/signup - protection bruteforce"""
    return limiter.limit(RATE_LIMITS["auth_strict"])(func)

def rate_limit_leads_submit(func: Callable) -> Callable:
    """Décorateur pour soumission de leads - anti-spam"""
    return limiter.limit(RATE_LIMITS["leads_submit"])(func)

def rate_limit_messaging(func: Callable) -> Callable:
    """Décorateur pour endpoints de messaging"""
    return limiter.limit(RATE_LIMITS["messaging"])(func)

def rate_limit_public(func: Callable) -> Callable:
    """Décorateur pour endpoints publics standard"""
    return limiter.limit(RATE_LIMITS["public"])(func)

def rate_limit_payment(func: Callable) -> Callable:
    """Décorateur pour endpoints de paiement/commissions"""
    return limiter.limit(RATE_LIMITS["payment"])(func)

def rate_limit_contracts(func: Callable) -> Callable:
    """Décorateur pour endpoints de contrats"""
    return limiter.limit(RATE_LIMITS["contracts"])(func)

# Export des objets principaux
__all__ = [
    "limiter",
    "custom_rate_limit_exceeded_handler",
    "rate_limit_admin",
    "rate_limit_admin_strict", 
    "rate_limit_auth",
    "rate_limit_auth_strict",
    "rate_limit_leads_submit",
    "rate_limit_messaging",
    "rate_limit_public",
    "rate_limit_payment",
    "rate_limit_contracts",
    "RATE_LIMITS"
]
