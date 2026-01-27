# chatbot/modules/ai/gemini_extractor.py
import logging
import json
import google.generativeai as genai
from typing import Dict, Optional, List
import datetime
import re
import asyncio

logger = logging.getLogger(__name__)

class GeminiInfoExtractor:
    """AI-alapú információ kinyerő Gemini használatával"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
    async def extract_with_ai(self, text: str, salon_name: str, available_services: List[str]) -> Dict:
        """AI-alapú információ kinyerés"""
        try:
            # Szolgáltatások listája a prompt-hoz
            services_list = "\n".join([f"- {service}" for service in available_services])
            
            prompt = f"""
            Te egy szalon időpontfoglaló AI asszisztens vagy. Elemezd a felhasználó üzenetét és add vissza JSON formátumban a kinyert információkat.

            SZABÁLYOK:
            - Csak a ténylegesen megadott információkat vedd figyelembe
            - Ne találj ki semmit
            - Ha valami nem egyértelmű, kérd el a pontosítást
            - Használj egyszerű nyelvezetet
            - Dátum formátum: YYYY-MM-DD
            - Idő formátum: HH:MM

            ELÉRHETŐ SZOLGÁLTATÁSOK:
            {services_list}

            FELHASZNÁLÓ ÜZENETE: "{text}"

            VÁLASZ JSON FORMÁTUMBAN:
            {{
                "service": "szolgáltatás neve vagy null",
                "date": "YYYY-MM-DD vagy null", 
                "time": "HH:MM vagy null",
                "name": "teljes név vagy null",
                "phone": "telefonszám vagy null",
                "confidence": 0.0-1.0
            }}
            """
            
            response = await self._call_gemini(prompt)
            return self._parse_ai_response(response, text)
            
        except Exception as e:
            logger.error(f"❌ AI extraction error: {e}")
            return self._get_fallback_response()
    
    async def _call_gemini(self, prompt: str) -> str:
        """Gemini API hívás"""
        try:
            # Aszinkron hívás
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.model.generate_content(prompt)
            )
            return response.text
        except Exception as e:
            logger.error(f"❌ Gemini API error: {e}")
            raise
    
    def _parse_ai_response(self, ai_response: str, original_text: str) -> Dict:
        """AI válasz feldolgozása"""
        try:
            # JSON kinyerése a válaszból
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                
                # Dátum/Idő konverzió
                if data.get('date'):
                    data['date'] = datetime.datetime.strptime(data['date'], '%Y-%m-%d').date()
                if data.get('time'):
                    data['time'] = datetime.datetime.strptime(data['time'], '%H:%M').time()
                
                logger.info(f"✅ AI extracted: {data}")
                return data
            else:
                logger.warning("❌ No JSON found in AI response")
                return self._get_fallback_response()
                
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"❌ AI response parsing error: {e}")
            return self._get_fallback_response()
    
    def _get_fallback_response(self) -> Dict:
        """Fallback válasz ha az AI nem működik"""
        return {
            'service': None,
            'date': None, 
            'time': None,
            'name': None,
            'phone': None,
            'confidence': 0.0
        }