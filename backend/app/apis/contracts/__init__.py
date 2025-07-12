from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import asyncpg
import uuid
import databutton as db
from app.auth import AuthorizedUser
from app.libs.auth_utils import require_admin
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error
from app.libs.rate_limiter import rate_limit_contracts, rate_limit_admin
from app.libs.uuid_mapping import get_user_uuid

router = APIRouter()

# Models
class ContractGenerationRequest(BaseModel):
    company_name: str  # Nom de l'entreprise ou raison sociale
    siret_number: str  # Numéro SIRET de l'entreprise

class ContractSignatureRequest(BaseModel):
    contract_id: Optional[int] = None

class ContractResponse(BaseModel):
    id: int
    contract_type: str
    company_name: str
    siret_number: str
    contract_html: str
    is_signed: bool
    signed_at: Optional[datetime] = None
    created_at: datetime

# Template HTML du contrat
CONTRAT_TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrat d'Apporteur d'Affaires</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .parties { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
        .article { margin-bottom: 25px; }
        .article-title { font-weight: bold; color: #1e40af; margin-bottom: 10px; }
        .signature-section { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
        .signature-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRAT D'APPORTEUR D'AFFAIRES</h1>
    </div>
    
    <div class="parties">
        <h2>ENTRE LES SOUSSIGNÉS :</h2>
        <p><strong>Mandant :</strong><br>
        Stéphane Aldrighettoni, Agent commercial MS-Voltalia<br>
        134 rue amiral Nomy, 83000 Toulon</p>
        
        <p><strong>Et :</strong><br>
        <strong>L'Apporteur d'affaires :</strong> {company_name}<br>
        <strong>SIRET :</strong> {siret_number}</p>
    </div>
    
    <div class="article">
        <div class="article-title">Article 1 - Objet</div>
        <p>Le présent contrat a pour objet de définir les conditions dans lesquelles l'Apporteur d'affaires présente des prospects au Mandant pour la conclusion de contrats d'installation de solutions solaires.</p>
    </div>
    
    <div class="article">
        <div class="article-title">Article 2 - Obligations de l'Apporteur</div>
        <p>L'Apporteur s'engage à :</p>
        <ul>
            <li>Présenter des clients potentiels au Mandant</li>
            <li>Garantir l'exactitude des informations transmises</li>
            <li>Informer sur les solutions proposées si besoin</li>
            <li>Annoncer les prix d'installation et engager l'agent commercial</li>
            <li>Obtenir le consentement préalable des prospects conformément au RGPD</li>
        </ul>
    </div>
    
    <div class="article">
        <div class="article-title">Article 3 - Rémunération</div>
        <p>L'Apporteur percevra une commission de <strong>5% sur le montant HT</strong> de la solution vendue et installée.</p>
        <p>Cette commission est due uniquement après :</p>
        <ul>
            <li>Signature du contrat final par le client</li>
            <li>Mise en service effective de l'installation</li>
        </ul>
        <p>Le paiement sera effectué sous 30 jours après réception de la facture.</p>
    </div>
    
    <div class="article">
        <div class="article-title">Article 4 - Durée</div>
        <p>Le présent contrat est conclu pour une durée indéterminée. Il peut être résilié par chacune des parties avec un préavis de 30 jours.</p>
    </div>
    
    <div class="signature-section">
        <p><strong>Fait à Montpellier le :</strong> {signature_date}</p>
        <p><strong>Signature électronique validée</strong></p>
        <div class="signature-info">
            <p><strong>Informations de signature :</strong></p>
            <p>• Date et heure : {signature_datetime}<br>
            • Adresse IP : {signature_ip}<br>
            • Statut : Contrat signé électroniquement</p>
        </div>
    </div>
</body>
</html>
"""

@rate_limit_contracts
@router.post("/generate-contract")
async def generate_contract(request_data: ContractGenerationRequest, user: AuthorizedUser, request: Request):
    """Génère un nouveau contrat pour l'utilisateur"""
    from datetime import datetime
    
    try:
        async with get_db_connection() as conn:
            # Utiliser le mapping UUID pour les utilisateurs de test
            from app.libs.uuid_mapping import get_user_uuid
            user_uuid = get_user_uuid(user.sub)
            
            # Vérifier si l'utilisateur a un profil
            user_profile = await conn.fetchrow(
                "SELECT full_name, siret FROM user_profiles WHERE user_id = $1",
                user_uuid
            )
            
            if not user_profile:
                # Créer un profil avec les nouvelles données
                await conn.execute(
                    "INSERT INTO user_profiles (user_id, full_name, siret, user_type, gdpr_consent_date) VALUES ($1, $2, $3, $4, $5)",
                    user_uuid, request_data.company_name, request_data.siret_number, "professionnel", datetime.now()
                )
            else:
                # Mettre à jour le profil avec les nouvelles données
                await conn.execute(
                    "UPDATE user_profiles SET full_name = $2, siret = $3 WHERE user_id = $1",
                    user_uuid, request_data.company_name, request_data.siret_number
                )
            
            # Utiliser les données du formulaire
            company_name = request_data.company_name
            siret_number = request_data.siret_number
            
            # Formater la date du jour en français (sans lieu car le template contient déjà "Montpellier")
            current_date = datetime.now()
            # Format: "11 juillet 2025" (sans ville car template dit "Fait à Montpellier le :")
            months_fr = [
                "", "janvier", "février", "mars", "avril", "mai", "juin",
                "juillet", "août", "septembre", "octobre", "novembre", "décembre"
            ]
            signature_date_french = f"{current_date.day} {months_fr[current_date.month]} {current_date.year}"
            
            # Générer le HTML du contrat avec les vrais champs
            contract_html = CONTRAT_TEMPLATE
            contract_html = contract_html.replace("{company_name}", company_name)
            contract_html = contract_html.replace("{siret_number}", siret_number)
            contract_html = contract_html.replace("{signature_date}", signature_date_french)
            contract_html = contract_html.replace("{signature_datetime}", "[SIGNATURE_DATETIME_PLACEHOLDER]")
            contract_html = contract_html.replace("{signature_ip}", "[SIGNATURE_IP_PLACEHOLDER]")
            
            # Insérer en base de données
            contract_id = await conn.fetchval(
                """
                INSERT INTO contracts (user_id, company_name, siret_number, contract_html)
                VALUES ($1, $2, $3, $4)
                RETURNING id
                """,
                user_uuid, company_name, siret_number, contract_html
            )
            
            # Récupérer le contrat créé
            contract_data = await conn.fetchrow(
                "SELECT * FROM contracts WHERE id = $1", contract_id
            )
            
            return ContractResponse(
                id=contract_data['id'],
                contract_type=contract_data['contract_type'],
                company_name=contract_data['company_name'],
                siret_number=contract_data['siret_number'],
                contract_html=contract_data['contract_html'],
                is_signed=contract_data['is_signed'],
                signed_at=contract_data['signed_at'],
                created_at=contract_data['created_at']
            )
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in generate_contract: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in generate_contract: {e}"))
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du contrat")

@rate_limit_contracts
@router.post("/sign-contract")
async def sign_contract(request_data: ContractSignatureRequest, user: AuthorizedUser, request: Request):
    """Signe électroniquement un contrat"""
    try:
        # Récupérer l'IP du client
        client_ip = request.client.host
        signature_datetime = datetime.now()
        
        async with get_db_connection() as conn:
            # Utiliser le mapping UUID pour les utilisateurs de test
            from app.libs.uuid_mapping import get_user_uuid
            user_uuid = get_user_uuid(user.sub)
            
            # Si aucun contract_id fourni, récupérer le contrat de l'utilisateur
            if request_data.contract_id is None:
                contract = await conn.fetchrow(
                    "SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
                    user_uuid
                )
            else:
                contract = await conn.fetchrow(
                    "SELECT * FROM contracts WHERE id = $1 AND user_id = $2",
                    request_data.contract_id, user_uuid
                )
            
            if not contract:
                raise HTTPException(status_code=404, detail="Contrat non trouvé")
            
            if contract['is_signed']:
                raise HTTPException(status_code=400, detail="Contrat déjà signé")
            
            # Mettre à jour le HTML avec les informations de signature
            updated_html = contract['contract_html'].replace(
                "[SIGNATURE_DATETIME_PLACEHOLDER]",
                signature_datetime.strftime("%d/%m/%Y à %H:%M:%S")
            ).replace(
                "[SIGNATURE_IP_PLACEHOLDER]",
                client_ip,
                1  # Remplacer seulement la première occurrence pour l'IP
            )
            
            # Marquer le contrat comme signé
            await conn.execute(
                """
                UPDATE contracts 
                SET is_signed = TRUE, signed_at = $1, signature_ip = $2, contract_html = $3, updated_at = $1
                WHERE id = $4
                """,
                signature_datetime, client_ip, updated_html, contract['id']
            )
            
            # Récupérer le contrat mis à jour
            updated_contract = await conn.fetchrow(
                "SELECT * FROM contracts WHERE id = $1", contract['id']
            )
            
            # Envoyer un email de confirmation avec le contrat
            try:
                # Récupérer l'email et le nom de l'utilisateur depuis le profil
                user_profile = await conn.fetchrow(
                    "SELECT full_name, email FROM user_profiles WHERE user_id = $1",
                    user_uuid
                )
                
                if not user_profile or not user_profile['email']:
                    print(f"Impossible d'envoyer l'email: profil ou email manquant pour {user_uuid}")
                    # Continuer sans erreur, l'important est que le contrat soit signé
                else:
                    user_name = user_profile['full_name'] if user_profile else "Apporteur d'affaires"
                    user_email = user_profile['email']
                    
                    # Envoyer l'email avec le contrat en pièce jointe
                    db.notify.email(
                        to=user_email,
                        subject="Contrat d'apporteur d'affaires signé - Confirmation",
                        content_html=f"""
                        <h2>Contrat d'apporteur d'affaires signé avec succès</h2>
                        <p>Bonjour {user_name},</p>
                        <p>Votre contrat d'apporteur d'affaires a été signé électroniquement avec succès le {signature_datetime.strftime('%d/%m/%Y à %H:%M:%S')}.</p>
                        
                        <h3>Informations du contrat :</h3>
                        <ul>
                            <li><strong>Société :</strong> {contract['company_name']}</li>
                            <li><strong>SIRET :</strong> {contract['siret_number']}</li>
                            <li><strong>Date de signature :</strong> {signature_datetime.strftime('%d/%m/%Y à %H:%M:%S')}</li>
                        </ul>
                        
                        <p>Vous pouvez maintenant accéder à votre espace apporteur d'affaires et commencer à saisir vos prospects.</p>
                        
                        <h3>Prochaines étapes :</h3>
                        <ul>
                            <li>Connectez-vous à votre espace personnel</li>
                            <li>Saisissez vos premiers prospects</li>
                            <li>Suivez l'évolution de vos commissions</li>
                        </ul>
                        
                        <p>Pour toute question, n'hésitez pas à nous contacter.</p>
                        
                        <p>Cordialement,<br>
                        L'équipe Stéphane Aldrighettoni - MS Voltalia</p>
                        
                        <hr>
                        <p style="font-size: 12px; color: #666;">
                            Ce contrat a été signé électroniquement et a la même valeur juridique qu'une signature manuscrite.
                        </p>
                        """,
                        content_text=f"""
                        Contrat d'apporteur d'affaires signé avec succès
                        
                        Bonjour {user_name},
                        
                        Votre contrat d'apporteur d'affaires a été signé électroniquement avec succès le {signature_datetime.strftime('%d/%m/%Y à %H:%M:%S')}.
                        
                        Informations du contrat :
                        - Société : {contract['company_name']}
                        - SIRET : {contract['siret_number']}
                        - Date de signature : {signature_datetime.strftime('%d/%m/%Y à %H:%M:%S')}
                        
                        Vous pouvez maintenant accéder à votre espace apporteur d'affaires et commencer à saisir vos prospects.
                        
                        Prochaines étapes :
                        - Connectez-vous à votre espace personnel
                        - Saisissez vos premiers prospects
                        - Suivez l'évolution de vos commissions
                        
                        Pour toute question, n'hésitez pas à nous contacter.
                        
                        Cordialement,
                        L'équipe Stéphane Aldrighettoni - MS Voltalia
                        
                        Ce contrat a été signé électroniquement et a la même valeur juridique qu'une signature manuscrite.
                        """
                    )
                    print(f"Email de confirmation envoyé à {user_email}")
                
            except Exception as email_error:
                print(f"Erreur lors de l'envoi de l'email : {email_error}")
                # Ne pas faire échouer la signature si l'email ne part pas
            
            return ContractResponse(
                id=updated_contract['id'],
                contract_type=updated_contract['contract_type'],
                company_name=updated_contract['company_name'],
                siret_number=updated_contract['siret_number'],
                contract_html=updated_contract['contract_html'],
                is_signed=updated_contract['is_signed'],
                signed_at=updated_contract['signed_at'],
                created_at=updated_contract['created_at']
            )
            
    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in sign_contract: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in sign_contract: {e}"))
        raise HTTPException(status_code=500, detail="Erreur lors de la signature du contrat")

@router.get("/my-contract")
async def get_my_contract(user: AuthorizedUser) -> Optional[ContractResponse]:
    """Récupère le contrat de l'utilisateur connecté"""
    try:
        async with get_db_connection() as conn:
            # Utiliser le mapping UUID pour les utilisateurs de test
            from app.libs.uuid_mapping import get_user_uuid
            user_uuid = get_user_uuid(user.sub)
            
            contract = await conn.fetchrow(
                "SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
                user_uuid
            )
            
            if not contract:
                return None
            
            return ContractResponse(
                id=contract['id'],
                contract_type=contract['contract_type'],
                company_name=contract['company_name'],
                siret_number=contract['siret_number'],
                contract_html=contract['contract_html'],
                is_signed=contract['is_signed'],
                signed_at=contract['signed_at'],
                created_at=contract['created_at']
            )
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_my_contract: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données") from None
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_my_contract: {e}"))
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du contrat") from None

@router.get("/all-contracts")
async def get_all_contracts(user: AuthorizedUser) -> List[ContractResponse]:
    """Récupère tous les contrats (admin seulement)"""
    require_admin(user)

    try:
        async with get_db_connection() as conn:
            # Récupérer tous les contrats
            contracts = await conn.fetch(
                "SELECT * FROM contracts"
            )
            
            result = []
            for contract in contracts:
                # Créer un dictionnaire avec les données du contrat
                contract_dict = {
                    "id": contract['id'],
                    "contract_type": contract['contract_type'],
                    "company_name": contract['company_name'],
                    "siret_number": contract['siret_number'],
                    "contract_html": contract['contract_html'],
                    "is_signed": contract['is_signed'],
                    "signed_at": contract['signed_at'],
                    "created_at": contract['created_at']
                }
                result.append(contract_dict)
            
            return result
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_all_contracts: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_all_contracts: {e}"))
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des contrats")
