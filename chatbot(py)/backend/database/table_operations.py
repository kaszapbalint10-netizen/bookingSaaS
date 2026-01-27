# backend/database/table_operations.py
import re
import logging
from .mysql_module import get_db_connection
import asyncio
from mysql.connector import Error


logger = logging.getLogger(__name__)

def _ensure_global_users_table_exists(conn):
    """Globális users tábla létrehozása (chat_id, name, num)"""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            chat_id BIGINT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            num VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cur.close()

def _ensure_salon_users_table_exists(conn):
    """Szalon users tábla létrehozása (chat_id, név)"""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            chat_id BIGINT PRIMARY KEY,
            nev VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cur.close()

def _ensure_opening_hours_table_exists(conn):
    """Nyitvatartás tábla létrehozása"""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS opening_hours (
            day_of_week INT PRIMARY KEY,
            open_time TIME NOT NULL,
            close_time TIME NOT NULL,
            is_closed BOOLEAN DEFAULT FALSE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cur.close()

def _ensure_services_table_exists(conn):
    """Szolgáltatások tábla létrehozása (service, time)"""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS services (
            service VARCHAR(100) PRIMARY KEY,
            time INT NOT NULL DEFAULT 60
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cur.close()

# backend/database/table_operations.py - FRISSÍTETT
def _ensure_user_events_table_exists(conn, chat_id: int):
    """User események tábla létrehozása - BŐVÍTVE IDŐPONT ADATOKKAL"""
    _assert_numeric_chat_id(chat_id)
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS `{chat_id}` (
            event_id VARCHAR(255) PRIMARY KEY,
            status TINYINT NOT NULL DEFAULT 0,
            service VARCHAR(100) NOT NULL,
            event_date DATE,              -- ✅ ÚJ: Dátum
            start_time TIME,              -- ✅ ÚJ: Kezdési idő
            end_time TIME,                -- ✅ ÚJ: Befejezési idő
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    cur.close()

def _assert_numeric_chat_id(chat_id: int | str):
    """Chat ID biztonsági ellenőrzés"""
    if not re.fullmatch(r"\d+", str(chat_id)):
        raise ValueError("chat_id must be digits-only")

async def initialize_salon_database(salon_name: str):
    """Szalon adatbázis inicializálása"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_salon_users_table_exists(conn)
            _ensure_opening_hours_table_exists(conn)
            _ensure_services_table_exists(conn)
            conn.close()
            
        await asyncio.to_thread(db_task)
        logger.info(f"✅ {salon_name} adatbázis inicializálva")
    except Error as e:
        logger.error(f"⚠️ DB hiba (initialize_salon_database): {e}")