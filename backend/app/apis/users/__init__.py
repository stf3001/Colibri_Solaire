from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.libs.models import UserType
from uuid import UUID
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error

router = APIRouter()

# Modèles pour les requêtes/réponses
class CreateUserProfileRequest(BaseModel):
    """Request model for creating a user profile."""
    full_name: str
    user_type: UserType
    phone: str
    email: str
    city: str = "Non renseigné"
    gdpr_consent: bool

class CreateUserProfileResponse(BaseModel):
    success: bool
    message: str
    user_id: str

class ProfileCheckResponse(BaseModel):
    is_complete: bool
    missing_fields: list[str]
    user_profile: dict | None = None

def get_user_uuid(user_id: str) -> str:
    """Map user_id to UUID if needed"""
    # Pour la démonstration, utilisons un mapping simple
    # En production, ceci devrait être dans une table de mapping
    if user_id == "test-user-id":
        return "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    return user_id

@router.post("/profile", response_model=CreateUserProfileResponse)
async def create_user_profile(request: CreateUserProfileRequest, user: AuthorizedUser):
    """
    Creates a user profile in the database after successful registration.
    This endpoint is called right after Stack Auth account creation.
    """
    user_id = user.sub

    if not request.gdpr_consent:
        raise HTTPException(status_code=400, detail="Le consentement RGPD est obligatoire")

    # Essayer d'abord avec l'user_id direct (UUID valide)
    try:
        user_param = UUID(user_id)
    except ValueError:
        # Si l'UUID est invalide, essayer de mapper l'user_id
        user_uuid = get_user_uuid(user_id)
        user_param = UUID(user_uuid)

    conn = None
    try:
        conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

        # Vérifier si le profil existe déjà
        existing_profile = await conn.fetchrow(
            "SELECT user_id FROM user_profiles WHERE user_id = $1",
            user_param
        )

        if existing_profile:
            raise HTTPException(status_code=409, detail="Un profil existe déjà pour cet utilisateur")

        # Créer le profil utilisateur
        await conn.execute(
            """
            INSERT INTO user_profiles (user_id, full_name, user_type, phone, email, city, gdpr_consent_date, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
            """,
            user_param,
            request.full_name,
            request.user_type.value,
            request.phone,
            request.email,
            request.city
        )

        return CreateUserProfileResponse(
            success=True,
            message="Profil créé avec succès",
            user_id=str(user_param)
        )

    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=409, detail="Un profil existe déjà pour cet utilisateur")
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in create_user_profile: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in create_user_profile"))
        raise HTTPException(status_code=500, detail="Erreur lors de la création du profil")
    finally:
        if conn:
            await conn.close()

@router.get("/profile/check", response_model=ProfileCheckResponse)
async def check_profile_completion(user: AuthorizedUser):
    """
    Checks if the user has completed their profile setup.
    Returns profile status and missing fields if incomplete.
    """
    user_id = user.sub

    # Essayer d'abord avec l'user_id direct (UUID valide)
    try:
        user_param = UUID(user_id)
    except ValueError:
        # Si l'UUID est invalide, essayer de mapper l'user_id
        user_uuid = get_user_uuid(user_id)
        if not user_uuid:
            return ProfileCheckResponse(
                is_complete=False,
                missing_fields=["invalid_user_id"]
            )
        user_param = UUID(user_uuid)

    conn = None
    try:
        conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

        # Vérifier si le profil existe
        profile_row = await conn.fetchrow(
            "SELECT * FROM user_profiles WHERE user_id = $1",
            user_param
        )

        if not profile_row:
            return ProfileCheckResponse(
                is_complete=False,
                missing_fields=["profile_not_created"],
                user_profile=None
            )

        # Convertir le Row en dict
        profile_dict = dict(profile_row)
        
        # Vérifier les champs requis
        required_fields = ['full_name', 'user_type', 'phone', 'email']
        missing_fields = []
        
        for field in required_fields:
            if not profile_dict.get(field):
                missing_fields.append(field)
        
        # Vérifier le consentement RGPD
        if not profile_dict.get('gdpr_consent_date'):
            missing_fields.append('gdpr_consent')
        
        is_complete = len(missing_fields) == 0
        
        return ProfileCheckResponse(
            is_complete=is_complete,
            missing_fields=missing_fields,
            user_profile=profile_dict if is_complete else None
        )
        
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in check_profile_completion: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in check_profile_completion"))
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du profil")
    finally:
        if conn:
            await conn.close()
