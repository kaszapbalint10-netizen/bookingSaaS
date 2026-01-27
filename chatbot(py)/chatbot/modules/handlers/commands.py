from typing import Dict, Any
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
from config import get_salon_configs

from .messages import handle_intelligent_message
from .commands_base import (
    start_command, quick_appointment_command, 
    opening_hours_command, help_command
)

async def setup_handlers():
    """Handler-ek beállítása és alkalmazás létrehozása"""
    # Alkalmazás létrehozása (az első szalon tokenjével)
    salon_configs = get_salon_configs()
    if not salon_configs:
        raise Exception("Nincs érvényes szalon konfiguráció")
    
    first_salon_cfg = next(iter(salon_configs.values()))
    
    app = ApplicationBuilder().token(first_salon_cfg["token"]).build()

    # Handlerek regisztrálása
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("idopont", quick_appointment_command))
    app.add_handler(CommandHandler("nyitvatartas", opening_hours_command))
    app.add_handler(CommandHandler("help", help_command))
    
    # Intelligens üzenetkezelés
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), 
                                 handle_intelligent_message))
    
    return app