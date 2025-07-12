import asyncpg
import databutton as db
from app.env import Mode, mode
import asyncio
from typing import Optional
from contextlib import asynccontextmanager
import logging

# Configuration du pool selon l'environnement
POOL_CONFIG = {
    Mode.DEV: {
        "min_size": 3,
        "max_size": 10,
        "max_queries": 10000,
        "max_inactive_connection_lifetime": 300.0,  # 5 minutes
        "timeout": 30.0,
        "command_timeout": 10.0
    },
    Mode.PROD: {
        "min_size": 5,
        "max_size": 20,
        "max_queries": 50000,
        "max_inactive_connection_lifetime": 300.0,  # 5 minutes
        "timeout": 30.0,
        "command_timeout": 15.0
    }
}

class DatabasePool:
    """Gestionnaire de pool de connexions asyncpg singleton"""
    
    _instance: Optional['DatabasePool'] = None
    _pool: Optional[asyncpg.Pool] = None
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def initialize(self) -> None:
        """Initialise le pool de connexions"""
        if self._pool is not None:
            return
        
        async with self._lock:
            if self._pool is not None:
                return
            
            try:
                # Récupérer l'URL de la base de données selon l'environnement
                database_url = db.secrets.get(
                    "DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD"
                )
                
                if not database_url:
                    raise ValueError(f"DATABASE_URL not found for mode {mode}")
                
                # Configuration du pool selon l'environnement
                config = POOL_CONFIG[mode]
                
                print(f"🚀 Initializing database pool for {mode.value} environment...")
                print(f"Pool config: {config}")
                
                # Créer le pool de connexions
                self._pool = await asyncpg.create_pool(
                    dsn=database_url,
                    **config
                )
                
                print(f"✅ Database pool initialized successfully with {config['min_size']}-{config['max_size']} connections")
                
            except Exception as e:
                print(f"❌ Failed to initialize database pool: {e}")
                raise
    
    async def close(self) -> None:
        """Ferme le pool de connexions"""
        if self._pool is not None:
            async with self._lock:
                if self._pool is not None:
                    await self._pool.close()
                    self._pool = None
                    print("🔒 Database pool closed")
    
    async def get_pool(self) -> asyncpg.Pool:
        """Récupère le pool de connexions, l'initialise si nécessaire"""
        if self._pool is None:
            await self.initialize()
        
        if self._pool is None:
            raise RuntimeError("Failed to initialize database pool")
        
        return self._pool
    
    @asynccontextmanager
    async def acquire_connection(self):
        """Context manager pour acquérir et libérer une connexion du pool"""
        pool = await self.get_pool()
        connection = None
        
        try:
            connection = await pool.acquire()
            yield connection
        except Exception as e:
            print(f"❌ Database connection error: {e}")
            raise
        finally:
            if connection is not None:
                try:
                    await pool.release(connection)
                except Exception as e:
                    print(f"⚠️ Error releasing connection: {e}")
    
    async def get_pool_status(self) -> dict:
        """Retourne les statistiques du pool de connexions"""
        if self._pool is None:
            return {"status": "not_initialized"}
        
        return {
            "status": "active",
            "size": self._pool.get_size(),
            "min_size": self._pool.get_min_size(),
            "max_size": self._pool.get_max_size(),
            "idle_connections": self._pool.get_idle_size(),
            "mode": mode.value
        }

# Instance globale du pool
db_pool = DatabasePool()

# Fonctions helper pour les APIs
def get_db_connection():
    """Helper pour acquérir une connexion dans les APIs"""
    return db_pool.acquire_connection()

async def get_pool_stats():
    """Helper pour récupérer les stats du pool"""
    return await db_pool.get_pool_status()

# Fonction d'initialisation pour le démarrage de l'app
async def initialize_database_pool():
    """Fonction à appeler au démarrage de l'application"""
    await db_pool.initialize()

# Fonction de nettoyage pour l'arrêt de l'app
async def close_database_pool():
    """Fonction à appeler à l'arrêt de l'application"""
    await db_pool.close()
