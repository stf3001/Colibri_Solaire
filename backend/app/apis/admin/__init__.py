from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.libs.models import UserProfile, Lead, LeadStatus
from app.libs.auth_utils import require_admin
from datetime import datetime
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error
from fastapi import Query
from app.libs.database_pool import get_db_connection

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class UpdateLeadStatusRequest(BaseModel):
    lead_id: int
    new_status: LeadStatus
    amount_ht: float | None = None  # Obligatoire si new_status = 'installé' ET user_type = 'professionnel'

class AdminStatsResponse(BaseModel):
    total_users: int
    total_leads: int
    total_commissions_paid: float
    pending_commission_requests: int
    anniversary_alerts: int  # Nombre d'utilisateurs avec paiements anniversaire à traiter

class AnniversaryAlertResponse(BaseModel):
    user_id: str
    full_name: str
    anniversary_date: datetime
    vouchers_pending: float
    days_until_anniversary: int
    referral_count: int

class SendPrivateMessageRequest(BaseModel):
    user_id: str
    subject: str
    content: str

class UserStatsResponse(BaseModel):
    user_id: str
    full_name: str
    user_type: str
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    created_at: datetime
    total_leads: int
    pending_commissions: float
    paid_commissions: float
    last_activity: datetime | None

class DeleteUserRequest(BaseModel):
    user_id: str
    confirm_deletion: bool

class RequestPaymentForUserRequest(BaseModel):
    user_id: str

class RequestPaymentForUserResponse(BaseModel):
    success: bool
    amount_requested: float
    message: str

class UserDetailsResponse(BaseModel):
    user_profile: dict
    leads: list[dict]
    commissions: list[dict]
    payments: list[dict]
    messages: list[dict]

class PaymentRequestResponse(BaseModel):
    id: int
    user_id: str
    apporteur_name: str
    amount_requested: float
    status: str
    requested_at: datetime
    processed_at: datetime | None

class ProcessPaymentRequest(BaseModel):
    payment_id: int
    payment_method: str  # 'virement' ou 'bon_dachat'
    payment_date: datetime | None = None

