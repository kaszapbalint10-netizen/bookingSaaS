# backend/shared/time_utils.py
import datetime
import logging

logger = logging.getLogger(__name__)

def add_minutes_to_time(time_obj: datetime.time, minutes: int) -> datetime.time:
    """Időhöz perceket ad"""
    full_datetime = datetime.datetime.combine(datetime.date.today(), time_obj)
    new_datetime = full_datetime + datetime.timedelta(minutes=minutes)
    return new_datetime.time()

def times_overlap(start1: datetime.time, end1: datetime.time, 
                   start2: datetime.time, end2: datetime.time) -> bool:
    """Ellenőrzi, hogy két időintervallum átfed-e"""
    dt_start1 = datetime.datetime.combine(datetime.date.today(), start1)
    dt_end1 = datetime.datetime.combine(datetime.date.today(), end1)
    dt_start2 = datetime.datetime.combine(datetime.date.today(), start2)
    dt_end2 = datetime.datetime.combine(datetime.date.today(), end2)
    
    overlap = (dt_start1 < dt_end2 and dt_end1 > dt_start2)
    
    if overlap:
        logger.info(f"🔍 Átfedés: {start1}-{end1} és {start2}-{end2}")
    
    return overlap