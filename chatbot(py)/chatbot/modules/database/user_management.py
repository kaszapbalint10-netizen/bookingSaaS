# modules/database/user_management.py
import logging
from backend.database.mysql_module import get_global_user_info, update_user_info, insert_global_user

logger = logging.getLogger(__name__)

async def get_user_session_data(chat_id: int):
    """User session adatok lekérése"""
    return await get_global_user_info(chat_id)

async def update_user_session(salon_name: str, chat_id: int, user_data: dict):
    """User adatok frissítése"""
    if user_data.get('name'):
        await update_user_info(salon_name, chat_id, user_data['name'])
    if user_data.get('name') and user_data.get('phone'):
        await insert_global_user(user_data['name'], chat_id, user_data['phone'])