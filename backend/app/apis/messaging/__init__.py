from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from datetime import datetime
from app.libs.models import Message, MessageType, SenderType, AnnouncementRead
from app.libs.auth_utils import require_admin
from app.libs.database_pool import get_db_connection
from app.libs.log_sanitizer import sanitize_log, sanitize_db_error
from app.libs.rate_limiter import rate_limit_messaging, rate_limit_admin

router = APIRouter(prefix="/api/messaging", tags=["Messaging"])

# Pydantic models pour les requêtes
class SendAnnouncementRequest(BaseModel):
    subject: str
    content: str

class SendPrivateMessageRequest(BaseModel):
    recipient_id: str  # UUID de l'apporteur destinataire
    subject: str
    content: str

class MarkAsReadRequest(BaseModel):
    message_id: int

class DeleteMessageRequest(BaseModel):
    message_id: int

class MessagesResponse(BaseModel):
    announcements: list[Message]
    private_messages: list[Message]
    unread_count: int

# ============= ENDPOINTS ADMIN =============

@rate_limit_admin
@router.get("/admin/received")
async def get_admin_received_messages(user: AuthorizedUser, request: Request):
    """
    Récupère tous les messages privés reçus par l'admin connecté.
    Accessible uniquement aux admins.
    """
    require_admin(user)
    admin_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Récupérer les messages privés reçus par l'admin
            query = """
                SELECT m.*, 
                       up.full_name as sender_name,
                       up.user_type as sender_type
                FROM messages m
                JOIN user_profiles up ON m.sender_id::text = up.user_id::text
                WHERE m.message_type = 'private' 
                AND m.recipient_id::text = $1::text
                ORDER BY m.created_at DESC
            """
            
            rows = await conn.fetch(query, admin_id)
            
            messages = []
            for row in rows:
                message_dict = dict(row)
                message_dict['sender_name'] = row['sender_name']
                message_dict['sender_type'] = row['sender_type']
                messages.append(message_dict)
            
            return {"messages": messages}
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_admin_received_messages: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_admin_received_messages: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

@rate_limit_admin
@router.post("/send-announcement")
async def send_announcement(request_data: SendAnnouncementRequest, user: AuthorizedUser, request: Request):
    """
    Envoie une annonce générale à tous les apporteurs.
    Accessible uniquement aux admins.
    """
    require_admin(user)
    user_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Insérer l'annonce générale
            await conn.execute(
                """
                INSERT INTO messages (sender_id, sender_type, recipient_id, message_type, subject, content)
                VALUES ($1, $2, NULL, $3, $4, $5)
                """,
                user_id,
                SenderType.admin.value,
                MessageType.announcement.value,
                request_data.subject,
                request_data.content
            )
            
            return {"message": "Annonce envoyée avec succès"}
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in send_announcement: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in send_announcement: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

