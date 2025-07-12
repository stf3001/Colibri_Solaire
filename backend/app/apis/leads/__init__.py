from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from datetime import datetime
from app.libs.models import Lead, CommissionStatus
from uuid import UUID
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error
from app.libs.rate_limiter import rate_limit_leads_submit, rate_limit_public

router = APIRouter(prefix="/api/leads", tags=["Leads"])

class CreateLeadRequest(BaseModel):
    prospect_name: str
    prospect_phone: str
    prospect_email: str
    prospect_city: str | None = None
    notes: str | None = None

class LeadDetails(Lead):
    commission_status: CommissionStatus | None = None

@rate_limit_leads_submit
@router.post("/submit", status_code=201)
async def submit_lead(lead_data: CreateLeadRequest, user: AuthorizedUser, request: Request):
    """
    Submits a new lead for the authenticated user.
    """
    user_id = user.sub
    
    # Use UUID mapping for test users
    from app.libs.uuid_mapping import get_user_uuid
    user_uuid = get_user_uuid(user_id)
    
    try:
        async with get_db_connection() as conn:
            # Vérifier le type d'utilisateur et la limite pour les particuliers
            user_info = await conn.fetchrow(
                "SELECT user_type FROM user_profiles WHERE user_id = $1",
                user_uuid
            )
            
            if not user_info:
                raise HTTPException(status_code=404, detail="Profil utilisateur introuvable")
            
            # Blocage pour les particuliers : max 5 parrainages par an
            if user_info['user_type'] == 'particulier':
                # Calculer les leads cette année civile
                current_year = datetime.utcnow().year
                
                # Compter les leads déjà créés cette année
                existing_leads_count = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM leads 
                    WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
                    """,
                    user_uuid,
                    current_year
                )
                
                if existing_leads_count >= 5:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Limite annuelle atteinte (5/5). Prochains parrainages possibles en {current_year + 1}"
                    )
            
            # Insert the new lead into the database
            await conn.execute(
                """
                INSERT INTO leads (user_id, prospect_name, prospect_phone, prospect_email, prospect_city, notes, gdpr_consent_date, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'soumis')
                """,
                user_uuid,
                lead_data.prospect_name,
                lead_data.prospect_phone,
                lead_data.prospect_email,
                lead_data.prospect_city,
                lead_data.notes,
                datetime.utcnow()
            )
            
            return {"message": "Lead submitted successfully"}
        
    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        print(sanitize_log(f"Database error in submit_lead: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in submit_lead: {e}"))
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@rate_limit_public
@router.get("", response_model=list[LeadDetails])
async def get_all_leads(user: AuthorizedUser, request: Request):
    """
    Fetches all leads for the authenticated user, ordered by creation date.
    Includes commission status for 'installed' leads.
    """
    user_id = user.sub
    
    # Validate UUID format
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        print(sanitize_log(f"Invalid UUID format for user_id: {user_id}"))
        raise HTTPException(status_code=400, detail="Format d'identifiant utilisateur invalide") from None
    
    try:
        conn = await get_db_connection()
        query = """
            SELECT 
                l.*, 
                c.status as commission_status
            FROM leads l
            LEFT JOIN commissions c ON l.id = c.lead_id
            WHERE l.user_id = $1
            ORDER BY l.created_at DESC
        """
        
        rows = await conn.fetch(query, user_uuid)
        
        return [LeadDetails.model_validate(dict(row)) for row in rows]

    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_all_leads: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_all_leads"))
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching leads: {str(e)}")
