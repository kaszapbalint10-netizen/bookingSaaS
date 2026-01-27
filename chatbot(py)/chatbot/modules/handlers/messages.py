# chatbot/modules/handlers/messages.py
import logging
import datetime
from telegram import Update
from telegram.ext import ContextTypes
from typing import List, Optional

# AI IMPORTOK
from modules.ai.hybrid_extractor import HybridInfoExtractor
from modules.ai.smart_response_generator import SmartResponseGenerator

# BACKEND IMPORTOK
from backend.database.user_operations import get_global_user_info, insert_global_user
from backend.database.salon_operations import get_service_duration, get_available_slots
from backend.calendar.google_calendar import create_event
from backend.database.event_operations import insert_event

# CONVERSATION IMPORT
from modules.conversation.manager import conversation_manager

# SECURITY IMPORT
from backend.security.input_validator import InputValidator

logger = logging.getLogger(__name__)

# Globális AI szolgáltatások
ai_services = {}

def initialize_ai_services(config: dict):
    """AI szolgáltatások inicializálása"""
    global ai_services
    
    try:
        gemini_api_key = config.get("gemini_api_key")
        
        if gemini_api_key:
            ai_services['info_extractor'] = HybridInfoExtractor(gemini_api_key)
            ai_services['response_generator'] = SmartResponseGenerator(gemini_api_key)
            logger.info("✅ AI services initialized")
        else:
            from modules.ai.info_extractor import info_extractor
            ai_services['info_extractor'] = info_extractor
            ai_services['response_generator'] = None
            logger.info("✅ Rule-based services initialized (no AI key)")
            
    except Exception as e:
        logger.error(f"❌ AI services initialization failed: {e}")
        from modules.ai.info_extractor import info_extractor
        ai_services['info_extractor'] = info_extractor
        ai_services['response_generator'] = None

