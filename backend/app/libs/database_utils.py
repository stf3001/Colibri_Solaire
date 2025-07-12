"""Utilitaires pratiques pour la gestion de la base de données AmbassyApp

Ce module contient des fonctions utilitaires prêtes à l'emploi pour :
1. Lister tous les utilisateurs
2. Voir les détails d'un utilisateur spécifique
3. Supprimer un utilisateur de test
4. Nettoyer les données orphelines
5. Voir les statistiques de la BDD

POUR UTILISER CES FONCTIONS :
1. Aller dans l'onglet "Python" de Databutton
2. Importer et utiliser les fonctions de ce module

Exemple :
from app.libs.database_utils import *
await lister_tous_les_utilisateurs()
await supprimer_utilisateur_test('user_id', confirmer=True)
"""

import asyncio
import databutton as db
from app.libs.database_maintenance import DatabaseMaintenance
import json
from datetime import datetime
from typing import List, Dict, Any

# Initialiser le gestionnaire de maintenance
db_maintenance = DatabaseMaintenance()

# =============================================================================
# FONCTIONS PRATIQUES À UTILISER
# =============================================================================

async def lister_tous_les_utilisateurs():
    """Liste tous les utilisateurs avec leurs statistiques"""
    print("📋 LISTE DE TOUS LES UTILISATEURS")
    print("=" * 50)
    
    users = await db_maintenance.list_all_users()
    
    for user in users:
        print(f"🔸 ID: {user['user_id']}")
        print(f"   Nom: {user['full_name']}")
        print(f"   Type: {user['user_type']}")
        print(f"   Créé le: {user['created_at'].strftime('%d/%m/%Y %H:%M')}")
        print(f"   Leads: {user['total_leads']} | Commissions: {user['total_commissions']} | Paiements: {user['total_payments']}")
        print("-" * 40)
    
    print(f"\n✅ Total: {len(users)} utilisateurs")
    return users

async def voir_details_utilisateur(user_id: str):
    """Voir tous les détails d'un utilisateur spécifique"""
    print(f"👤 DÉTAILS UTILISATEUR: {user_id}")
    print("=" * 50)
    
    details = await db_maintenance.get_user_details(user_id)
    
    if not details['profile']:
        print("❌ Utilisateur non trouvé")
        return
    
    profile = details['profile']
    print(f"Nom: {profile['full_name']}")
    print(f"Type: {profile['user_type']}")
    print(f"Créé le: {profile['created_at']}")
    print(f"SIRET: {profile.get('siret', 'N/A')}")
    
    print(f"\n📊 STATISTIQUES:")
    print(f"  - Leads: {len(details['leads'])}")
    print(f"  - Commissions: {len(details['commissions'])}")
    print(f"  - Paiements: {len(details['payments'])}")
    print(f"  - Contrats: {len(details['contracts'])}")
    print(f"  - Messages: {len(details['messages'])}")
    print(f"  - Guide parrainage accepté: {'Oui' if details['referral_guide'] else 'Non'}")
    
    if details['leads']:
        print(f"\n📋 LEADS:")
        for lead in details['leads']:
            print(f"  - {lead['prospect_name']} ({lead['status']}) - {lead['created_at'].strftime('%d/%m/%Y')}")
    
    return details

async def supprimer_utilisateur_test(user_id: str, confirmer: bool = False):
    """Supprimer un utilisateur de test (ATTENTION : irréversible !)"""
    if not confirmer:
        print("⚠️  ATTENTION : Cette opération est IRRÉVERSIBLE !")
        print("Pour confirmer, utilisez: await supprimer_utilisateur_test('user_id', confirmer=True)")
        return
    
    print(f"🗑️  SUPPRESSION UTILISATEUR: {user_id}")
    print("=" * 50)
    
    # Voir d'abord les détails
    details = await db_maintenance.get_user_details(user_id)
    if not details['profile']:
        print("❌ Utilisateur non trouvé")
        return
    
    print(f"Suppression de: {details['profile']['full_name']} ({details['profile']['user_type']})")
    
    # Supprimer
    result = await db_maintenance.delete_user_completely(user_id)
    
    print("✅ Suppression terminée:")
    for table, count in result.items():
        if count > 0:
            print(f"  - {table}: {count} éléments supprimés")
    
    return result

async def supprimer_utilisateurs_test_par_nom():
    """Supprimer tous les utilisateurs contenant 'test', 'demo', 'essai' dans leur nom"""
    print("🗑️  SUPPRESSION UTILISATEURS DE TEST")
    print("=" * 50)
    
    # Patterns de noms de test
    patterns = ["test", "demo", "essai", "exemple", "temp"]
    
    deleted_users = await db_maintenance.delete_test_users_by_name_pattern(patterns)
    
    if not deleted_users:
        print("✅ Aucun utilisateur de test trouvé")
        return
    
    print(f"🗑️  {len(deleted_users)} utilisateurs de test supprimés:")
    for user in deleted_users:
        print(f"  - {user['full_name']} ({user['user_type']})")
        print(f"    Avait: {user['had_data']['leads']} leads, {user['had_data']['commissions']} commissions")
    
    return deleted_users

