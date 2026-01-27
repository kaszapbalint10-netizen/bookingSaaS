# backend/database/user_operations.py
import asyncio
import logging
from mysql.connector import Error
from .mysql_module import get_db_connection
from .table_operations import (
    _ensure_global_users_table_exists,
    _ensure_salon_users_table_exists
)

logger = logging.getLogger(__name__)

async def insert_global_user(name: str, chat_id: int, phone: str = None):
    """Globális users DB-be mentés"""
    try:
        def db_task():
            conn = get_db_connection()
            _ensure_global_users_table_exists(conn)
            cur = conn.cursor()
            
            logger.info(f"🔍 MySQL: insert_global_user - name: {name}, chat_id: {chat_id}, phone: {phone}")
            
            if phone:
                cur.execute("""
                    INSERT INTO users (chat_id, name, num)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name),
                        num = VALUES(num)
                """, (chat_id, name, phone))
                logger.info(f"✅ MySQL: Telefonszámmal mentve: {phone}")
            else:
                cur.execute("""
                    INSERT INTO users (chat_id, name)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                """, (chat_id, name))
                logger.info("✅ MySQL: Csak névvel mentve")
                
            conn.commit()
            cur.close()
            conn.close()
            
        await asyncio.to_thread(db_task)
        logger.info(f"✅ Global user mentve: {name} ({chat_id}) - Telefon: {phone}")
    except Error as e:
        logger.error(f"⚠️ DB hiba (insert_global_user): {e}")

async def get_global_user_info(chat_id: int) -> dict:
    """Globális user információk lekérése"""
    try:
        def db_task():
            conn = get_db_connection()
            _ensure_global_users_table_exists(conn)
            cur = conn.cursor()
            cur.execute("SELECT name, num FROM users WHERE chat_id = %s", (chat_id,))
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            logger.info(f"🔍 MySQL: get_global_user_info - chat_id: {chat_id}, result: {result}")
            
            if result:
                user_info = {'name': result[0], 'phone': result[1]}
                logger.info(f"✅ MySQL: User info találat: {user_info}")
                return user_info
            else:
                logger.info("❌ MySQL: Nincs user info a chat_id-hez")
                return {}
            
        return await asyncio.to_thread(db_task)
    except Error as e:
        logger.error(f"⚠️ DB hiba (get_global_user_info): {e}")
        return {}

async def get_user_info(salon_name: str, chat_id: int) -> dict:
    """User információk lekérése a szalon users táblából"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_salon_users_table_exists(conn)
            cur = conn.cursor()
            cur.execute("SELECT nev FROM users WHERE chat_id = %s", (chat_id,))
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if result:
                return {'name': result[0]}
            return {}
            
        return await asyncio.to_thread(db_task)
    except Error as e:
        logger.error(f"⚠️ DB hiba (get_user_info): {e}")
        return {}

async def update_user_info(salon_name: str, chat_id: int, name: str):
    """User információk frissítése a szalon users táblában"""
    try:
        def db_task():
            conn = get_db_connection(salon_name)
            _ensure_salon_users_table_exists(conn)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO users (chat_id, nev)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE nev = VALUES(nev)
            """, (chat_id, name))
                
            conn.commit()
            cur.close()
            conn.close()
            
        await asyncio.to_thread(db_task)
        logger.info(f"✅ User info frissítve: {salon_name} - {name}")
    except Error as e:
        logger.error(f"⚠️ DB hiba (update_user_info): {e}")