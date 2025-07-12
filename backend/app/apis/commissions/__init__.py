from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from uuid import UUID
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error
from app.libs.rate_limiter import rate_limit_payment

router = APIRouter(prefix="/api/commissions", tags=["Commissions"])

class CommissionBalance(BaseModel):
    due_balance: float

@rate_limit_payment
@router.get("/balance", response_model=CommissionBalance)
async def get_commission_balance(user: AuthorizedUser, request: Request):
    """Get the pending commission balance for the authenticated user"""
    
    # Parse user_id as UUID
    user_id = user.sub
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        print(sanitize_log(f"Invalid UUID format for user_id"))
        raise HTTPException(status_code=400, detail="Format d'identifiant utilisateur invalide") from None
    
    try:
        async with get_db_connection() as conn:
            query = """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM commissions
                WHERE user_id = $1 AND status = 'pending'
            """
            
            balance = await conn.fetchval(query, user_uuid)
            
            return CommissionBalance(due_balance=float(balance))
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_commission_balance: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_commission_balance"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

@rate_limit_payment
@router.post("/request-payment")
async def request_payment(user: AuthorizedUser, request: Request):
    """Request payment for pending commissions"""
    
    # Parse user_id as UUID
    user_id = user.sub
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        print(sanitize_log(f"Invalid UUID format for user_id"))
        raise HTTPException(status_code=400, detail="Format d'identifiant utilisateur invalide") from None
    
    try:
        async with get_db_connection() as conn:
            # Calculate total pending commissions
            balance_query = "SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE user_id = $1 AND status = 'pending'"
            pending_amount = await conn.fetchval(balance_query, user_uuid)
            
            if pending_amount == 0:
                raise HTTPException(status_code=400, detail="No pending commissions to request payment for.")

            # Create a payment request
            insert_query = """
                INSERT INTO payment_requests (user_id, amount_requested, status, requested_at)
                VALUES ($1, $2, 'pending', NOW())
            """
            
            await conn.execute(insert_query, user_uuid, float(pending_amount))
            
            return Response(status_code=204)

    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in request_payment: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except HTTPException as e:
        # Re-raise HTTPException to preserve its status code and detail
        raise e
    except Exception as e:
        print(sanitize_log(f"Unexpected error in request_payment"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")
