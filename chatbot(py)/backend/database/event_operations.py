# backend/database/event_operations.py
import asyncio
import logging
from typing import List, Dict
from mysql.connector import Error
from .mysql_module import get_db_connection
from .table_operations import (
    _ensure_user_events_table_exists,
    _assert_numeric_chat_id
)

logger = logging.getLogger(__name__)

# backend/database/event_operations.py - DEBUG VERZIÓ
async def insert_event(salon_name: str, chat_id: int, event_id: str, service: str, 
                     event_date: str = None, start_time: str = None, end_time: str = None, 
                     status: int = 0):
    """Esemény beszúrása - RÉSZLETES DEBUG"""
    try:
        print(f"🔍 DEBUG insert_event CALLED:")
        print(f"   salon: {salon_name}")
        print(f"   chat_id: {chat_id}") 
        print(f"   event_id: {event_id}")
        print(f"   service: {service}")
        print(f"   event_date: {event_date}")
        print(f"   start_time: {start_time}")
        print(f"   end_time: {end_time}")
        print(f"   status: {status}")
        
        # ⚠️ NULL értékek ellenőrzése
        if event_date is None:
            print("❌ WARNING: event_date is None!")
        if start_time is None:
            print("❌ WARNING: start_time is None!")
        if end_time is None:
            print("❌ WARNING: end_time is None!")
        
        _assert_numeric_chat_id(chat_id)

        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_user_events_table_exists(conn, chat_id)
            
            cur = conn.cursor()
            
            # Debug a tényleges SQL végrehajtás előtt
            print(f"🔍 DEBUG SQL VALUES: {event_date}, {start_time}, {end_time}")
            
            cur.execute(f"""
                INSERT INTO `{chat_id}` (event_id, status, service, event_date, start_time, end_time)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    status = VALUES(status),
                    service = VALUES(service),
                    event_date = VALUES(event_date),
                    start_time = VALUES(start_time),
                    end_time = VALUES(end_time)
            """, (event_id, status, service, event_date, start_time, end_time))
            
            conn.commit()
            
            # Ellenőrizzük a beszúrt adatokat
            cur.execute(f"SELECT event_date, start_time, end_time FROM `{chat_id}` WHERE event_id = %s", (event_id,))
            result = cur.fetchone()
            print(f"🔍 DEBUG INSERT RESULT: {result}")
            
            cur.close()
            conn.close()
            
        await asyncio.to_thread(db_task)
        logger.info(f"✅ Event {event_id} hozzáadva")
        
    except Error as e:
        logger.error(f"⚠️ DB hiba (insert_event): {e}")
        print(f"❌ DEBUG: Hiba az insert_event-ben: {e}")
    except Exception as e:
        logger.error(f"⚠️ Egyéb hiba (insert_event): {e}")
        print(f"❌ DEBUG: Egyéb hiba: {e}")

async def fetch_events_for_user(salon_name: str, chat_id: int):
    """User eseményeinek lekérése"""
    try:
        _assert_numeric_chat_id(chat_id)

        def db_task():
            conn = get_db_connection(salon_name)
            cur = conn.cursor()
            try:
                cur.execute(f"SELECT event_id, status, service FROM `{chat_id}`")
                rows = cur.fetchall()
            except Error:
                rows = []
            cur.close()
            conn.close()
            return rows
            
        return await asyncio.to_thread(db_task)
    except Error as e:
        logger.error(f"⚠️ DB hiba (fetch_events_for_user): {e}")
        return []

async def update_event_status(salon_name: str, chat_id: int, event_id: str, status: int):
    """Esemény státusz frissítése"""
    try:
        _assert_numeric_chat_id(chat_id)

        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_user_events_table_exists(conn, chat_id)
            cur = conn.cursor()
            cur.execute(f"UPDATE `{chat_id}` SET status=%s WHERE event_id=%s", (status, event_id))
            conn.commit()
            cur.close()
            conn.close()
            
        await asyncio.to_thread(db_task)
        logger.info(f"♻️ Event {event_id} státusza frissítve: {status}")
    except Error as e:
        logger.error(f"⚠️ DB hiba (update_event_status): {e}")