# ============= ENDPOINTS ADMIN POUR GÉRER LES LEADS =============

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(user: AuthorizedUser):
    """
    Récupère les statistiques générales pour l'admin.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Statistiques générales
            total_users = await conn.fetchval("SELECT COUNT(*) FROM user_profiles")
            total_leads = await conn.fetchval("SELECT COUNT(*) FROM leads")
            total_commissions_paid = await conn.fetchval(
                "SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE status = 'paid'"
            )
            pending_requests = await conn.fetchval(
                "SELECT COUNT(*) FROM payments WHERE status = 'requested'"
            )
            
            # Compter les alertes anniversaire (utilisateurs particuliers avec bons d'achat en attente)
            anniversary_alerts = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT up.user_id)
                FROM user_profiles up
                JOIN commissions c ON up.user_id = c.user_id
                WHERE up.user_type = 'particulier'
                AND c.status = 'pending'
                AND c.type = 'bon_achat'
                AND (CURRENT_DATE - up.created_at::date) % 365 >= 350
                """
            )
            
            return AdminStatsResponse(
                total_users=total_users or 0,
                total_leads=total_leads or 0,
                total_commissions_paid=float(total_commissions_paid or 0),
                pending_commission_requests=pending_requests or 0,
                anniversary_alerts=anniversary_alerts or 0
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")

# ============= ENDPOINTS GESTION UTILISATEURS =============

@router.get("/user-details/{user_id}", response_model=UserDetailsResponse)
async def get_user_details(user_id: str, user: AuthorizedUser):
    """
    Récupère tous les détails d'un utilisateur pour l'admin.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Profil utilisateur
            user_profile = await conn.fetchrow(
                "SELECT * FROM user_profiles WHERE user_id = $1",
                user_id
            )
            
            if not user_profile:
                raise HTTPException(status_code=404, detail="Utilisateur introuvable")
            
            # Leads de l'utilisateur
            leads = await conn.fetch(
                "SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC",
                user_id
            )
            
            # Commissions de l'utilisateur
            commissions = await conn.fetch(
                "SELECT * FROM commissions WHERE user_id = $1 ORDER BY created_at DESC",
                user_id
            )
            
            # Demandes de paiement
            payments = await conn.fetch(
                "SELECT * FROM payments WHERE user_id = $1 ORDER BY requested_at DESC",
                user_id
            )
            
            # Messages
            messages = await conn.fetch(
                "SELECT * FROM messages WHERE recipient_id = $1 ORDER BY created_at DESC",
                user_id
            )
            
            return UserDetailsResponse(
                user_profile=dict(user_profile),
                leads=[dict(lead) for lead in leads],
                commissions=[dict(commission) for commission in commissions],
                payments=[dict(payment) for payment in payments],
                messages=[dict(message) for message in messages]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des détails: {str(e)}")

@router.delete("/delete-user")
async def delete_user(request: DeleteUserRequest, user: AuthorizedUser):
    """
    Supprime complètement un utilisateur et toutes ses données.
    ATTENTION: Action irréversible !
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    
    if not request.confirm_deletion:
        raise HTTPException(status_code=400, detail="Confirmation de suppression requise")
    
    try:
        async with get_db_connection() as conn:
            # Vérifier que l'utilisateur existe
            user_exists = await conn.fetchval(
                "SELECT user_id FROM user_profiles WHERE user_id = $1",
                request.user_id
            )
            
            if not user_exists:
                raise HTTPException(status_code=404, detail="Utilisateur introuvable")
            
            # Récupérer le nom avant suppression pour le log
            user_info = await conn.fetchrow(
                "SELECT full_name, user_type FROM user_profiles WHERE user_id = $1",
                request.user_id
            )
            
            # Supprimer en cascade (dans l'ordre des dépendances)
            # 1. Messages
            await conn.execute(
                "DELETE FROM messages WHERE sender_id = $1 OR recipient_id = $1",
                request.user_id
            )
            
            # 2. Commissions
            await conn.execute(
                "DELETE FROM commissions WHERE user_id = $1",
                request.user_id
            )
            
            # 3. Demandes de paiement
            await conn.execute(
                "DELETE FROM payments WHERE user_id = $1",
                request.user_id
            )
            
            # 4. Leads
            await conn.execute(
                "DELETE FROM leads WHERE user_id = $1",
                request.user_id
            )
            
            # 5. Profil utilisateur
            await conn.execute(
                "DELETE FROM user_profiles WHERE user_id = $1",
                request.user_id
            )
            
            return {
                "message": f"Utilisateur {user_info['full_name']} ({user_info['user_type']}) supprimé avec succès",
                "deleted_user": {
                    "user_id": request.user_id,
                    "full_name": user_info['full_name'],
                    "user_type": user_info['user_type']
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")

@router.get("/users-with-stats", response_model=list[UserStatsResponse])
async def get_users_with_stats(user: AuthorizedUser):
    """
    Récupère tous les utilisateurs avec leurs statistiques détaillées.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            query = """
                SELECT 
                    up.user_id::text,
                    up.full_name,
                    up.user_type,
                    up.email,
                    up.phone,
                    up.city,
                    up.created_at,
                    COUNT(l.id) as total_leads,
                    COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'pending'), 0) as pending_commissions,
                    COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'paid'), 0) as paid_commissions,
                    MAX(GREATEST(l.updated_at, c.updated_at, p.requested_at)) as last_activity
                FROM user_profiles up
                LEFT JOIN leads l ON up.user_id = l.user_id
                LEFT JOIN commissions c ON up.user_id = c.user_id
                LEFT JOIN payments p ON up.user_id = p.user_id
                GROUP BY up.user_id, up.full_name, up.user_type, up.email, up.phone, up.city, up.created_at
                ORDER BY up.created_at DESC
            """
            
            rows = await conn.fetch(query)
            
            return [UserStatsResponse(
                user_id=row['user_id'],
                full_name=row['full_name'],
                user_type=row['user_type'],
                email=row['email'],
                phone=row['phone'],
                city=row['city'],
                created_at=row['created_at'],
                total_leads=row['total_leads'] or 0,
                pending_commissions=float(row['pending_commissions'] or 0),
                paid_commissions=float(row['paid_commissions'] or 0),
                last_activity=row['last_activity']
            ) for row in rows]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")

@router.get("/all-leads")
async def get_all_leads_admin(user: AuthorizedUser):
    """
    Récupère tous les leads de tous les apporteurs pour l'admin.
    Accès restreint aux administrateurs.
    MISE À JOUR : Inclut maintenant prospect_city.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            query = """
                SELECT 
                    l.*,
                    up.full_name as apporteur_name,
                    up.user_type as apporteur_type
                FROM leads l
                JOIN user_profiles up ON l.user_id = up.user_id
                ORDER BY l.created_at DESC
            """
            
            rows = await conn.fetch(query)
            
            return [{**dict(row)} for row in rows]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des leads: {str(e)}")