async def handle_intelligent_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Intelligens üzenetkezelés - AI-INTEGRÁCIÓVAL"""
    try:
        chat_id = update.effective_chat.id
        user_id = update.effective_user.id
        user_name = update.effective_user.full_name if update.effective_user else "Ismeretlen"
        text = update.message.text


        logger.info(f"🔍 Üzenet: {user_name} ({user_id}): {text}")

        # 🛡️ 1. BIZTONSÁGI ELLENŐRZÉS
        is_valid, clean_text, validation_info = InputValidator.validate_input(text, user_id)
        
        if not is_valid:
            if validation_info.get("injection_detected"):
                logger.warning(f"🚨 Injection attempt blocked from user {user_id}")
                await update.message.reply_text("Kérlek, használd a botot időpontfoglalásra! 😊")
                return
            else:
                await update.message.reply_text("Kérlek, érvényes üzenetet küldj! 📝")
                return

        # 🏪 2. SZALON KONFIGURÁCIÓ
        salon_configs = {k: v for k, v in context.bot_data.get('CONFIG', {}).items() 
                        if isinstance(v, dict) and "token" in v}
        
        if not salon_configs:
            await update.message.reply_text("❌ Nincs szalon konfigurálva.")
            return

        salon_name = next(iter(salon_configs.keys()))
        cfg = salon_configs[salon_name]

        # 🤖 3. AI SZOLGÁLTATÁSOK INICIALIZÁLÁSA (ha még nem történt meg)
        if not ai_services:
            initialize_ai_services(context.bot_data.get('CONFIG', {}))

        # 👤 4. USER INFORMÁCIÓK LEKÉRÉSE
        global_user_info = await get_global_user_info(chat_id)
        
        # 🔍 5. INFORMÁCIÓK KINYERÉSE (AI VAGY RULE-BASED)
        info_extractor = ai_services.get('info_extractor')
        
        if not info_extractor:
            # Fallback ha nincs AI
            from modules.ai.info_extractor import info_extractor as fallback_extractor
            extracted_info = await fallback_extractor.extract_all(clean_text, salon_name)
        else:
            # AI-alapú kinyerés
            extracted_info = await info_extractor.extract_all(clean_text, salon_name)
        
        logger.info(f"🔍 Kinyert információk: {extracted_info}")

        # ❓ ELŐSZÖR ELLENŐRIZZÜK A SZOLGÁLTATÁS SZÁNDÉKOT
        services_intent = await detect_services_intent(clean_text, salon_name, info_extractor)
        if services_intent:
            # ✅ HA SZOLGÁLTATÁSOKAT KÉR, CSAK AZT KÜLDI
            return await handle_services_inquiry(update, salon_name)

        # 💬 6. SESSION FRISSÍTÉSE
        conversation_manager.update_session(salon_name, chat_id, extracted_info, global_user_info)
        
        # 📅 7. SZABAD IDŐPONTOK LEKÉRÉSE
        available_slots = []
        current_info = conversation_manager.get_extracted_info(salon_name, chat_id)
        current_date = current_info.get('date')
        current_service = current_info.get('service', 'Hajvágás')
        
        if current_date:
            try:
                service_duration = await get_service_duration(salon_name, current_service)
                calendar_id = cfg.get("calendar_id")
                available_slots = await get_available_slots(salon_name, current_date, service_duration, calendar_id)
                
                formatted_slots = []
                for slot in available_slots[:8]:
                    if hasattr(slot, 'strftime'):
                        formatted_slots.append(slot.strftime("%H:%M"))
                    else:
                        formatted_slots.append(str(slot))
                
                available_slots = formatted_slots
                logger.info(f"🔍 Elérhető időpontok: {available_slots}")
                
            except Exception as e:
                logger.error(f"Hiba az időpontok lekérésekor: {e}")
                available_slots = []
    
    # 🔄 IDŐSZAK FELDOLGOZÁSA - ha időszakot adott meg, de nincs pontos idő
        extracted_info = await info_extractor.extract_all(clean_text, salon_name)
        
        # ✅ HA IDŐSZAKOT ADOTT MEG, DE NINCS PONTOS IDŐ
        if extracted_info.get('time_period') and not extracted_info.get('time'):
            # Szűrjük az elérhető időpontokat az időszak alapján
            available_slots = await _filter_slots_by_period(available_slots, extracted_info['time_period'])
            logger.info(f"🔍 Időszak alapján szűrt időpontok ({extracted_info['time_period']}): {available_slots}")
        # ❓ 8. HIÁNYZÓ INFORMÁCIÓK ELLENŐRZÉSE
        missing_info = conversation_manager.get_missing_info(salon_name, chat_id)
        
        if not missing_info:
            # ✅ MINDEN INFORMÁCIÓ MEGVAN - FOGLALÁS
            await confirm_and_book_appointment(update, salon_name, cfg, chat_id)
            return
        else:
            # ❌ HIÁNYZÓ INFORMÁCIÓK - VÁLASZ GENERÁLÁS
            response = await generate_intelligent_response(
                clean_text, missing_info, available_slots, salon_name, chat_id
            )
            await update.message.reply_text(response)
        services_intent = await detect_services_intent(clean_text, salon_name, info_extractor)

        if services_intent:
            return await handle_services_inquiry(update, salon_name)

            
    except Exception as e:
        logger.error(f"❌ Hiba az intelligens üzenetkezelésben: {e}")
        await update.message.reply_text("❌ Hiba történt. Kérlek, próbáld újra!")

async def generate_intelligent_response(text: str, missing_info: List[str], available_slots: List[str], 
                                       salon_name: str, chat_id: int) -> str:
    """Intelligens válasz generálás AI vagy rule-based módon"""
    try:
        response_generator = ai_services.get('response_generator')
        
        if response_generator:
            # 🧠 AI-ALAPÚ VÁLASZ
            conversation_context = {
                'previous_responses': conversation_manager.get_conversation_history(salon_name, chat_id),
                'missing_info': missing_info,
                'salon_name': salon_name
            }
            
            return await response_generator.generate_conversational_response(
                text, missing_info, available_slots, conversation_context
            )
        else:
            # 📋 RULE-BASED VÁLASZ (fallback)
            return await generate_rule_based_response(missing_info, available_slots, salon_name)
            
    except Exception as e:
        logger.error(f"❌ AI response generation failed: {e}")
        return await generate_rule_based_response(missing_info, available_slots, salon_name)

# chatbot/modules/handlers/messages.py - BŐVÍTVE
async def generate_rule_based_response(missing_info: List[str], available_slots: List[str], salon_name: str) -> str:
    """Rule-based válasz generálás - BŐVÍTVE IDŐSZAK KÉRDÉSSEL"""
    try:
        if 'time_period' in missing_info:
            # ✅ ÚJ: Délután/délelőtt kérdés
            return (
                "⏰ <b>Milyen időszakban szeretnél jönni?</b>\n\n"
                "• <b>Délelőtt</b> - 9:00-12:00 között\n"  
                "• <b>Délután</b> - 13:00-18:00 között\n\n"
                "Válaszd ki, hogy délelőttre vagy délutánra gondoltál! 😊"
            )
        
        elif 'service' in missing_info:
            # Szolgáltatások listája az adatbázisból
            from backend.database.salon_operations import get_services
            services_data = await get_services(salon_name)
            if services_data:
                services_list = "\n".join([f"• {service} ({time} perc)" for service, time in services_data])
                return f"Milyen szolgáltatásra gondoltál? 💇‍♀️\n\nElérhető szolgáltatások:\n{services_list}"
            else:
                return "Milyen szolgáltatásra szeretnél jönni? 💇‍♀️"
        
        elif 'date' in missing_info:
            return "Melyik napra szeretnéd az időpontot? 📅\n\nPéldául: holnap, jövő hét kedden, vagy konkrét dátumot is megadhatsz!"
        
        elif 'time' in missing_info:
            slots_text = ", ".join(available_slots) if available_slots else "nincs elérhető időpont"
            return f"Milyen időpont jó? ⏰\n\nSzabad időpontok: {slots_text}\n\nVálassz egyet, vagy írd meg, hogy mikor szeretnél jönni!"
        
        elif 'name' in missing_info:
            return "Milyen néven szeretnéd a foglalást? 👤\n\nPéldául: Kovács Éva"
        
        elif 'phone' in missing_info:
            return "Még egy telefonszámot kérnék a biztonság kedvéért: 📞\n\nPéldául: 06201234567"
        
        else:
            return "Miben tudok segíteni?😊"
            
    except Exception as e:
        logger.error(f"❌ Rule-based response error: {e}")
        return "Miben tudok segíteni? 😊"
# chatbot/modules/handlers/messages.py
# Keress rá erre a részre:

# chatbot/modules/handlers/messages.py - JAVÍTOTT confirm_and_book_appointment
async def confirm_and_book_appointment(update: Update, salon_name: str, cfg: dict, chat_id: int):
    """Időpont megerősítése és foglalása - JAVÍTOTT IDŐPONT ADATOKKAL"""
    try:
        # 📋 1. SESSION ADATOK LEKÉRÉSE
        appointment_data = conversation_manager.get_extracted_info(salon_name, chat_id)
        logger.info(f"🔍 Foglalási adatok: {appointment_data}")
        
        # ✅ 2. KÖTELEZŐ ADATOK ELLENŐRZÉSE
        required_fields = ['service', 'date', 'time', 'name', 'phone']
        for field in required_fields:
            if field not in appointment_data or not appointment_data[field]:
                await update.message.reply_text(f"❌ Hiányzó adat: {field}. Kérlek, add meg újra!")
                return

        # ⏱️ 3. SZOLGÁLTATÁS IDŐTARTAMÁNAK LEKÉRÉSE
        service_duration = await get_service_duration(salon_name, appointment_data['service'])

        # 👤 4. USER MENTÉSE
        await insert_global_user(appointment_data['name'], chat_id, appointment_data['phone'])
        
        # 📅 5. CALENDAR ESEMÉNY LÉTREHOZÁSA
        appointment_datetime = datetime.datetime.combine(
            appointment_data['date'], 
            appointment_data['time']
        )
        
        end_datetime = appointment_datetime + datetime.timedelta(minutes=service_duration)
        event_summary = f"{appointment_data['service']} - {appointment_data['name']} ({appointment_data['phone']})"
        
        # ⚠️ JAVÍTÁS: chat_id PARAMÉTER ELTÁVOLÍTÁSA
        event = create_event(
            start_dt=appointment_datetime,
            calendar_id=cfg["calendar_id"],
            service_name=event_summary,
            duration_minutes=service_duration
        )
        
        # 💾 6. ESEMÉNY MENTÉSE AZ ADATBÁZISBA - JAVÍTOTT IDŐPONT ADATOKKAL
        # ⭐ JAVÍTÁS: Időpont adatok formázása és átadása
        event_date = appointment_datetime.strftime('%Y-%m-%d')  # '2024-01-15'
        start_time = appointment_datetime.strftime('%H:%M')     # '14:00'
        end_time = end_datetime.strftime('%H:%M')               # '15:00'
        
        print(f"🎯 INSERT_EVENT WITH TIME DATA:")
        print(f"   event_date: {event_date}")
        print(f"   start_time: {start_time}")
        print(f"   end_time: {end_time}")
        
        await insert_event(
            salon_name=salon_name,
            chat_id=chat_id,
            event_id=event['id'],
            service=appointment_data['service'],
            event_date=event_date,    # ✅ Dátum
            start_time=start_time,    # ✅ Kezdési idő
            end_time=end_time,        # ✅ Befejezési idő
            status=0
        )
        
        # 🎉 7. SIKERES VISSZAIGAZOLÁS
        formatted_time = appointment_datetime.strftime("%Y.%m.%d. %H:%M")
        formatted_end_time = end_datetime.strftime("%H:%M")
        
        success_message = await generate_success_message(appointment_data, salon_name, formatted_time, formatted_end_time)
        await update.message.reply_text(success_message)
        logger.info(f"✅ Időpont foglalva: {appointment_data['name']} - {formatted_time}")
        
        # 🧹 8. SESSION TÖRLÉSE
        conversation_manager.clear_session(salon_name, chat_id)
        
    except Exception as e:
        logger.error(f"❌ Hiba az időpont foglalásánál: {e}")
        await update.message.reply_text("❌ Hiba történt az időpont foglalása során.")

async def generate_success_message(appointment_data: dict, salon_name: str, formatted_time: str, formatted_end_time: str) -> str:
    """Sikeres foglalás üzenet generálása"""
    try:
        response_generator = ai_services.get('response_generator')
        
        if response_generator:
            # 🧠 AI-ALAPÚ SUCCESS MESSAGE
            return (
                f"🎉 **IDŐPONT SIKERESEN LEFOGLALVA!**\n\n"
                f"📅 Dátum: {formatted_time}\n"
                f"⏰ Időtartam: {appointment_data['time'].strftime('%H:%M')} - {formatted_end_time}\n"
                f"💇 Szolgáltatás: {appointment_data['service']}\n"
                f"👤 Név: {appointment_data['name']}\n"
                f"📞 Telefon: {appointment_data['phone']}\n"
                f"🏪 Szalon: {salon_name}\n\n"
                f"Kérjük, érkezz pontosan a megadott időre! 😊"
            )
         

            
    except Exception as e:
        logger.error(f"❌ Success message generation failed: {e}")
        return f"✅ Köszönjük a foglalást! Időpont: {formatted_time}"
    
async def detect_services_intent(text: str, salon_name: str, info_extractor) -> bool:
    """Szolgáltatás szándék felismerése AI-val"""
    try:
        # AI-alapú felismerés
        if hasattr(info_extractor, 'extract_services_intent'):
            result = await info_extractor.extract_services_intent(text, salon_name)
            return result.get('services_intent', False) and result.get('confidence', 0) > 0.7
        
        # Rule-based fallback
        services_keywords = [
            'szolgáltatás', 'mit lehet', 'mik vannak', 'mit csinál', 'frizura',
            'hajvágás', 'festés', 'szárítás', 'kezelés', 'milyen', 'lista'
        ]
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in services_keywords)
        
    except Exception as e:
        logger.error(f"❌ Services intent detection error: {e}")
        return False

async def handle_services_inquiry(update: Update, salon_name: str):
    """Szolgáltatások listázása"""
    try:
        from backend.database.salon_operations import get_services
        
        services_data = await get_services(salon_name)
        
        if services_data:
            services_list = "\n".join([f"• {service} ({duration} perc)" for service, duration in services_data])
            message = (
                "💇‍♀️ <b>Elérhető szolgáltatások</b>\n\n"
                f"{services_list}\n\n"
                "Melyikre szeretnél időpontot foglalni? 😊"
            )
        else:
            message = (
                "💇‍♀️ Jelenleg nincsenek rögzített szolgáltatások.\n\n"
                "Írd le, milyen szolgáltatásra szeretnél jönni, például:\n"
                "• Hajvágás\n• Festés\n• Szárítás\n• Melírozás"
            )
        
        await update.message.reply_text(message, parse_mode='HTML')
        return True
        
    except Exception as e:
        logger.error(f"❌ Services inquiry error: {e}")
        await update.message.reply_text("❌ Hiba történt a szolgáltatások lekérése során.")
        return True
# chatbot/modules/handlers/messages.py - ÚJ SEGÉDFÜGGVÉNY
async def _filter_slots_by_period(self, available_slots: List[str], time_period: str) -> List[str]:
    """Időpontok szűrése időszak alapján"""
    try:
        filtered_slots = []
        
        for slot in available_slots:
            if isinstance(slot, str):
                # String időpont feldolgozása
                try:
                    hour = int(slot.split(':')[0])
                except:
                    continue
            else:
                # Time objektum feldolgozása
                hour = slot.hour
            
            # Időszak alapján szűrés
            if time_period == 'délelőtt' and 9 <= hour < 12:
                filtered_slots.append(slot)
            elif time_period == 'délután' and 13 <= hour < 18:
                filtered_slots.append(slot)
        
        return filtered_slots
        
    except Exception as e:
        logger.error(f"❌ Hiba az időszak szűrésénél: {e}")
        return available_slots