# modules/database/event_management.py
import logging
from typing import List, Dict, Any
from backend.database.event_operations import ( insert_event, fetch_events_for_user, update_event_status, get_all_users)
from backend.database.salon_operations import (get_opening_hours, get_available_slots, get_services, get_service_duration)    


logger = logging.getLogger(__name__)

async def get_salon_data(salon_name: str, date=None, service=None):
    """Szalon adatok lekérése"""
    opening_hours = await get_opening_hours(salon_name)
    services = await get_services(salon_name)
    
    available_slots = []
    if date and service:
        service_duration = await get_service_duration(salon_name, service)
        available_slots = await get_available_slots(salon_name, date, service_duration)
    
    return {
        'opening_hours': opening_hours,
        'services': services,
        'available_slots': available_slots
    }

async def handle_deleted_event(salon_name: str, event_id: str, application):
    """Törölt esemény kezelése - Application-mel"""
    try:
        from backend.database.event_operations import find_event_in_database, update_event_status
        
        events_data = await find_event_in_database(salon_name, event_id)
        
        if not events_data:
            logger.warning(f"⚠️ Esemény nem található az adatbázisban: {event_id}")
            return

        for event_data in events_data:
            chat_id = event_data['chat_id']
            service_name = event_data['service']
            event_time = event_data.get('event_time', 'ismeretlen időpont')

            message = (
                "❌ <b>IDŐPONT TÖRÖLVE</b>\n\n"
                "Az alábbi időpontot törölték a naptárból:\n"
                f"📅 <b>Időpont:</b> {event_time}\n"
                f"💇 <b>Szolgáltatás:</b> {service_name}\n"
                f"🏪 <b>Szalon:</b> {salon_name}\n\n"
                "Új időpontot foglalhatsz a <code>/idopont</code> paranccsal."
            )

            try:
                # ⚠️ JAVÍTÁS: Application bot-jának használata
                await application.bot.send_message(
                    chat_id=chat_id,
                    text=message,
                    parse_mode='HTML'
                )
                
                logger.info(f"✅ Törlés értesítés elküldve: {chat_id}")
                await update_event_status(salon_name, chat_id, event_id, 3)
                
            except Exception as e:
                logger.error(f"❌ Nem sikerült értesíteni a felhasználót {chat_id}: {e}")

    except Exception as e:
        logger.error(f"❌ Hiba a törölt esemény kezelésénél: {e}")