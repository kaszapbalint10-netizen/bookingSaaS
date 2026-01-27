import asyncio
import logging
import datetime
from typing import Dict, Any
from config import get_salon_configs

from backend.calendar.google_calendar import get_calendar_events
from modules.database.event_management import handle_deleted_event

logger = logging.getLogger(__name__)

async def monitor_calendar_changes(application, salon_name: str, cfg: Dict[str, Any]):
    """Google Calendar változások monitorozása - TÖRLÉS ÉSZLELÉSE"""
    logger.info(f"🔍 {salon_name}: Calendar monitor elindult")
    
    # Korábbi események nyilvántartása
    previous_events = set()
    
    while True:
        try:
            await asyncio.sleep(10)  
            
            # Aktuális események lekérése
            current_events = await get_calendar_events(salon_name, cfg["calendar_id"])
            current_event_ids = set(current_events.keys())
            
            # Törölt események észlelése
            deleted_events = previous_events - current_event_ids
            
            if deleted_events:
                for event_id in deleted_events:
                    await handle_deleted_event(salon_name, event_id, application.bot)
                    logger.info(f"🗑️ Törölt esemény észlelve: {event_id}")
            
            # Frissítjük az előző események listáját
            previous_events = current_event_ids
            
        except Exception as e:
            logger.error(f"❌ Hiba a calendar monitorban: {e}")
            await asyncio.sleep(30)

async def start_calendar_monitors(application):
    """Összes calendar monitor indítása"""
    monitor_tasks = []
    salon_configs = get_salon_configs()
    
    for salon_name, cfg in salon_configs.items():
        if cfg.get("calendar_id"):
            try:
                monitor_task = asyncio.create_task(
                    monitor_calendar_changes(application, salon_name, cfg)
                )
                monitor_tasks.append(monitor_task)
                logger.info(f"🔍 Calendar monitor elindítva: {salon_name}")
            except Exception as e:
                logger.error(f"❌ Calendar monitor hiba {salon_name}: {e}")
    
    return monitor_tasks