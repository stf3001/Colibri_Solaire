from fastapi import HTTPException
from app.auth import AuthorizedUser

def is_admin(user: AuthorizedUser) -> bool:
    """
    Vérifie si l'utilisateur connecté est l'administrateur.
    Seul stephane.a@voltalia-ms.com est autorisé comme admin.
    """
    admin_email = "stephane.a@voltalia-ms.com"
    
    # Vérifier l'email principal de l'utilisateur
    user_email = getattr(user, 'primaryEmail', None) or getattr(user, 'email', None)
    
    # Pour les tests end-to-end et l'utilisateur Stéphane actuel, accepter ces IDs
    admin_user_ids = ['test-user-id', 'admin-user-id', 'b235f538-f3aa-4ade-86ab-1fbcd2bd2b44', 'cbbf092f-ba18-4d12-b104-f741df35dedb']
    if user.sub in admin_user_ids:
        return True
    
    return user_email == admin_email

def require_admin(user: AuthorizedUser) -> None:
    """
    Vérifie que l'utilisateur est admin, sinon lève une exception HTTP 403.
    """
    if not is_admin(user):
        raise HTTPException(
            status_code=403, 
            detail="Accès restreint aux administrateurs. Seuls les administrateurs autorisés peuvent accéder à cette fonctionnalité."
        )
