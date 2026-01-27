# backend/calendar/google_calendar.py
import datetime
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from typing import List, Tuple

logger = logging.getLogger(__name__)

SERVICE_ACCOUNT_FILE = "d:/wired-victor-472511-g0-1512c0260e32.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]

def get_calendar_service():
    """Google Calendar service létrehozása"""
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("calendar", "v3", credentials=credentials, cache_discovery=False)

def create_event(start_dt: datetime.datetime, calendar_id: str, service_name: str, duration_minutes: int = 60):
    """Esemény létrehozása"""
    service = get_calendar_service()
    
    end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)
    
    event = {
        "summary": service_name,
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "Europe/Budapest"},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": "Europe/Budapest"},
    }
    
    try:
        result = service.events().insert(calendarId=calendar_id, body=event).execute()
        logger.info(f"✅ Esemény létrehozva: {result.get('id')}")
        return result
    except Exception as e:
        logger.error(f"❌ Hiba az esemény létrehozásánál: {e}")
        raise

def delete_event(event_id: str, calendar_id: str):
    """Esemény törlése"""
    service = get_calendar_service()
    
    try:
        service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
        logger.info(f"✅ Esemény törölve: {event_id}")
    except Exception as e:
        logger.error(f"❌ Hiba az esemény törlésénél: {e}")
        raise

def get_busy_slots(calendar_id: str, date: datetime.date) -> List[Tuple]:
    """Foglalt időpontok lekérése egy napra"""
    service = get_calendar_service()
    
    try:
        start_time = datetime.datetime.combine(date, datetime.time.min).replace(
            tzinfo=datetime.timezone(datetime.timedelta(hours=1))
        ).isoformat()
        
        end_time = datetime.datetime.combine(date, datetime.time.max).replace(
            tzinfo=datetime.timezone(datetime.timedelta(hours=1))
        ).isoformat()
        
        body = {
            "timeMin": start_time,
            "timeMax": end_time,
            "timeZone": "Europe/Budapest",
            "items": [{"id": calendar_id}]
        }
        
        events_result = service.freebusy().query(body=body).execute()
        calendars = events_result.get('calendars', {})
        calendar = calendars.get(calendar_id, {})
        busy_slots = calendar.get('busy', [])
        
        busy_times = []
        for slot in busy_slots:
            start = datetime.datetime.fromisoformat(slot['start'].replace('Z', '+00:00')).astimezone()
            end = datetime.datetime.fromisoformat(slot['end'].replace('Z', '+00:00')).astimezone()
            busy_times.append((start.time(), end.time()))
        
        logger.info(f"🔍 Foglalt időpontok {date}: {len(busy_times)} db")
        return busy_times
        
    except Exception as e:
        logger.error(f"⚠️ Google Calendar hiba: {e}")
        return []


def get_event(event_id: str, calendar_id: str) -> dict:
    """Egy specifikus esemény lekérése - JAVÍTOTT TÖRLÉSÉSZLELÉSSEL"""
    service = get_calendar_service()
    
    try:
        logger.info(f"🔍 Esemény lekérése: {event_id}")
        
        event = service.events().get(
            calendarId=calendar_id, 
            eventId=event_id
        ).execute()
        
        # ⚠️ HA IDE JUTUNK, AZ ESEMÉNY MÉG LÉTEZIK
        event_summary = event.get('summary', 'Névtelen')
        event_status = event.get('status', 'confirmed')
        
        logger.info(f"✅ Esemény lekérve: {event_summary} (Státusz: {event_status})")
        
        # Ellenőrizzük, hogy "törölt" státuszú-e
        if event_status == 'cancelled':
            logger.info(f"🗑️ Esemény TÖRÖLVE (cancelled): {event_id}")
            raise Exception(f"Event cancelled: {event_id}")
            
        return event
        
    except Exception as e:
        error_msg = str(e)
        
        if "404" in error_msg or "Not Found" in error_msg or "event not found" in error_msg.lower() or "cancelled" in error_msg.lower():
            logger.info(f"🗑️ Esemény TÖRÖLVE: {event_id}")
            raise Exception(f"Event not found: {event_id}")
        else:
            logger.error(f"❌ Egyéb hiba: {e}")
            raise