import html
import datetime
import logging
from typing import Optional, Dict, Any, Tuple
from config import get_salon_configs

logger = logging.getLogger(__name__)

def esc(x) -> str:
    """HTML escape"""
    return html.escape(str(x), quote=False)

def format_opening_hours(opening_hours) -> str:
    """Formázza a nyitvatartást"""
    days = {
        1: "Hétfő", 2: "Kedd", 3: "Szerda", 4: "Csütörtök",
        5: "Péntek", 6: "Szombat", 7: "Vasárnap"
    }
    
    result = "🕒 **Nyitvatartás:**\n"
    
    for day in opening_hours:
        day_num, open_time, close_time, is_closed = day
        day_name = days.get(day_num, f"Nap {day_num}")
        
        if is_closed:
            result += f"❌ {day_name}: ZÁRVA\n"
        else:
            open_str = open_time.strftime('%H:%M') if hasattr(open_time, 'strftime') else str(open_time)
            close_str = close_time.strftime('%H:%M') if hasattr(close_time, 'strftime') else str(close_time)
            result += f"✅ {day_name}: {open_str} - {close_str}\n"
    
    return result

async def get_salon_config_for_user(user_id: int) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Szalon konfiguráció lekérése"""
    try:
        salon_configs = get_salon_configs()
        for salon_name, cfg in salon_configs.items():
            if isinstance(cfg, dict) and "token" in cfg:
                return salon_name, cfg
        return None, None
    except Exception as e:
        logger.error(f"Hiba a szalon konfig lekérésekor: {e}")
        return None, None