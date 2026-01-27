# chatbot/main.py - MULTI-BOT VERZIÓ
import asyncio
import logging
import json
import os
import sys
from typing import Dict, List, Any
from telegram.ext import CommandHandler, MessageHandler, filters, ContextTypes
from telegram import Update


# ABSZOLÚT útvonalak
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')

print(f"🔍 Current dir: {current_dir}")
print(f"🔍 Backend dir: {backend_dir}")

# Hozzáadjuk MINDKÉT mappát a path-hoz
sys.path.insert(0, current_dir)  # chatbot mappa
sys.path.insert(0, os.path.dirname(backend_dir))  # backend szülő mappa

print(f"🔍 Python path: {sys.path}")

# Konfig betöltése
config_path = os.path.join(current_dir, "config.json")
try:
    with open(config_path, "r", encoding="utf-8") as f:
        CONFIG = json.load(f)
    print("✅ config.json betöltve")
except FileNotFoundError:
    print("❌ config.json nem található")
    CONFIG = {}

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def setup_handlers(application, salon_name: str):
    """Handler-ek beállítása egy bot számára"""
    try:
        from modules.handlers.commands_base import (
            start_command, quick_appointment_command, 
            opening_hours_command, help_command
        )
        from modules.handlers.messages import handle_intelligent_message
        
        # Parancs handler-ek
        application.add_handler(CommandHandler("start", start_command))
        application.add_handler(CommandHandler("idopont", quick_appointment_command))
        application.add_handler(CommandHandler("nyitvatartas", opening_hours_command))
        application.add_handler(CommandHandler("help", help_command))
        
        # Üzenet handler - SALON SPECIFIKUS
        async def salon_specific_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
            context.bot_data['salon_name'] = salon_name
            await handle_intelligent_message(update, context)
        
        application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), salon_specific_message_handler))
        
        logger.info(f"✅ Handler-ek regisztrálva: {salon_name}")
        
    except ImportError as e:
        logger.error(f"❌ Handler import hiba ({salon_name}): {e}")
        
        # Fallback handler-ek
        async def fallback_start(update, context):
            await update.message.reply_text(f"👋 Üdvözöllek a {salon_name}-ban! Írd le, mikor szeretnél jönni!")
        
        async def fallback_message(update, context):
            await update.message.reply_text(f"🤖 {salon_name} bot működik!")
        
        application.add_handler(CommandHandler("start", fallback_start))
        application.add_handler(MessageHandler(filters.TEXT, fallback_message))

async def setup_telegram_bots() -> Dict[str, Any]:
    """Több Telegram bot beállítása és indítása"""
    try:
        from telegram.ext import ApplicationBuilder, ContextTypes
        from telegram import Update
        from telegram.ext import filters
        
        applications = {}
        
        # Szalon konfigurációk
        salon_configs = {k: v for k, v in CONFIG.items() if isinstance(v, dict) and "token" in v}
        
        if not salon_configs:
            raise Exception("Nincs érvényes szalon konfiguráció")
        
        for salon_name, cfg in salon_configs.items():
            try:
                print(f"🤖 Bot indítása: {salon_name}")
                
                # Bot létrehozása
                app = ApplicationBuilder().token(cfg["token"]).build()
                
                # Bot adatokba mentjük a konfigot és szalon nevet
                app.bot_data['CONFIG'] = CONFIG
                app.bot_data['salon_name'] = salon_name
                app.bot_data['salon_config'] = cfg
                
                # Handler-ek beállítása
                setup_handlers(app, salon_name)
                
                applications[salon_name] = app
                logger.info(f"✅ Bot inicializálva: {salon_name}")
                
            except Exception as e:
                logger.error(f"❌ Bot hiba ({salon_name}): {e}")
                continue
        
        return applications
        
    except ImportError as e:
        logger.error(f"❌ Telegram import hiba: {e}")
        raise

async def setup_ai_services(config: dict):
    """AI szolgáltatások inicializálása"""
    try:
        gemini_api_key = config.get("gemini_api_key")
        
        if gemini_api_key:
            from modules.ai.hybrid_extractor import HybridInfoExtractor
            info_extractor = HybridInfoExtractor(gemini_api_key)
            logger.info("✅ Hybrid AI extractor initialized")
        else:
            from modules.ai.info_extractor import info_extractor
            logger.info("✅ Rule-based extractor initialized (no AI key)")
        
        return info_extractor
        
    except Exception as e:
        logger.error(f"❌ AI setup error: {e}")
        from modules.ai.info_extractor import info_extractor
        return info_extractor

