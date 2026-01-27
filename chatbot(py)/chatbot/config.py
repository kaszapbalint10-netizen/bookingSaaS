# config.py
import json
import os
from typing import Dict, Any
from dotenv import load_dotenv

# .env fájl betöltése
load_dotenv()

# Gemini AI beállítás
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Szalon konfigurációk betöltése .env fájlból
def _load_salon_configs() -> Dict[str, Any]:
    """Szalon konfigurációk betöltése .env-ből"""
    salons = {}
    
    # Ellenőrizze az összes lehetséges szalon nevét
    salon_names = os.getenv("SALON_NAMES", "").split(",")
    
    for salon_name in salon_names:
        salon_name = salon_name.strip()
        if not salon_name:
            continue
            
        salon_config = {
            "token": os.getenv(f"{salon_name.upper()}_TOKEN"),
            "database": os.getenv(f"{salon_name.upper()}_DATABASE"),
            "calendar_id": os.getenv(f"{salon_name.upper()}_CALENDAR_ID"),
            "service_account_file": os.getenv(f"{salon_name.upper()}_SERVICE_ACCOUNT_FILE"),
        }
        salons[salon_name] = salon_config
    
    return salons

CONFIG = _load_salon_configs()
if not CONFIG:
    print("⚠️ Nincs szalon konfiguráció betöltve. Ellenőrizze a .env fájlt.")

def get_salon_configs() -> Dict[str, Any]:
    """Összes szalon konfiguráció lekérése"""
    return {k: v for k, v in CONFIG.items() if isinstance(v, dict) and "token" in v}

def get_salon_config(salon_name: str) -> Dict[str, Any]:
    """Egy szalon konfigurációjának lekérése"""
    return CONFIG.get(salon_name, {})