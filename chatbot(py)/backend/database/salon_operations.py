# backend/database/salon_operations.py
import asyncio
import datetime
import logging
from mysql.connector import Error
from .mysql_module import get_db_connection
from .table_operations import (
    _ensure_opening_hours_table_exists,
    _ensure_services_table_exists
)
from ..shared.time_utils import add_minutes_to_time, times_overlap

logger = logging.getLogger(__name__)

async def get_opening_hours(salon_name: str):
    """Nyitvatartás lekérése"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_opening_hours_table_exists(conn)
            cur = conn.cursor()
            cur.execute("""
                SELECT day_of_week, open_time, close_time, is_closed 
                FROM opening_hours 
                ORDER BY day_of_week
            """)
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return rows
        return await asyncio.to_thread(db_task)
    except Error as e:
        logger.error(f"⚠️ DB hiba (get_opening_hours): {e}")
        return []

async def get_available_slots(salon_name: str, date: datetime.date, service_duration: int = 60, calendar_id: str = None):
    """Szabad időpontok lekérése"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_opening_hours_table_exists(conn)
            
            python_weekday = date.weekday()
            db_weekday = python_weekday + 1
            
            cur = conn.cursor()
            cur.execute("""
                SELECT open_time, close_time, is_closed 
                FROM opening_hours 
                WHERE day_of_week = %s
            """, (db_weekday,))
            
            opening = cur.fetchone()
            if not opening or opening[2]:
                return []
            
            open_time = opening[0]
            close_time = opening[1]
            
            if isinstance(open_time, datetime.timedelta):
                open_time = (datetime.datetime.min + open_time).time()
            if isinstance(close_time, datetime.timedelta):
                close_time = (datetime.datetime.min + close_time).time()
            
            all_slots = []
            current_hour = open_time.hour
            current_minute = open_time.minute
            
            close_hour = close_time.hour
            close_minute = close_time.minute
            
            while True:
                end_minute = current_minute + service_duration
                end_hour = current_hour + (end_minute // 60)
                end_minute = end_minute % 60
                
                if end_hour > close_hour or (end_hour == close_hour and end_minute > close_minute):
                    break
                
                time_obj = datetime.time(current_hour, current_minute)
                all_slots.append(time_obj)
                
                current_minute += 30
                if current_minute >= 60:
                    current_hour += 1
                    current_minute = current_minute % 60
                
                if current_hour > close_hour or (current_hour == close_hour and current_minute > close_minute):
                    break
            
            cur.close()
            conn.close()
            return all_slots
            
        all_slots = await asyncio.to_thread(db_task)
        
        if not calendar_id:
            logger.info(f"🔍 Nincs calendar_id, minden időpont elérhető: {len(all_slots)} db")
            return all_slots
        
        try:
            from ..calendar.google_calendar import get_busy_slots
            busy_slots = await asyncio.to_thread(get_busy_slots, calendar_id, date)
            
            logger.info(f"🔍 Foglalt időpontok: {len(busy_slots)} db")
            logger.info(f"🔍 Összes lehetséges időpont: {len(all_slots)} db")
            
            available_slots = []
            for slot in all_slots:
                slot_start = slot
                slot_end = add_minutes_to_time(slot, service_duration)
                
                is_available = True
                for busy_start, busy_end in busy_slots:
                    if times_overlap(slot_start, slot_end, busy_start, busy_end):
                        is_available = False
                        logger.info(f"❌ Időpont foglalt: {slot_start} - {slot_end} ütközik {busy_start} - {busy_end}")
                        break
                
                if is_available:
                    available_slots.append(slot)
                    logger.info(f"✅ Időpont szabad: {slot_start}")
            
            logger.info(f"🔍 Szabad időpontok: {len(available_slots)} db")
            return available_slots
            
        except Exception as e:
            logger.error(f"⚠️ Google Calendar hiba, minden időpontot visszaadunk: {e}")
            return all_slots
            
    except Error as e:
        logger.error(f"⚠️ DB hiba (get_available_slots): {e}")
        return []

async def get_services(salon_name: str):
    """Szolgáltatások lekérése (service, time)"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_services_table_exists(conn)
            cur = conn.cursor()
            cur.execute("SELECT service, time FROM services")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return rows
        return await asyncio.to_thread(db_task)
    except Error as e:
        logger.error(f"⚠️ DB hiba (get_services): {e}")
        return []

async def get_service_duration(salon_name: str, service_name: str) -> int:
    """Szolgáltatás időtartamának lekérése"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_services_table_exists(conn)
            cur = conn.cursor()
            cur.execute("SELECT time FROM services WHERE service = %s", (service_name,))
            result = cur.fetchone()
            cur.close()
            conn.close()
            return result[0] if result else 60
            
        return await asyncio.to_thread(db_task)
    except Error as e:
        logger.error(f"⚠️ DB hiba (get_service_duration): {e}")
        return 60