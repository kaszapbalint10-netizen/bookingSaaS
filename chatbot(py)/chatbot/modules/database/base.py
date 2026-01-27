import logging
from typing import Dict, Any
from config import get_salon_configs
from backend.database.mysql_module import initialize_salon_database

logger = logging.getLogger(__name__)

async def initialize_system():
    """Rendszer inicializálása"""
    logger.info("🔧 Rendszer inicializálása...")
    
    # Szalon adatbázisok inicializálása
    salon_configs = get_salon_configs()
    for salon_name, cfg in salon_configs.items():
        try:
            await initialize_salon_database(salon_name)
            logger.info(f"✅ {salon_name} adatbázis inicializálva")
        except Exception as e:
            logger.error(f"❌ {salon_name} adatbázis hiba: {e}")