async def start_calendar_monitors(applications: Dict[str, Any]):
    """Calendar monitorok indítása MINDEN szalonhoz - JAVÍTOTT"""
    try:
        from backend.calendar.monitor import calendar_monitor
        
        monitor_tasks = []
        
        for salon_name, application in applications.items():
            calendar_id = CONFIG.get(salon_name, {}).get("calendar_id")
            if calendar_id:
                try:
                    # ⚠️ JAVÍTÁS: Application átadása, nem application.bot
                    monitor_task = asyncio.create_task(
                        calendar_monitor.start_monitoring(application, salon_name, calendar_id)
                    )
                    monitor_tasks.append(monitor_task)
                    logger.info(f"🔍 Calendar monitor elindítva: {salon_name}")
                    
                except Exception as e:
                    logger.error(f"❌ Calendar monitor indítási hiba {salon_name}: {e}")
        
        logger.info(f"✅ {len(monitor_tasks)} calendar monitor elindítva")
        return monitor_tasks
        
    except ImportError as e:
        logger.warning(f"⚠️ Calendar monitor nem elérhető: {e}")
        return []

async def start_all_bots(applications: Dict[str, Any]):
    """Összes bot indítása"""
    start_tasks = []
    
    for salon_name, app in applications.items():
        start_task = asyncio.create_task(start_single_bot(app, salon_name))
        start_tasks.append(start_task)
    
    await asyncio.gather(*start_tasks)

async def start_single_bot(application, salon_name: str):
    """Egyetlen bot indítása"""
    try:
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        logger.info(f"✅ Bot elindult: {salon_name}")
        
        # Végtelen ciklus - a bot fut
        while True:
            await asyncio.sleep(3600)  # 1 óra
        
    except Exception as e:
        logger.error(f"❌ Bot indítási hiba ({salon_name}): {e}")

async def main():
    """Fő alkalmazás - TÖBBSZÁLAS BOTOKKAL"""
    logger.info("🚀 Többszálas bot indítása...")
    
    try:
        # 1. Backend inicializálása MINDEN szalonhoz
        from backend.database.table_operations import initialize_salon_database
        
        salon_configs = {k: v for k, v in CONFIG.items() if isinstance(v, dict) and "token" in v}
        for salon_name in salon_configs:
            await initialize_salon_database(salon_name)
            logger.info(f"✅ {salon_name} adatbázis inicializálva")
        
        # 2. TÖBB Telegram bot beállítása
        applications = await setup_telegram_bots()
        
        if not applications:
            raise Exception("❌ Egyik bot sem indítható")
        
        # 3. AI szolgáltatások inicializálása (globális)
        info_extractor = await setup_ai_services(CONFIG)
        
        # AI szolgáltatás minden botnak
        for app in applications.values():
            app.bot_data['info_extractor'] = info_extractor
        
        # 4. Calendar monitorok indítása
        monitor_tasks = await start_calendar_monitors(applications)
        
        # 5. ÖSSZES BOT INDÍTÁSA párhuzamosan
        bot_tasks = []
        for salon_name, app in applications.items():
            bot_task = asyncio.create_task(start_single_bot(app, salon_name))
            bot_tasks.append(bot_task)
        
        logger.info(f"✅ {len(bot_tasks)} bot és {len(monitor_tasks)} monitor elindítva")
        
        # Fő ciklus - minden fut
        try:
            await asyncio.gather(*bot_tasks)
            
        except KeyboardInterrupt:
            logger.info("⏹️ Botok leállítva...")
        finally:
            # Calendar monitor leállítása
            try:
                from backend.calendar.monitor import calendar_monitor
                calendar_monitor.stop_monitoring()
            except Exception as e:
                logger.warning(f"⚠️ Calendar monitor leállítási hiba: {e}")
            
            # Botok leállítása
            for salon_name, app in applications.items():
                try:
                    await app.stop()
                    await app.shutdown()
                    logger.info(f"✅ Bot leállítva: {salon_name}")
                except Exception as e:
                    logger.error(f"❌ Bot leállítási hiba ({salon_name}): {e}")
            
    except Exception as e:
        logger.error(f"❌ Hiba a bot indításakor: {e}")
        import traceback
        logger.error(f"🔍 Részletes hiba: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(main())