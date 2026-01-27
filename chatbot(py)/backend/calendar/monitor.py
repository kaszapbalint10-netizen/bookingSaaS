# backend/calendar/monitor.py - TELJESEN JAVÍTVA
import asyncio
import logging
import datetime
from typing import Dict, Set
import os
import sys

current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, current_dir)

logger = logging.getLogger(__name__)

class CalendarMonitor:
    """Google Calendar változások monitorozása - IDŐPONT ÉRTESÍTÉSSEL"""
    
    def __init__(self):
        self.is_running = False
    
    async def start_monitoring(self, application, salon_name: str, calendar_id: str):
        """Monitor indítása - IDŐPONT ÉRTESÍTÉSSEL"""
        self.is_running = True
        logger.info(f"🔍 Monitor elindítva: {salon_name}")
        
        while self.is_running:
            try:
                await asyncio.sleep(10)  # 5 perc
                
                # 1. CSAK A SAJÁT ESEMÉNYEINKET KÉRJÜK LE
                from backend.database.event_operations import get_all_events_from_database
                our_events = await get_all_events_from_database(salon_name)
                
                logger.info(f"🔍 {len(our_events)} saját esemény ellenőrzése")
                
                # 2. MINDEN SAJÁT ESEMÉNYT ELLENŐRZÜNK
                from backend.calendar.google_calendar import get_event
                from backend.database.event_operations import update_event_status
                
                for event_data in our_events:
                    event_id = event_data['event_id']
                    chat_id = event_data['chat_id']
                    service_name = event_data['service']
                    event_date = event_data['event_date']
                    start_time = event_data['start_time']
                    end_time = event_data['end_time']
                    formatted_time = f"{event_date} {start_time}"
                    
                    try:
                        # 3. MEGNÉZZÜK, LÉTEZIK-E MÉG - ÉS IDŐPONT ADATOKAT GYŰJTÜNK
                        event = get_event(event_id, calendar_id)
                        
                        # ✅ Még létezik - frissítjük az időpont adatokat
                        await self._update_event_time_from_google(salon_name, event_id, event, chat_id)
                        
                    except Exception as e:
                        # ❌ NEM LÉTEZIK - ÉRTESÍTJÜK IDŐPONTTAL
                        if "Event not found" in str(e) or "404" in str(e) or "cancelled" in str(e):
                            logger.warning(f"🗑️ ESEMÉNY TÖRÖLVE: {event_id} (User: {chat_id})")
                            
                            try:
                                # ⏰ IDŐPONT FORMÁZÁSA
                                event_time = self._format_event_time_for_message(event_data)
                                
                                # 📧 ÉRTESÍTJÜK A FELHASZNÁLÓT - IDŐPONTTAL
                                message = (
                                    "❌ <b>IDŐPONT TÖRÖLVE</b>\n\n"
                                    "Az alábbi időpontot törölték a naptárból:\n"
                                    f"💇 <b>Szolgáltatás:</b> {service_name}\n"
                                    f"🏪 <b>Szalon:</b> {salon_name}\n\n"
                                    f"📅 Dátum: {event_date}\n"
                                    f"⏰ Időtartam: {formatted_time}\n"
                                    "Új időpontot foglalhatsz a <code>/idopont</code> paranccsal."
                                )
                                
                                await application.bot.send_message(
                                    chat_id=chat_id,
                                    text=message,
                                    parse_mode='HTML'
                                )
                                logger.info(f"✅ Értesítés elküldve: {chat_id}")
                                
                                # 💾 ADATBÁZIS FRISSÍTÉSE (0 → 3)
                                await update_event_status(salon_name, chat_id, event_id, 3)
                                logger.info(f"✅ Státusz frissítve: {event_id} (0 → 3)")
                                
                            except Exception as notify_error:
                                logger.error(f"❌ Hiba az értesítés küldésénél: {notify_error}")
                                
                        else:
                            logger.error(f"❌ Egyéb hiba: {event_id} - {e}")
                
            except Exception as e:
                logger.error(f"❌ Hiba a monitorban ({salon_name}): {e}")
                await asyncio.sleep(300)

    def _format_event_time_for_message(self, event_data: dict) -> str:
        """Időpont formázása az üzenethez"""
        try:
            event_date = event_data.get('event_date')
            start_time = event_data.get('start_time')
            end_time = event_data.get('end_time')
            
            if event_date and start_time and end_time:
                # Dátum formázása
                date_obj = datetime.datetime.strptime(event_date, '%Y-%m-%d')
                formatted_date = date_obj.strftime('%Y.%m.%d')
                return f"{formatted_date} {start_time}-{end_time}"
            
            elif event_date and start_time:
                date_obj = datetime.datetime.strptime(event_date, '%Y-%m-%d')
                formatted_date = date_obj.strftime('%Y.%m.%d')
                return f"{formatted_date} {start_time}"
            
            elif event_date:
                date_obj = datetime.datetime.strptime(event_date, '%Y-%m-%d')
                return date_obj.strftime('%Y.%m.%d')
            
            else:
                return "Ismeretlen időpont"
                
        except Exception as e:
            logger.error(f"❌ Hiba az időpont formázásánál: {e}")
            return "Ismeretlen időpont"

    async def _update_event_time_from_google(self, salon_name: str, event_id: str, event: dict, chat_id: int):
        """Időpont adatok frissítése Google Calendar-ból"""
        try:
            from backend.database.event_operations import update_event_time
            
            start = event.get('start', {})
            end = event.get('end', {})
            
            start_time_str = start.get('dateTime', '')
            end_time_str = end.get('dateTime', '')
            
            if start_time_str:
                # ISO string feldolgozása
                start_dt = datetime.datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                
                event_date = start_dt.strftime('%Y-%m-%d')
                start_time = start_dt.strftime('%H:%M')
                
                end_time = None
                if end_time_str:
                    end_dt = datetime.datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                    end_time = end_dt.strftime('%H:%M')
                
                # Frissítjük az adatbázist
                await update_event_time(salon_name, event_id, event_date, start_time, end_time, chat_id)
                logger.info(f"✅ Esemény idő frissítve: {event_id} - {event_date} {start_time}")
                
        except Exception as e:
            logger.error(f"❌ Hiba az esemény idő frissítésénél: {e}")

    def stop_monitoring(self):
        """Monitor leállítása"""
        self.is_running = False
        logger.info("⏹️ Calendar monitor leállítva")

# Globális monitor példány
calendar_monitor = CalendarMonitor()