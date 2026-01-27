import mysql.connector
from mysql.connector import Error
import logging

logger = logging.getLogger(__name__)

# ------------------ KONFIG ------------------
DB_HOST = "192.168.112.102"
DB_USER = "test1"
DB_PASS = "test1"
GLOBAL_DB_NAME = "users"

def get_db_connection(database_name: str = None):
    """Kapcsolódás az adatbázishoz"""
    try:
        return mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=database_name if database_name else GLOBAL_DB_NAME
        )
    except Error as e:
        logger.error(f"⚠️ Kapcsolati hiba: {e}")
        raise