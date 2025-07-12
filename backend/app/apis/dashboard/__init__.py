from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.libs.models import Lead, LeadStatus, UserProfile
from uuid import UUID
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# Pydantic models for the response
class DashboardStats(BaseModel):
    total_leads: int
    leads_submitted: int
    leads_visited: int
    leads_signed: int
    leads_installed: int

class DashboardResponse(BaseModel):
    user_profile: UserProfile
    stats: DashboardStats
    commission_balance: float
    recent_leads: list[Lead]

@router.get("/data", response_model=DashboardResponse)
async def get_dashboard_data(user: AuthorizedUser):
    """Get comprehensive dashboard data for the authenticated user"""
    
    # Parse user_id as UUID if needed
    user_id = user.sub
    if isinstance(user_id, str):
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            print(sanitize_log(f"Invalid UUID format for user_id: {user_id}"))
            raise HTTPException(status_code=400, detail="Format d'identifiant utilisateur invalide") from None
    else:
        try:
            user_uuid = UUID(user_id)
        except (ValueError, TypeError):
            print(sanitize_log(f"Invalid UUID format for user_id: {user_id}"))
            raise HTTPException(status_code=400, detail="Format d'identifiant utilisateur invalide") from None
    
    try:
        async with get_db_connection() as conn:
            # --- Fetch User Profile ---
            profile_row = await conn.fetchrow(
                "SELECT * FROM user_profiles WHERE user_id = $1", user_uuid
            )
            if not profile_row:
                # User has no profile - redirect to onboarding instead of creating default
                raise HTTPException(status_code=404, detail="Profil utilisateur non trouvé. Veuillez compléter votre onboarding.")
            user_profile = UserProfile.model_validate(dict(profile_row))

            # --- Fetch Lead Stats ---
            lead_stats_query = """
                SELECT 
                    status,
                    COUNT(*) as count
                FROM leads 
                WHERE user_id = $1 
                GROUP BY status
            """
            lead_stats_rows = await conn.fetch(lead_stats_query, user_uuid)

            # Convert to dictionary for easier access
            lead_stats_dict = {row['status']: row['count'] for row in lead_stats_rows}

            # Build stats with defaults for missing statuses
            stats = DashboardStats(
                total_leads=sum(lead_stats_dict.values()),
                leads_submitted=lead_stats_dict.get(LeadStatus.submitted.value, 0),
                leads_visited=lead_stats_dict.get(LeadStatus.visited.value, 0),
                leads_signed=lead_stats_dict.get(LeadStatus.signed.value, 0),
                leads_installed=lead_stats_dict.get(LeadStatus.installed.value, 0),
            )

            # --- Fetch Commission Balance ---
            commission_balance = await conn.fetchval(
                "SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE user_id = $1 AND status = 'pending'",
                user_uuid
            )

            # --- Fetch Recent Leads ---
            recent_leads_query = """
                SELECT * FROM leads 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 5
            """
            recent_leads_rows = await conn.fetch(recent_leads_query, user_uuid)
            recent_leads = [Lead.model_validate(dict(row)) for row in recent_leads_rows]

            return DashboardResponse(
                user_profile=user_profile,
                stats=stats,
                commission_balance=float(commission_balance) if commission_balance else 0.0,
                recent_leads=recent_leads,
            )
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_dashboard_data: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except HTTPException:
        # Re-raise HTTPException to preserve status code and detail
        raise
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_dashboard_data: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")