async def nettoyer_donnees_orphelines():
    """Nettoyer les données orphelines (sans utilisateur associé)"""
    print("🧹 NETTOYAGE DONNÉES ORPHELINES")
    print("=" * 50)
    
    result = await db_maintenance.cleanup_orphaned_data()
    
    print("✅ Nettoyage terminé:")
    total_cleaned = 0
    for table, count in result.items():
        if count > 0:
            print(f"  - {table}: {count} éléments supprimés")
            total_cleaned += count
    
    if total_cleaned == 0:
        print("✅ Aucune donnée orpheline trouvée")
    
    return result

async def voir_statistiques_bdd():
    """Voir les statistiques générales de la base de données"""
    print("📊 STATISTIQUES BASE DE DONNÉES")
    print("=" * 50)
    
    stats = await db_maintenance.get_database_stats()
    
    print("👥 UTILISATEURS:")
    for user_type, count in stats['users_by_type'].items():
        print(f"  - {user_type}: {count}")
    
    print("\n📋 LEADS:")
    for status, count in stats['leads_by_status'].items():
        print(f"  - {status}: {count}")
    
    print("\n📈 GÉNÉRAL:")
    general = stats['general']
    print(f"  - Total utilisateurs: {general['total_users']}")
    print(f"  - Total leads: {general['total_leads']}")
    print(f"  - Total commissions: {general['total_commissions']}")
    print(f"  - Total paiements: {general['total_payments']}")
    print(f"  - Total contrats: {general['total_contracts']}")
    print(f"  - Montant total commissions: {general['total_commission_amount']}€")
    print(f"  - Montant total demandes paiement: {general['total_payment_requests']}€")
    
    return stats

async def audit_complet():
    """Faire un audit complet de la base de données"""
    print("🔍 AUDIT COMPLET AMBASSYAPP")
    print("=" * 60)
    print(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)
    
    # 1. Statistiques générales
    print("\n1️⃣ STATISTIQUES GÉNÉRALES")
    await voir_statistiques_bdd()
    
    # 2. Liste des utilisateurs
    print("\n\n2️⃣ LISTE DES UTILISATEURS")
    users = await lister_tous_les_utilisateurs()
    
    # 3. Recherche d'utilisateurs suspects (test)
    print("\n\n3️⃣ DÉTECTION UTILISATEURS TEST")
    test_patterns = ["test", "demo", "essai", "exemple", "temp"]
    potential_test_users = []
    
    for user in users:
        name_lower = user['full_name'].lower()
        for pattern in test_patterns:
            if pattern in name_lower:
                potential_test_users.append(user)
                break
    
    if potential_test_users:
        print(f"⚠️  {len(potential_test_users)} utilisateurs potentiellement de test détectés:")
        for user in potential_test_users:
            print(f"  - {user['full_name']} (ID: {user['user_id']})")
    else:
        print("✅ Aucun utilisateur de test détecté")
    
    print("\n" + "=" * 60)
    print("✅ AUDIT TERMINÉ")
    print("=" * 60)
    
    return {
        "users": users,
        "potential_test_users": potential_test_users,
        "total_users": len(users)
    }

# =============================================================================
# FONCTIONS DE MAINTENANCE RAPIDE
# =============================================================================

async def maintenance_rapide():
    """Fonction de maintenance rapide pour nettoyer la BDD"""
    print("🚀 MAINTENANCE RAPIDE")
    print("=" * 40)
    
    # Nettoyage des données orphelines
    await nettoyer_donnees_orphelines()
    
    # Statistiques finales
    print("\n📊 STATISTIQUES APRÈS NETTOYAGE:")
    await voir_statistiques_bdd()

async def reset_complet_donnees_test():
    """DANGER: Supprimer TOUTES les données de test (ne garder que les vrais utilisateurs)"""
    print("⚠️  DANGER: RESET COMPLET DES DONNÉES DE TEST")
    print("Cette fonction supprime TOUS les utilisateurs de test")
    print("Utilisez avec extrême précaution !")
    print("=" * 60)
    
    # Supprimer les utilisateurs de test
    deleted_users = await supprimer_utilisateurs_test_par_nom()
    
    # Nettoyer les données orphelines
    await nettoyer_donnees_orphelines()
    
    # Statistiques finales
    print("\n📊 STATISTIQUES APRÈS RESET:")
    await voir_statistiques_bdd()
    
    return deleted_users
