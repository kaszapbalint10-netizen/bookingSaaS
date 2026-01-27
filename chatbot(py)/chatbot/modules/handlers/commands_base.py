# chatbot/modules/handlers/commands_base.py
import logging
from telegram import Update
from telegram.ext import ContextTypes

logger = logging.getLogger(__name__)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/start parancs kezelése - BACKEND HASZNÁLATÁVAL"""
    try:
        user = update.effective_user
        
        # BACKEND: Szalon konfiguráció lekérése
        from backend.database.salon_operations import get_opening_hours
        
        # Az első szalon nyitvatartásának lekérése
        salon_configs = {k: v for k, v in context.bot_data.get('CONFIG', {}).items() 
                        if isinstance(v, dict) and "token" in v}
        
        if salon_configs:
            first_salon = next(iter(salon_configs.keys()))
            opening_hours = await get_opening_hours(first_salon)
            
            # Nyitvatartás formázása
            hours_text = format_opening_hours(opening_hours)
        else:
            hours_text = "🕒 Nyitvatartás: 9:00 - 18:00 (Hétfő-Péntek)"
        
        welcome_text = (
            f"👋 **Üdvözöllek a Szalon Botban!**\n\n"
            f"{hours_text}\n\n"
            "💬 **Egyszerűen írd le, mikor szeretnél jönni!**\n"
            "Például: _\"Szeretnék holnap 14:00-ra hajvágásra Kovács Éva néven\"_\n\n"
            "🎯 **Parancsok:**\n"
            "/idopont - Időpontfoglalás\n"
            "/nyitvatartas - Nyitvatartás\n"
            "/help - Segítség"
        )
        
        await update.message.reply_text(welcome_text, parse_mode='Markdown')
        logger.info(f"✅ Start command: {user.first_name} ({user.id})")
        
    except Exception as e:
        logger.error(f"❌ Hiba a start parancsban: {e}")
        await update.message.reply_text("👋 Üdvözöllek! Írd le, mikor szeretnél jönni!")

def format_opening_hours(opening_hours):
    """Nyitvatartás formázása"""
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

async def quick_appointment_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/idopont parancs"""
    help_text = (
        "💬 **Egyszerűen írd le, mikor szeretnél jönni!**\n\n"
        "📝 **Példák:**\n"
        "• \"_holnap 14:00 hajvágásra Kovács Éva 06201234567_\"\n"
        "• \"_szeretnék jövő hét kedden jönni festésre_\"\n"
        "• \"_időpontot szeretnék_\"\n\n"
        "Én megértem, mit szeretnél! 😊"
    )
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def opening_hours_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/nyitvatartas parancs - BACKEND HASZNÁLATÁVAL"""
    try:
        # BACKEND: Szalon konfiguráció lekérése
        from backend.database.salon_operations import get_opening_hours
        
        salon_configs = {k: v for k, v in context.bot_data.get('CONFIG', {}).items() 
                        if isinstance(v, dict) and "token" in v}
        
        if not salon_configs:
            await update.message.reply_text("❌ Nincs szalon konfigurálva.")
            return
        
        first_salon = next(iter(salon_configs.keys()))
        opening_hours = await get_opening_hours(first_salon)
        hours_text = format_opening_hours(opening_hours)
        
        await update.message.reply_text(hours_text, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"❌ Hiba a nyitvatartás parancsban: {e}")
        await update.message.reply_text("❌ Hiba a nyitvatartás lekérésekor.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/help parancs"""
    help_text = (
        "🤖 **Intelligens Szalon Asszisztens**\n\n"
        "💬 **Beszélj velem természetesen:**\n"
        "• \"_holnap 14:00-ra szeretnék jönni hajvágásra_\"\n"
        "• \"_Kovács Éva vagyok, szeretnék időpontot_\"\n"
        "• \"_jövő hét szerdán mikor vagytok szabadok?_\"\n\n"
        "🎯 **Parancsok:**\n"
        "• /idopont - Időpontfoglalás\n"
        "• /nyitvatartas - Nyitvatartás\n"
        "• /help - Segítség\n\n"
        "Én megértem, amit írsz! 😊"
    )
    await update.message.reply_text(help_text, parse_mode='Markdown')