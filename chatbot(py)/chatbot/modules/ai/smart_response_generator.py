# chatbot/modules/ai/smart_response_generator.py - JAVÍTOTT IDŐSZAK KEZELÉSSEL
import logging
from typing import List, Optional
import google.generativeai as genai
import asyncio
from typing import Dict

logger = logging.getLogger(__name__)

class SmartResponseGenerator:
    """AI-alapú intelligens válasz generátor"""
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    async def generate_conversational_response(self, user_message: str, missing_info: List[str], available_slots: List[str], conversation_context: Dict) -> str:
        """AI-alapú beszélgetéses válasz - BŐVÍTVE IDŐSZAK KEZELÉSSEL"""
        try:
            prompt = self._build_conversation_prompt(
                user_message, missing_info, available_slots, conversation_context
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.model.generate_content(prompt)
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"❌ AI response generation error: {e}")
            return self._get_fallback_response(missing_info, available_slots)
    
    def _build_conversation_prompt(self, user_message, missing_info, available_slots, context):
        """Prompt építése a beszélgetés kontextusához - BŐVÍTVE IDŐSZAKKAL"""
        slots_text = ", ".join(available_slots) if available_slots else "nincs elérhető időpont"
        
        # ✅ ÚJ: Időszak speciális kezelése
        time_period_hint = ""
        if 'time_period' in missing_info:
            time_period_hint = """
            FONTOS: A felhasználónak dátumot adott meg, de nem adott meg időt vagy időszakot.
            Kérdezz rá, hogy délelőttre vagy délutánra gondolt!
            Délután: 13:00-18:00, Délelőtt: 9:00-12:00
            """
        
        return f"""
        Te egy barátságos szalon asszisztens vagy. Segítesz időpontot foglalni.

        KÖRVETELMÉNYEK:
        - Legyél barátságos és segítőkész
        - Kérdezz rá a hiányzó információkért
        - Ajánlj időpontokat a szabad időpontokból
        - Használj emojikat 😊
        - Max 2-3 mondat

        {time_period_hint}

        HIÁNYZÓ INFORMÁCIÓK: {", ".join(missing_info)}
        SZABAD IDŐPONTOK: {slots_text}
        FELHASZNÁLÓ ÜZENETE: "{user_message}"

        Előző kontextus: {context.get('previous_responses', [])[-2:] if context.get('previous_responses') else 'Nincs'}

        Válaszolj természetes, barátságos stílusban:
        """
    
    def _get_fallback_response(self, missing_info: List[str], available_slots: List[str]) -> str:
        """Fallback válasz ha az AI nem működik - BŐVÍTVE IDŐSZAKKAL"""
        if 'time_period' in missing_info:
            return "⏰ Milyen időszakban szeretnél jönni? Délelőttre (9:00-12:00) vagy délutánra (13:00-18:00) gondoltál? 😊"
        elif 'service' in missing_info:
            return "Milyen szolgáltatásra szeretnél jönni? 💇‍♀️"
        elif 'date' in missing_info:
            return "Melyik napra szeretnéd az időpontot? 📅"
        elif 'time' in missing_info:
            slots_text = ", ".join(available_slots) if available_slots else "nincs elérhető"
            return f"Milyen időpont jó? Szabad időpontok: {slots_text} ⏰"
        elif 'name' in missing_info:
            return "Milyen néven szeretnéd a foglalást? 👤"
        elif 'phone' in missing_info:
            return "Még egy telefonszámot kérnék a biztonság kedvéért! 📞"
        else:
            return "Miben tudok segíteni? 😊"