@router.put("/update-lead-status")
async def update_lead_status(request: UpdateLeadStatusRequest, user: AuthorizedUser):
    """
    Permet à l'admin de changer le statut d'un lead.
    NOUVEAU SYSTÈME :
    - Si installé + professionnel : Commission 5% du montant HT (obligatoire)
    - Si installé + particulier : Bon d'achat selon grille (250€, 900€, 1500€)
    - Limite particuliers : 5 parrainages max par an
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Récupérer les infos du lead ET du profil utilisateur
            lead_info = await conn.fetchrow(
                """
                SELECT l.*, up.user_type, up.created_at as user_created_at
                FROM leads l
                JOIN user_profiles up ON l.user_id = up.user_id
                WHERE l.id = $1
                """,
                request.lead_id
            )
            
            if not lead_info:
                raise HTTPException(status_code=404, detail="Lead introuvable")
            
            user_type = lead_info['user_type']
            
            # Validation du montant HT pour les professionnels
            if request.new_status == LeadStatus.installe and user_type == 'professionnel':
                if request.amount_ht is None or request.amount_ht <= 0:
                    raise HTTPException(
                        status_code=400, 
                        detail="Le montant HT est obligatoire et doit être positif pour les professionnels"
                    )
            
            # Vérification limite annuelle pour particuliers
            if request.new_status == LeadStatus.installe and user_type == 'particulier':
                # Compter les parrainages installés cette année
                user_created_date = lead_info['user_created_at']
                current_year_start = user_created_date.replace(
                    year=datetime.now().year if datetime.now() >= user_created_date.replace(year=datetime.now().year) else datetime.now().year - 1
                )
                next_year_start = current_year_start.replace(year=current_year_start.year + 1)
                
                installed_count = await conn.fetchval(
                    """
                    SELECT COUNT(*) FROM leads 
                    WHERE user_id = $1 AND status = 'installé' 
                    AND created_at >= $2 AND created_at < $3
                    """,
                    lead_info['user_id'],
                    current_year_start,
                    next_year_start
                )
                
                if installed_count >= 5:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Limite annuelle atteinte (5/5). Prochains parrainages possibles après le {next_year_start.strftime('%d/%m/%Y')}"
                    )
            
            # Mettre à jour le statut du lead
            if request.amount_ht is not None:
                await conn.execute(
                    "UPDATE leads SET status = $1, amount_ht = $2, updated_at = NOW() WHERE id = $3",
                    request.new_status.value,
                    request.amount_ht,
                    request.lead_id
                )
            else:
                await conn.execute(
                    "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2",
                    request.new_status.value,
                    request.lead_id
                )
            
            # Calcul des commissions si installé
            if request.new_status == LeadStatus.installe:
                # Vérifier qu'une commission n'existe pas déjà
                existing_commission = await conn.fetchval(
                    "SELECT id FROM commissions WHERE lead_id = $1",
                    request.lead_id
                )
                
                if not existing_commission:
                    if user_type == 'professionnel':
                        # Commission 5% du montant HT
                        commission_amount = request.amount_ht * 0.05
                        
                        await conn.execute(
                            """
                            INSERT INTO commissions (lead_id, user_id, amount, amount_ht, status, type)
                            VALUES ($1, $2, $3, $4, 'pending', 'commission_euro')
                            """,
                            request.lead_id,
                            lead_info['user_id'],
                            commission_amount,
                            request.amount_ht
                        )
                        
                        message = f"Commission de {commission_amount:.2f}€ (5% de {request.amount_ht:.2f}€ HT) créée pour le professionnel"
                        
                    elif user_type == 'particulier':
                        # Calculer le nouveau nombre de parrainages
                        user_created_date = lead_info['user_created_at']
                        current_year_start = user_created_date.replace(
                            year=datetime.now().year if datetime.now() >= user_created_date.replace(year=datetime.now().year) else datetime.now().year - 1
                        )
                        next_year_start = current_year_start.replace(year=current_year_start.year + 1)
                        
                        new_count = await conn.fetchval(
                            """
                            SELECT COUNT(*) FROM leads 
                            WHERE user_id = $1 AND status = 'installé' 
                            AND created_at >= $2 AND created_at < $3
                            """,
                            lead_info['user_id'],
                            current_year_start,
                            next_year_start
                        )
                        
                        # Grille des bons d'achat (paliers NON cumulables)
                        voucher_amounts = {
                            1: 250,
                            2: 500, 
                            3: 900,
                            4: 1150,
                            5: 1500
                        }
                        
                        total_voucher_amount = voucher_amounts.get(new_count, 0)
                        
                        if total_voucher_amount > 0:
                            await conn.execute(
                                """
                                INSERT INTO commissions (lead_id, user_id, amount, status, type, parrainage_count_year)
                                VALUES ($1, $2, $3, 'pending', 'bon_achat', $4)
                                """,
                                request.lead_id,
                                lead_info['user_id'],
                                total_voucher_amount,
                                new_count
                            )
                            
                            message = f"Bon d'achat de {total_voucher_amount}€ créé ({new_count}/5 parrainages cette année)"
                        else:
                            message = "Statut mis à jour, aucun bon d'achat applicable"
            else:
                message = f"Statut du lead mis à jour vers '{request.new_status.value}'"
            
            return {"message": message}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur lors de la mise à jour du lead: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")

@router.get("/all-users")
async def get_all_users_admin(user: AuthorizedUser):
    """
    Récupère tous les apporteurs pour l'admin.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            query = """
                SELECT 
                    up.*,
                    COUNT(l.id) as total_leads,
                    COALESCE(SUM(c.amount), 0) as total_commissions
                FROM user_profiles up
                LEFT JOIN leads l ON up.user_id = l.user_id
                LEFT JOIN commissions c ON up.user_id = c.user_id AND c.status = 'pending'
                GROUP BY up.user_id, up.full_name, up.user_type, up.gdpr_consent_date, up.created_at, up.updated_at
                ORDER BY up.created_at DESC
            """
            
            rows = await conn.fetch(query)
            
            return [{**dict(row)} for row in rows]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des utilisateurs: {str(e)}")

# ============= ENDPOINTS MESSAGERIE ADMIN =============

@router.get("/payment-requests", response_model=list[PaymentRequestResponse])
async def get_payment_requests(
    user: AuthorizedUser,
    page: int = Query(1, ge=1, description="Numéro de page"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    status: str = Query("", description="Filtrer par statut (requested, paid, rejected)")
):
    """
    Récupère toutes les demandes de paiement avec pagination et filtrage.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Calculer l'offset
            offset = (page - 1) * limit
            
            # Construire la condition de filtrage
            filter_condition = ""
            filter_params = []
            if status.strip():
                filter_condition = "WHERE p.status = $1"
                filter_params = [status.strip()]
            
            # Compter le total
            count_query = f"""
                SELECT COUNT(*)
                FROM payments p
                JOIN user_profiles up ON p.user_id = up.user_id
                {filter_condition}
            """
            total = await conn.fetchval(count_query, *filter_params)
            
            # Récupérer les données paginées
            query = f"""
                SELECT 
                    p.id,
                    p.user_id::text as user_id,
                    up.full_name as apporteur_name,
                    p.amount_requested,
                    p.status,
                    p.requested_at,
                    p.processed_at
                FROM payments p
                JOIN user_profiles up ON p.user_id = up.user_id
                {filter_condition}
                ORDER BY p.requested_at DESC
                LIMIT ${len(filter_params) + 1} OFFSET ${len(filter_params) + 2}
            """
            
            rows = await conn.fetch(query, *filter_params, limit, offset)
            
            data = [PaymentRequestResponse(
                id=row['id'],
                user_id=row['user_id'],
                apporteur_name=row['apporteur_name'],
                amount_requested=float(row['amount_requested']),
                status=row['status'],
                requested_at=row['requested_at'],
                processed_at=row['processed_at']
            ) for row in rows]
            
            return {
                "data": data,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des demandes: {str(e)}")

@router.post("/process-payment")
async def process_payment(request: ProcessPaymentRequest, user: AuthorizedUser):
    """
    Marque une demande de paiement comme payée.
    Met à jour les commissions correspondantes vers 'paid'.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Vérifier que la demande de paiement existe et est en statut 'requested'
            payment_info = await conn.fetchrow(
                """
                SELECT * FROM payments WHERE id = $1 AND status = 'requested'
                """,
                request.payment_id
            )
            
            if not payment_info:
                raise HTTPException(status_code=404, detail="Demande de paiement introuvable ou déjà traitée")
            
            payment_date = request.payment_date or datetime.now()
            
            # Mettre à jour la demande de paiement
            await conn.execute(
                """
                UPDATE payments 
                SET status = 'completed', processed_at = $1
                WHERE id = $2
                """,
                payment_date,
                request.payment_id
            )
            
            # Mettre à jour toutes les commissions pending de cet utilisateur vers 'paid'
            await conn.execute(
                """
                UPDATE commissions 
                SET status = 'paid', updated_at = NOW()
                WHERE user_id = $1 AND status = 'pending'
                """,
                payment_info['user_id']
            )
            
            return {
                "message": f"Paiement traité avec succès par {request.payment_method}",
                "amount_paid": float(payment_info['amount_requested']),
                "payment_method": request.payment_method,
                "payment_date": payment_date.isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du paiement: {str(e)}")

@router.get("/anniversary-alerts", response_model=list[AnniversaryAlertResponse])
async def get_anniversary_alerts(user: AuthorizedUser):
    """
    Récupère la liste des utilisateurs particuliers qui approchent de leur date anniversaire
    et ont des bons d'achat en attente.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            query = """
                SELECT 
                    up.user_id::text,
                    up.full_name,
                    up.created_at as anniversary_date,
                    COALESCE(SUM(c.amount), 0) as vouchers_pending,
                    COUNT(l.id) FILTER (WHERE l.status = 'installé') as referral_count,
                    (
                        365 - (CURRENT_DATE - up.created_at::date) % 365
                    ) as days_until_anniversary
                FROM user_profiles up
                LEFT JOIN commissions c ON up.user_id = c.user_id AND c.status = 'pending' AND c.type = 'bon_achat'
                LEFT JOIN leads l ON up.user_id = l.user_id
                WHERE up.user_type = 'particulier'
                AND (
                    -- Utilisateurs avec date anniversaire dans les 30 prochains jours
                    (CURRENT_DATE - up.created_at::date) % 365 >= 335
                    OR 
                    -- Ou utilisateurs ayant déjà dépassé la date anniversaire avec bons en attente
                    ((CURRENT_DATE - up.created_at::date) % 365 <= 30 AND c.amount > 0)
                )
                GROUP BY up.user_id, up.full_name, up.created_at
                HAVING COALESCE(SUM(c.amount), 0) > 0
                ORDER BY 
                    CASE 
                        WHEN (CURRENT_DATE - up.created_at::date) % 365 <= 30 THEN 0  -- Déjà passé = priorité
                        ELSE (365 - (CURRENT_DATE - up.created_at::date) % 365)       -- Prochains = par date
                    END
            """
            
            rows = await conn.fetch(query)
            
            alerts = []
            for row in rows:
                # Calculer la vraie date anniversaire pour cette année
                creation_date = row['anniversary_date']
                current_year = datetime.now().year
                anniversary_this_year = creation_date.replace(year=current_year)
                
                # Si l'anniversaire de cette année est déjà passé, prendre l'année suivante
                if anniversary_this_year < datetime.now():
                    anniversary_this_year = anniversary_this_year.replace(year=current_year + 1)
                
                days_until = (anniversary_this_year - datetime.now()).days
                
                alerts.append(AnniversaryAlertResponse(
                    user_id=row['user_id'],
                    full_name=row['full_name'],
                    anniversary_date=anniversary_this_year,
                    vouchers_pending=float(row['vouchers_pending']),
                    days_until_anniversary=days_until,
                    referral_count=row['referral_count']
                ))
            
            return alerts
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des alertes anniversaire: {str(e)}")

@router.post("/send-private-message")
async def send_private_message_from_admin(request: SendPrivateMessageRequest, user: AuthorizedUser):
    """
    Envoie un message privé à un utilisateur spécifique.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Vérifier que l'utilisateur destinataire existe
            recipient_exists = await conn.fetchval(
                "SELECT user_id FROM user_profiles WHERE user_id = $1",
                request.user_id
            )
            
            if not recipient_exists:
                raise HTTPException(status_code=404, detail="Utilisateur destinataire introuvable")
            
            # Insérer le message privé
            await conn.execute(
                """
                INSERT INTO messages (sender_id, recipient_id, sender_type, message_type, subject, content, created_at)
                VALUES ($1, $2, 'admin', 'private', $3, $4, NOW())
                """,
                user.sub,  # ID de l'admin
                request.user_id,
                request.subject,
                request.content
            )
            
            return {"message": "Message privé envoyé avec succès"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'envoi du message: {str(e)}")

@router.post("/request-payment-for-user")
async def request_payment_for_user(request: RequestPaymentForUserRequest, user: AuthorizedUser):
    """
    Demande un paiement pour un utilisateur spécifique.
    Accès restreint aux administrateurs.
    """
    require_admin(user)
    try:
        async with get_db_connection() as conn:
            # Vérifier que l'utilisateur existe
            user_exists = await conn.fetchval(
                "SELECT user_id FROM user_profiles WHERE user_id = $1",
                request.user_id
            )
            
            if not user_exists:
                raise HTTPException(status_code=404, detail="Utilisateur introuvable")
            
            # Récupérer le montant total des commissions en attente
            total_commissions = await conn.fetchval(
                """
                SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE user_id = $1 AND status = 'pending'
                """,
                request.user_id
            )
            
            if total_commissions == 0:
                raise HTTPException(status_code=400, detail="Aucune commission en attente pour cet apporteur")
            
            # Insérer la demande de paiement
            await conn.execute(
                """
                INSERT INTO payments (user_id, amount_requested, status, requested_at)
                VALUES ($1, $2, 'requested', NOW())
                """,
                request.user_id,
                total_commissions
            )
            
            return RequestPaymentForUserResponse(
                success=True,
                amount_requested=float(total_commissions),
                message="Demande de paiement envoyée avec succès"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la demande de paiement: {str(e)}")