@rate_limit_messaging
@router.delete("/delete-for-user")
async def delete_message_for_user(request_data: DeleteMessageRequest, user: AuthorizedUser, request: Request):
    """
    Supprime un message pour l'apporteur connecté :
    - Pour les annonces : marque comme supprimée dans announcement_reads
    - Pour les messages privés : supprime le message seulement s'il est l'expéditeur ou le destinataire
    """
    user_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Récupérer les infos du message
            message_info = await conn.fetchrow(
                "SELECT message_type, sender_id, recipient_id FROM messages WHERE id = $1",
                request_data.message_id
            )
            
            if not message_info:
                raise HTTPException(status_code=404, detail="Message introuvable")

            if message_info['message_type'] == 'announcement':
                # Pour les annonces, marquer comme supprimée dans announcement_reads
                await conn.execute(
                    """
                    INSERT INTO announcement_reads (user_id, message_id, is_read, is_deleted) 
                    VALUES ($1, $2, true, true)
                    ON CONFLICT (user_id, message_id) 
                    DO UPDATE SET is_deleted = true
                    """,
                    user_id,
                    request_data.message_id
                )
            elif message_info['message_type'] == 'private':
                # Pour les messages privés, vérifier que l'utilisateur est expéditeur ou destinataire
                if str(message_info['sender_id']) != str(user_id) and str(message_info['recipient_id']) != str(user_id):
                    raise HTTPException(status_code=403, detail="Non autorisé à supprimer ce message")
                
                # Supprimer le message
                await conn.execute(
                    "DELETE FROM messages WHERE id = $1",
                    request_data.message_id
                )
            
            return {"message": "Message supprimé avec succès"}
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in delete_message_for_user: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except HTTPException:
        raise
    except Exception as e:
        print(sanitize_log(f"Unexpected error in delete_message_for_user: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

# ============= ENDPOINTS APPORTEUR =============

@rate_limit_messaging
@router.get("/my-messages", response_model=MessagesResponse)
async def get_my_messages(user: AuthorizedUser, request: Request):
    """
    Récupère tous les messages de l'apporteur connecté :
    - Annonces générales (non archivées)
    - Messages privés reçus et envoyés
    """
    user_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Récupérer les annonces générales
            announcements_query = """
                SELECT m.*, 
                       CASE WHEN ar.message_id IS NOT NULL AND ar.is_deleted IS NOT TRUE THEN true ELSE false END as is_read
                FROM messages m
                LEFT JOIN announcement_reads ar ON m.id = ar.message_id AND ar.user_id = $1
                WHERE m.message_type = 'announcement'
                AND (ar.is_deleted IS NULL OR ar.is_deleted = FALSE)
                ORDER BY m.created_at DESC
            """
            announcements_rows = await conn.fetch(announcements_query, user_id)
            announcements = [Message.model_validate(dict(row)) for row in announcements_rows]
            
            # Récupérer les messages privés (reçus et envoyés)
            private_messages_query = """
                SELECT * FROM messages 
                WHERE message_type = 'private' 
                AND (recipient_id = $1 OR sender_id = $1)
                ORDER BY created_at DESC
            """
            private_rows = await conn.fetch(private_messages_query, user_id)
            private_messages = [Message.model_validate(dict(row)) for row in private_rows]
            
            # Compter les messages non lus
            unread_count_query = """
                SELECT COUNT(*) FROM messages m
                LEFT JOIN announcement_reads ar ON m.id = ar.message_id AND ar.user_id = $1
                WHERE (
                    (m.message_type = 'announcement' AND (ar.message_id IS NULL OR ar.is_deleted IS NOT TRUE) AND ar.is_deleted IS NOT TRUE)
                    OR 
                    (m.message_type = 'private' AND m.recipient_id = $1 AND m.is_read = false)
                )
            """
            unread_count = await conn.fetchval(unread_count_query, user_id)
            
            return MessagesResponse(
                announcements=announcements,
                private_messages=private_messages,
                unread_count=unread_count or 0
            )
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in get_my_messages: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in get_my_messages: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

@rate_limit_messaging
@router.post("/mark-announcement-read")
async def mark_announcement_read(request_data: MarkAsReadRequest, user: AuthorizedUser, request: Request):
    """
    Marque une annonce comme lue pour l'apporteur connecté.
    """
    user_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Vérifier que le message est bien une annonce
            message_type = await conn.fetchval(
                "SELECT message_type FROM messages WHERE id = $1",
                request_data.message_id
            )
            
            if message_type != 'announcement':
                raise HTTPException(status_code=400, detail="Ce message n'est pas une annonce")
            
            # Marquer comme lu (INSERT IGNORE)
            await conn.execute(
                """
                INSERT INTO announcement_reads (message_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (message_id, user_id) DO NOTHING
                """,
                request_data.message_id,
                user_id
            )
            
            return {"message": "Annonce marquée comme lue"}
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in mark_announcement_read: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except HTTPException:
        raise
    except Exception as e:
        print(sanitize_log(f"Unexpected error in mark_announcement_read: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

@rate_limit_messaging
@router.post("/mark-private-message-read")
async def mark_private_message_read(request_data: MarkAsReadRequest, user: AuthorizedUser, request: Request):
    """
    Marque un message privé comme lu.
    """
    user_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Marquer le message comme lu (seulement si l'utilisateur est le destinataire)
            result = await conn.execute(
                """
                UPDATE messages 
                SET is_read = true, updated_at = NOW()
                WHERE id = $1 AND recipient_id = $2 AND message_type = 'private'
                """,
                request_data.message_id,
                user_id
            )
            
            if result == "UPDATE 0":
                raise HTTPException(status_code=404, detail="Message introuvable ou vous n'êtes pas le destinataire")
            
            return {"message": "Message marqué comme lu"}
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in mark_private_message_read: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except HTTPException:
        raise
    except Exception as e:
        print(sanitize_log(f"Unexpected error in mark_private_message_read: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")

@rate_limit_messaging
@router.post("/send-private-message")
async def send_private_message_from_user(request_data: SendPrivateMessageRequest, user: AuthorizedUser, request: Request):
    """
    Permet à un apporteur d'envoyer un message privé à l'admin.
    Le recipient_id sera l'ID de l'admin (à définir).
    """
    user_id = user.sub
    
    try:
        async with get_db_connection() as conn:
            # Pour l'instant, on utilise un ID admin fixe
            # TODO: Gérer les admins de manière plus sophistiquée
            admin_id = request_data.recipient_id  # L'apporteur spécifie l'admin destinataire
            
            # Insérer le message privé
            await conn.execute(
                """
                INSERT INTO messages (sender_id, sender_type, recipient_id, message_type, subject, content)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                user_id,
                SenderType.apporteur.value,
                admin_id,
                MessageType.private.value,
                request_data.subject,
                request_data.content
            )
            
            return {"message": "Message envoyé à l'administrateur"}
            
    except asyncpg.PostgresError as e:
        print(sanitize_db_error(f"Database error in send_private_message_from_user: {e}"))
        raise HTTPException(status_code=500, detail="Erreur de base de données")
    except Exception as e:
        print(sanitize_log(f"Unexpected error in send_private_message_from_user: {e}"))
        raise HTTPException(status_code=500, detail="Erreur inattendue")
