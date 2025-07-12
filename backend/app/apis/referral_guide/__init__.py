from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import asyncpg
from datetime import datetime
import databutton as db
from app.auth import AuthorizedUser
from app.env import Mode, mode
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error, sanitize_auth_log

router = APIRouter()

# Models
class GuideAcceptanceRequest(BaseModel):
    pass  # Pas de paramètres nécessaires, on récupère tout du contexte

class GuideAcceptanceResponse(BaseModel):
    id: int
    user_id: str
    accepted_at: datetime
    message: str

class GuideStatusResponse(BaseModel):
    has_accepted: bool
    accepted_at: Optional[datetime] = None

@router.post("/accept-referral-guide")
async def accept_referral_guide(request: GuideAcceptanceRequest, user: AuthorizedUser, http_request: Request):
    """Enregistre l'acceptation du guide de parrainage et envoie un email"""
    try:
        # Récupérer l'IP et user agent
        client_ip = http_request.client.host
        user_agent = http_request.headers.get("user-agent", "")
        
        async with get_db_connection() as conn:
            # Vérifier si l'utilisateur a déjà accepté
            existing = await conn.fetchrow(
                "SELECT * FROM referral_guide_acceptances WHERE user_id = $1",
                user.sub
            )
            
            if existing:
                raise HTTPException(status_code=400, detail="Guide déjà accepté")
            
            # Enregistrer l'acceptation
            acceptance_id = await conn.fetchval(
                """
                INSERT INTO referral_guide_acceptances (user_id, ip_address, user_agent)
                VALUES ($1, $2, $3)
                RETURNING id
                """,
                user.sub, client_ip, user_agent
            )
            
            # Récupérer les données de l'acceptation
            acceptance = await conn.fetchrow(
                "SELECT * FROM referral_guide_acceptances WHERE id = $1",
                acceptance_id
            )
            
            # Récupérer le nom de l'utilisateur
            user_profile = await conn.fetchrow(
                "SELECT full_name FROM user_profiles WHERE user_id = $1",
                user.sub
            )
            
            user_name = user_profile['full_name'] if user_profile else "Ambassadeur"
            
            # Envoyer l'email de confirmation
            try:
                db.notify.email(
                    to=user.primaryEmail,
                    subject="Guide de parrainage accepté - Bienvenue dans le programme Voltalia x Leroy Merlin",
                    content_html=f"""
                    <h2>🎁 Bienvenue dans le programme de parrainage Voltalia x Leroy Merlin !</h2>
                    <p>Bonjour {user_name},</p>
                    <p>Félicitations ! Vous avez accepté notre guide de parrainage le {acceptance['accepted_at'].strftime('%d/%m/%Y à %H:%M:%S')}.</p>
                    
                    <h3>☀️ Récapitulatif du programme :</h3>
                    <ul>
                        <li><strong>1 parrainage</strong> → 250 € en bon d'achat</li>
                        <li><strong>3 parrainages</strong> → 900 € en bons d'achat</li>
                        <li><strong>5 parrainages</strong> → 1 500 € en bons d'achat</li>
                    </ul>
                    <p><em>⚠️ Rappel : Les paliers ne sont pas cumulables</em></p>
                    
                    <h3>🚀 Prochaines étapes :</h3>
                    <ul>
                        <li>Connectez-vous à votre espace personnel</li>
                        <li>Commencez à saisir vos premiers prospects</li>
                        <li>Suivez l'évolution de vos parrainages</li>
                        <li>Récupérez vos récompenses</li>
                    </ul>
                    
                    <h3>📋 Comment procéder :</h3>
                    <ol>
                        <li>Parlez du solaire autour de vous</li>
                        <li>Obtenez l'accord de vos prospects</li>
                        <li>Saisissez leurs coordonnées dans votre espace</li>
                        <li>Nos équipes les contactent et les accompagnent</li>
                        <li>Vous recevez vos bons d'achat après installation</li>
                    </ol>
                    
                    <p>Pour toute question, n'hésitez pas à nous contacter via votre espace personnel.</p>
                    
                    <p>Merci de votre confiance et bon parrainage !</p>
                    
                    <p>Cordialement,<br>
                    L'équipe Stéphane Aldrighettoni - MS Voltalia</p>
                    
                    <hr>
                    <p style="font-size: 12px; color: #666;">
                        Vous avez accepté ce guide le {acceptance['accepted_at'].strftime('%d/%m/%Y à %H:%M:%S')} depuis l'adresse IP {client_ip}.
                    </p>
                    """,
                    content_text=f"""
                    Bienvenue dans le programme de parrainage Voltalia x Leroy Merlin !
                    
                    Bonjour {user_name},
                    
                    Félicitations ! Vous avez accepté notre guide de parrainage le {acceptance['accepted_at'].strftime('%d/%m/%Y à %H:%M:%S')}.
                    
                    Récapitulatif du programme :
                    - 1 parrainage → 250 € en bon d'achat
                    - 3 parrainages → 900 € en bons d'achat  
                    - 5 parrainages → 1 500 € en bons d'achat
                    
                    Rappel : Les paliers ne sont pas cumulables
                    
                    Prochaines étapes :
                    - Connectez-vous à votre espace personnel
                    - Commencez à saisir vos premiers prospects
                    - Suivez l'évolution de vos parrainages
                    - Récupérez vos récompenses
                    
                    Comment procéder :
                    1. Parlez du solaire autour de vous
                    2. Obtenez l'accord de vos prospects
                    3. Saisissez leurs coordonnées dans votre espace
                    4. Nos équipes les contactent et les accompagnent
                    5. Vous recevez vos bons d'achat après installation
                    
                    Pour toute question, n'hésitez pas à nous contacter via votre espace personnel.
                    
                    Merci de votre confiance et bon parrainage !
                    
                    Cordialement,
                    L'équipe Stéphane Aldrighettoni - MS Voltalia
                    
                    Vous avez accepté ce guide le {acceptance['accepted_at'].strftime('%d/%m/%Y à %H:%M:%S')} depuis l'adresse IP {client_ip}.
                    """
                )
                print(sanitize_log(f"Email de confirmation du guide envoyé"))
                
            except Exception as email_error:
                print(sanitize_log(f"Erreur lors de l'envoi de l'email"))
                # Ne pas faire échouer l'acceptation si l'email ne part pas
            
            return GuideAcceptanceResponse(
                id=acceptance['id'],
                user_id=str(acceptance['user_id']),
                accepted_at=acceptance['accepted_at'],
                message="Guide de parrainage accepté avec succès"
            )
            
    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in accept_referral_guide: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in accept_referral_guide"))
        raise HTTPException(status_code=500, detail="Erreur lors de l'acceptation du guide")

@router.get("/referral-guide-status")
async def get_referral_guide_status(user: AuthorizedUser):
    """Vérifie si l'utilisateur a accepté le guide de parrainage"""
    try:
        async with get_db_connection() as conn:
            acceptance = await conn.fetchrow(
                "SELECT accepted_at FROM referral_guide_acceptances WHERE user_id = $1",
                user.sub
            )
            
            if acceptance:
                return GuideStatusResponse(
                    has_accepted=True,
                    accepted_at=acceptance['accepted_at']
                )
            else:
                return GuideStatusResponse(
                    has_accepted=False
                )
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_referral_guide_status: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_referral_guide_status"))
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du statut")
