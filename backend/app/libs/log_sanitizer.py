"""
Module de sanitisation des logs pour protéger les données sensibles.
Masque automatiquement les informations critiques selon l'environnement.
"""

import re
from typing import Any, Dict, Optional
from app.env import Mode, mode

class LogSanitizer:
    """
    Sanitise les logs en masquant les données sensibles selon l'environnement.
    
    Niveaux de sanitisation :
    - PRODUCTION : Masquage maximum, pas de stack traces détaillées
    - DEVELOPMENT : Logs complets pour debugging
    """
    
    # Patterns pour identifier les données sensibles
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    UUID_PATTERN = re.compile(r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b')
    PHONE_PATTERN = re.compile(r'\+?[0-9]{8,15}')
    TOKEN_PATTERN = re.compile(r'\b[A-Za-z0-9]{20,}\b')
    PATH_PATTERN = re.compile(r'/[^\s]*(?:venv|build|site-packages|user-venvs)[^\s]*')
    
    @classmethod
    def is_production(cls) -> bool:
        """Vérifie si on est en environnement de production"""
        return mode == Mode.PROD
    
    @classmethod
    def mask_email(cls, email: str) -> str:
        """
        Masque partiellement un email.
        Exemple: john.doe@example.com → j***@ex***
        """
        if '@' not in email:
            return email
            
        local, domain = email.split('@', 1)
        if '.' in domain:
            domain_name, domain_ext = domain.rsplit('.', 1)
            masked_local = local[0] + '***' if len(local) > 1 else '***'
            masked_domain = domain_name[:2] + '***' if len(domain_name) > 2 else '***'
            return f"{masked_local}@{masked_domain}.{domain_ext}"
        else:
            masked_local = local[0] + '***' if len(local) > 1 else '***'
            masked_domain = domain[:2] + '***' if len(domain) > 2 else '***'
            return f"{masked_local}@{masked_domain}"
    
    @classmethod
    def mask_uuid(cls, uuid_str: str) -> str:
        """
        Masque partiellement un UUID.
        Exemple: cbbf092f-ba18-4d12-b104-f741df35dedb → cbbf***-***-***-***-***dedb
        """
        if len(uuid_str) < 8:
            return '***'
        return f"{uuid_str[:4]}***-***-***-***-***{uuid_str[-4:]}"
    
    @classmethod
    def mask_phone(cls, phone: str) -> str:
        """
        Masque partiellement un numéro de téléphone.
        Exemple: +33123456789 → +33***789
        """
        if len(phone) < 6:
            return '***'
        if phone.startswith('+'):
            return f"{phone[:3]}***{phone[-3:]}"
        else:
            return f"{phone[:2]}***{phone[-3:]}"
    
    @classmethod
    def mask_token(cls, token: str) -> str:
        """
        Masque partiellement un token.
        Exemple: abc123def456 → abc***456
        """
        if len(token) < 6:
            return '***'
        return f"{token[:3]}***{token[-3:]}"
    
    @classmethod
    def sanitize_stack_trace(cls, message: str) -> str:
        """
        Sanitise les stack traces en supprimant les chemins sensibles.
        """
        if not cls.is_production():
            # En développement, garder les traces complètes
            return message
            
        # En production, masquer les chemins sensibles
        sanitized = cls.PATH_PATTERN.sub('/***/', message)
        
        # Supprimer les lignes de stack trace détaillées
        lines = sanitized.split('\n')
        filtered_lines = []
        
        for line in lines:
            # Garder seulement les messages d'erreur, pas les chemins de fichiers
            if not any(keyword in line.lower() for keyword in [
                'traceback', 'file "/', 'line ', '  at ', 'in <module>'
            ]):
                filtered_lines.append(line)
        
        return '\n'.join(filtered_lines)
    
    @classmethod
    def sanitize_message(cls, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Sanitise un message de log en masquant toutes les données sensibles.
        
        Args:
            message: Le message à sanitiser
            context: Contexte optionnel pour des règles spécifiques
            
        Returns:
            Message sanitisé selon l'environnement
        """
        if not cls.is_production():
            # En développement, logs complets
            return message
            
        sanitized = message
        
        # Masquer les emails
        emails = cls.EMAIL_PATTERN.findall(sanitized)
        for email in emails:
            masked = cls.mask_email(email)
            sanitized = sanitized.replace(email, masked)
        
        # Masquer les UUIDs
        uuids = cls.UUID_PATTERN.findall(sanitized)
        for uuid_str in uuids:
            masked = cls.mask_uuid(uuid_str)
            sanitized = sanitized.replace(uuid_str, masked)
        
        # Masquer les téléphones
        phones = cls.PHONE_PATTERN.findall(sanitized)
        for phone in phones:
            if len(phone) >= 8:  # Éviter de masquer les codes courts
                masked = cls.mask_phone(phone)
                sanitized = sanitized.replace(phone, masked)
        
        # Masquer les tokens longs
        tokens = cls.TOKEN_PATTERN.findall(sanitized)
        for token in tokens:
            if len(token) >= 20:  # Seulement les tokens longs
                masked = cls.mask_token(token)
                sanitized = sanitized.replace(token, masked)
        
        # Sanitiser les stack traces
        sanitized = cls.sanitize_stack_trace(sanitized)
        
        return sanitized
    
    @classmethod
    def sanitize_auth_log(cls, user_id: str, action: str) -> str:
        """
        Crée un log d'authentification sanitisé.
        
        Args:
            user_id: ID de l'utilisateur
            action: Action effectuée
            
        Returns:
            Message de log sanitisé
        """
        if cls.is_production():
            # En production, masquer l'UUID complet
            masked_id = cls.mask_uuid(user_id) if cls.UUID_PATTERN.match(user_id) else '***'
            return f"User {masked_id} {action}"
        else:
            # En développement, garder l'UUID complet
            return f"User {user_id} {action}"
    
    @classmethod
    def sanitize_database_error(cls, error_message: str) -> str:
        """
        Sanitise les erreurs de base de données.
        
        Args:
            error_message: Message d'erreur original
            
        Returns:
            Message d'erreur sanitisé
        """
        if cls.is_production():
            # En production, messages génériques
            if 'connection' in error_message.lower():
                return "Database connection error"
            elif 'authentication' in error_message.lower():
                return "Database authentication error"
            elif 'permission' in error_message.lower():
                return "Database permission error"
            else:
                return "Database operation error"
        else:
            # En développement, garder les détails
            return cls.sanitize_message(error_message)


# Fonctions utilitaires pour usage direct
def sanitize_log(message: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Fonction utilitaire pour sanitiser un log"""
    return LogSanitizer.sanitize_message(message, context)

def sanitize_auth_log(user_id: str, action: str) -> str:
    """Fonction utilitaire pour les logs d'authentification"""
    return LogSanitizer.sanitize_auth_log(user_id, action)

def sanitize_db_error(error_message: str) -> str:
    """Fonction utilitaire pour les erreurs de base de données"""
    return LogSanitizer.sanitize_database_error(error_message)