async def get_all_users(salon_name: str) -> List[Dict]:
    """Összes user lekérése a szalon adatbázisából"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            cur = conn.cursor()
            
            try:
                cur.execute("SELECT chat_id FROM users")
                users = cur.fetchall()
                
                user_list = []
                for user in users:
                    user_list.append({'chat_id': user[0]})
                
                return user_list
                
            except Error:
                return []
            finally:
                cur.close()
                conn.close()
        
        return await asyncio.to_thread(db_task)
        
    except Exception as e:
        logger.error(f"❌ Hiba a userek lekérésénél: {e}")
        return []
    
# backend/database/event_operations.py - BŐVÍTVE
async def find_event_in_database(salon_name: str, event_id: str) -> List[Dict]:
    """Esemény keresése az adatbázisban"""
    try:


        users = await get_all_users(salon_name)
        
        events_data = []
        
        for user in users:
            chat_id = user['chat_id']
            user_events = await fetch_events_for_user(salon_name, chat_id)
            
            for event in user_events:
                db_event_id, status, service = event
                if db_event_id == event_id:
                    events_data.append({
                        'chat_id': chat_id,
                        'service': service,
                        'event_time': 'ismeretlen időpont',
                        'status': status
                    })
        
        print(f"🔍 DEBUG: VÉGEREDMÉNY: {len(events_data)} esemény található")
        return events_data
        
    except Exception as e:
        print(f"❌ DEBUG Hiba: {e}")
        return []
    
# backend/database/event_operations.py
# Add hozzá a többi függvény mellé:

# backend/database/event_operations.py - JAVÍTOTT get_all_events_from_database
async def get_all_events_from_database(salon_name: str) -> List[Dict]:
    """ÖSSZES esemény lekérése az adatbázisból - JAVÍTOTT IDŐPONT ADATOKKAL"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            cur = conn.cursor()
            
            # 1. Összes tábla lekérése
            cur.execute("SHOW TABLES")
            all_tables = cur.fetchall()
            
            # 2. Kiszűrjük csak a számokat tartalmazó táblaneveket
            user_tables = []
            for table in all_tables:
                table_name = table[0]
                if table_name.isdigit():
                    user_tables.append(table_name)
            
            print(f"🔍 DEBUG: User táblák: {user_tables}")
            
            all_events = []
            
            # 3. Minden user összes eseménye - ⭐ JAVÍTÁS: IDŐPONT ADATOK IS
            for table_name in user_tables:
                try:
                    chat_id = int(table_name)
                    print(f"🔍 DEBUG: {table_name} tábla ellenőrzése...")
                    
                    # ⭐ JAVÍTÁS: event_date, start_time, end_time mezők is lekérdezve
                    cur.execute(f"""
                        SELECT event_id, status, service, event_date, start_time, end_time 
                        FROM `{table_name}` 
                        WHERE status = 0
                    """)
                    active_events = cur.fetchall()
                    print(f"🔍 DEBUG: {table_name} aktív eseményei: {len(active_events)} db")
                    
                    for event in active_events:
                        # ⭐ JAVÍTÁS: Minden időpont adatot hozzáadunk
                        all_events.append({
                            'event_id': event[0],
                            'chat_id': chat_id,
                            'status': event[1],
                            'service': event[2],
                            'event_date': event[3],  # ✅ Dátum
                            'start_time': event[4],  # ✅ Kezdési idő
                            'end_time': event[5]     # ✅ Befejezési idő
                        })
                        
                        # Debug: nézzük meg az időpont adatokat
                        print(f"  asdasdsa - {event[0]}: {event[3]} {event[4]}-{event[5]}")
                        
                except Exception as e:
                    print(f"❌ DEBUG: Hiba a {table_name} táblánál: {e}")
                    continue
            
            cur.close()
            conn.close()
            print(f"🔍 DEBUG: VÉGEREDMÉNY: {len(all_events)} esemény, időpontokkal")
            return all_events
            
        return await asyncio.to_thread(db_task)
        
    except Exception as e:
        logger.error(f"❌ Hiba az események lekérésénél: {e}")
        print(f"❌ DEBUG: get_all_events_from_database hiba: {e}")
        return []
    
# backend/database/event_operations.py - ÚJ FÜGGVÉNY
# backend/database/event_operations.py - JAVÍTOTT FÜGGVÉNY
async def update_event_time(salon_name: str, event_id: str, event_date: str, 
                          start_time: str, end_time: str = None, chat_id: int = None):
    """Esemény időpontjának frissítése az adatbázisban"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            cur = conn.cursor()
            
            if chat_id:
                # Frissítjük a specifikus user tábláját
                cur.execute(f"""
                    UPDATE `{chat_id}` 
                    SET event_date = %s, start_time = %s, end_time = %s 
                    WHERE event_id = %s
                """, (event_date, start_time, end_time, event_id))
            else:
                # Keresünk minden user táblájában - SYNC verzió
                try:
                    # Users lekérése sync módon
                    cur.execute("SELECT chat_id FROM users")
                    users = cur.fetchall()
                    
                    for user in users:
                        user_chat_id = user[0]
                        try:
                            cur.execute(f"""
                                UPDATE `{user_chat_id}` 
                                SET event_date = %s, start_time = %s, end_time = %s 
                                WHERE event_id = %s
                            """, (event_date, start_time, end_time, event_id))
                        except Exception as user_error:
                            # Ha a user tábla nem létezik, megyünk tovább
                            continue
                            
                except Exception as e:
                    logger.error(f"❌ Hiba a users lekérésénél: {e}")
            
            conn.commit()
            cur.close()
            conn.close()
            
        await asyncio.to_thread(db_task)
        logger.info(f"✅ Esemény idő frissítve: {event_id}")
        
    except Exception as e:
        logger.error(f"❌ Hiba az esemény idő frissítésénél: {e}")