"""Scripts de maintenance et nettoyage de la base de données AmbassyApp

Ce module contient tous les scripts nécessaires pour :
- Supprimer des comptes utilisateurs de test
- Nettoyer les données orphelines
- Gérer la maintenance de la base de données

Utilisation :
import databutton as db
from app.libs.database_maintenance import DatabaseMaintenance

# Créer une instance
db_maintenance = DatabaseMaintenance()

# Supprimer un utilisateur spécifique
await db_maintenance.delete_user_completely("user_id_here")

# Supprimer tous les utilisateurs de test
await db_maintenance.delete_all_test_users()
"""

import asyncpg
import databutton as db
from typing import List, Dict, Any
from app.env import mode, Mode

class DatabaseMaintenance:
    """Classe pour la maintenance de la base de données"""
    
    def __init__(self):
        # Sélectionner la bonne URL de base de données selon l'environnement
        if mode == Mode.PROD:
            self.db_url = db.secrets.get("DATABASE_URL_PROD")
        else:
            self.db_url = db.secrets.get("DATABASE_URL_DEV")
    
    async def get_connection(self):
        """Créer une connexion à la base de données"""
        return await asyncpg.connect(self.db_url)
    
    async def list_all_users(self) -> List[Dict[str, Any]]:
        """Lister tous les utilisateurs avec leurs informations"""
        conn = await self.get_connection()
        try:
            query = """
            SELECT 
                up.user_id,
                up.full_name,
                up.user_type,
                up.created_at,
                COUNT(DISTINCT l.id) as total_leads,
                COUNT(DISTINCT c.id) as total_commissions,
                COUNT(DISTINCT p.id) as total_payments,
                COUNT(DISTINCT contracts.id) as total_contracts
            FROM user_profiles up
            LEFT JOIN leads l ON up.user_id = l.user_id
            LEFT JOIN commissions c ON up.user_id = c.user_id
            LEFT JOIN payments p ON up.user_id = p.user_id
            LEFT JOIN contracts ON up.user_id = contracts.user_id
            GROUP BY up.user_id, up.full_name, up.user_type, up.created_at
            ORDER BY up.created_at DESC;
            """
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
        finally:
            await conn.close()
    
    async def get_user_details(self, user_id: str) -> Dict[str, Any]:
        """Récupérer tous les détails d'un utilisateur"""
        conn = await self.get_connection()
        try:
            # Profil utilisateur
            profile = await conn.fetchrow(
                "SELECT * FROM user_profiles WHERE user_id = $1", user_id
            )
            
            # Leads
            leads = await conn.fetch(
                "SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC", user_id
            )
            
            # Commissions
            commissions = await conn.fetch(
                "SELECT * FROM commissions WHERE user_id = $1 ORDER BY created_at DESC", user_id
            )
            
            # Paiements
            payments = await conn.fetch(
                "SELECT * FROM payments WHERE user_id = $1 ORDER BY requested_at DESC", user_id
            )
            
            # Contrats
            contracts = await conn.fetch(
                "SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC", user_id
            )
            
            # Messages
            messages = await conn.fetch(
                "SELECT * FROM messages WHERE sender_id = $1 OR recipient_id = $1 ORDER BY created_at DESC", user_id
            )
            
            # Guide parrainage
            referral_guide = await conn.fetchrow(
                "SELECT * FROM referral_guide_acceptances WHERE user_id = $1", user_id
            )
            
            return {
                "profile": dict(profile) if profile else None,
                "leads": [dict(row) for row in leads],
                "commissions": [dict(row) for row in commissions],
                "payments": [dict(row) for row in payments],
                "contracts": [dict(row) for row in contracts],
                "messages": [dict(row) for row in messages],
                "referral_guide": dict(referral_guide) if referral_guide else None
            }
        finally:
            await conn.close()
    
    async def delete_user_completely(self, user_id: str) -> Dict[str, int]:
        """Supprimer complètement un utilisateur et toutes ses données
        
        ATTENTION : Cette opération est irréversible !
        
        Args:
            user_id: L'ID de l'utilisateur à supprimer
            
        Returns:
            Dict avec le nombre d'éléments supprimés par table
        """
        conn = await self.get_connection()
        try:
            # Commencer une transaction
            async with conn.transaction():
                deleted_counts = {}
                
                # 1. Supprimer les lectures d'annonces
                result = await conn.execute(
                    "DELETE FROM announcement_reads WHERE user_id = $1", user_id
                )
                deleted_counts['announcement_reads'] = int(result.split()[-1])
                
                # 2. Supprimer les commissions
                result = await conn.execute(
                    "DELETE FROM commissions WHERE user_id = $1", user_id
                )
                deleted_counts['commissions'] = int(result.split()[-1])
                
                # 3. Supprimer les contrats
                result = await conn.execute(
                    "DELETE FROM contracts WHERE user_id = $1", user_id
                )
                deleted_counts['contracts'] = int(result.split()[-1])
                
                # 4. Supprimer les paiements
                result = await conn.execute(
                    "DELETE FROM payments WHERE user_id = $1", user_id
                )
                deleted_counts['payments'] = int(result.split()[-1])
                
                # 5. Supprimer l'acceptation du guide de parrainage
                result = await conn.execute(
                    "DELETE FROM referral_guide_acceptances WHERE user_id = $1", user_id
                )
                deleted_counts['referral_guide_acceptances'] = int(result.split()[-1])
                
                # 6. Supprimer les messages (envoyés et reçus)
                result = await conn.execute(
                    "DELETE FROM messages WHERE sender_id = $1 OR recipient_id = $1", user_id
                )
                deleted_counts['messages'] = int(result.split()[-1])
                
                # 7. Supprimer les leads (et leurs commissions associées seront supprimées par cascade)
                result = await conn.execute(
                    "DELETE FROM leads WHERE user_id = $1", user_id
                )
                deleted_counts['leads'] = int(result.split()[-1])
                
                # 8. Enfin, supprimer le profil utilisateur
                result = await conn.execute(
                    "DELETE FROM user_profiles WHERE user_id = $1", user_id
                )
                deleted_counts['user_profiles'] = int(result.split()[-1])
                
                return deleted_counts
                
        finally:
            await conn.close()
    
    async def delete_test_users_by_name_pattern(self, name_patterns: List[str]) -> List[Dict[str, Any]]:
        """Supprimer les utilisateurs dont le nom contient certains mots (pour les comptes de test)
        
        Args:
            name_patterns: Liste de mots à rechercher dans les noms (ex: ["test", "demo", "essai"])
            
        Returns:
            Liste des utilisateurs supprimés avec leurs statistiques
        """
        conn = await self.get_connection()
        try:
            # Construire la requête pour trouver les utilisateurs de test
            conditions = []
            for pattern in name_patterns:
                conditions.append(f"LOWER(full_name) LIKE '%{pattern.lower()}%'")
            
            where_clause = " OR ".join(conditions)
            
            query = f"""
            SELECT user_id, full_name, user_type, created_at 
            FROM user_profiles 
            WHERE {where_clause}
            ORDER BY created_at DESC
            """
            
            test_users = await conn.fetch(query)
            deleted_users = []
            
            for user in test_users:
                user_id = str(user['user_id'])
                user_details = await self.get_user_details(user_id)
                deletion_result = await self.delete_user_completely(user_id)
                
                deleted_users.append({
                    'user_id': user_id,
                    'full_name': user['full_name'],
                    'user_type': user['user_type'],
                    'created_at': user['created_at'],
                    'deleted_counts': deletion_result,
                    'had_data': {
                        'leads': len(user_details['leads']),
                        'commissions': len(user_details['commissions']),
                        'payments': len(user_details['payments']),
                        'contracts': len(user_details['contracts'])
                    }
                })
            
            return deleted_users
            
        finally:
            await conn.close()
    
    async def cleanup_orphaned_data(self) -> Dict[str, int]:
        """Nettoyer les données orphelines (sans utilisateur associé)"""
        conn = await self.get_connection()
        try:
            async with conn.transaction():
                cleanup_counts = {}
                
                # Supprimer les leads sans utilisateur
                result = await conn.execute("""
                    DELETE FROM leads 
                    WHERE user_id NOT IN (SELECT user_id FROM user_profiles)
                """)
                cleanup_counts['orphaned_leads'] = int(result.split()[-1])
                
                # Supprimer les commissions sans utilisateur
                result = await conn.execute("""
                    DELETE FROM commissions 
                    WHERE user_id NOT IN (SELECT user_id FROM user_profiles)
                """)
                cleanup_counts['orphaned_commissions'] = int(result.split()[-1])
                
                # Supprimer les paiements sans utilisateur
                result = await conn.execute("""
                    DELETE FROM payments 
                    WHERE user_id NOT IN (SELECT user_id FROM user_profiles)
                """)
                cleanup_counts['orphaned_payments'] = int(result.split()[-1])
                
                # Supprimer les contrats sans utilisateur
                result = await conn.execute("""
                    DELETE FROM contracts 
                    WHERE user_id NOT IN (SELECT user_id FROM user_profiles)
                """)
                cleanup_counts['orphaned_contracts'] = int(result.split()[-1])
                
                # Supprimer les commissions sans lead associé
                result = await conn.execute("""
                    DELETE FROM commissions 
                    WHERE lead_id NOT IN (SELECT id FROM leads)
                """)
                cleanup_counts['commissions_without_leads'] = int(result.split()[-1])
                
                return cleanup_counts
                
        finally:
            await conn.close()
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Obtenir des statistiques générales sur la base de données"""
        conn = await self.get_connection()
        try:
            stats = {}
            
            # Compter les utilisateurs par type
            user_stats = await conn.fetch("""
                SELECT user_type, COUNT(*) as count
                FROM user_profiles 
                GROUP BY user_type
            """)
            stats['users_by_type'] = {row['user_type']: row['count'] for row in user_stats}
            
            # Compter les leads par statut
            lead_stats = await conn.fetch("""
                SELECT status, COUNT(*) as count
                FROM leads 
                GROUP BY status
            """)
            stats['leads_by_status'] = {row['status']: row['count'] for row in lead_stats}
            
            # Statistiques générales
            general_stats = await conn.fetchrow("""
                SELECT 
                    (SELECT COUNT(*) FROM user_profiles) as total_users,
                    (SELECT COUNT(*) FROM leads) as total_leads,
                    (SELECT COUNT(*) FROM commissions) as total_commissions,
                    (SELECT COUNT(*) FROM payments) as total_payments,
                    (SELECT COUNT(*) FROM contracts) as total_contracts,
                    (SELECT COUNT(*) FROM messages) as total_messages,
                    (SELECT COALESCE(SUM(amount), 0) FROM commissions) as total_commission_amount,
                    (SELECT COALESCE(SUM(amount_requested), 0) FROM payments) as total_payment_requests
            """)
            
            stats['general'] = dict(general_stats)
            
            return stats
            
        finally:
            await conn.close()
