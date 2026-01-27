# chatbot/modules/ai/hybrid_extractor.py
import logging
from typing import Dict, Optional
from .info_extractor import SmartInfoExtractor
from .gemini_extractor import GeminiInfoExtractor
from typing import List 
import json

logger = logging.getLogger(__name__)

class HybridInfoExtractor:
    """Hibrid információ kinyerő - AI + rule-based"""
    
    def __init__(self, gemini_api_key: str):
        self.rule_based = SmartInfoExtractor()
        self.ai_based = GeminiInfoExtractor(gemini_api_key)
        self.confidence_threshold = 0.7
    
    async def extract_all(self, text: str, salon_name: str) -> Dict:
        """Hibrid információ kinyerés"""
        # 1. Rule-based extraction (gyors)
        rule_based_result = await self.rule_based.extract_all(text, salon_name)
        
        # Ha a confidence magas, használjuk
        if rule_based_result['confidence'] >= self.confidence_threshold:
            logger.info("✅ Rule-based extraction successful")
            return rule_based_result
        
        # 2. AI-based extraction (lassú, de okos)
        try:
            available_services = await self._get_available_services(salon_name)
            ai_result = await self.ai_based.extract_with_ai(text, salon_name, available_services)
            
            # AI eredmény kombinálása rule-based eredménnyel
            combined_result = self._combine_results(rule_based_result, ai_result)
            logger.info(f"✅ Hybrid extraction: {combined_result}")
            return combined_result
            
        except Exception as e:
            logger.error(f"❌ AI extraction failed, using rule-based: {e}")
            return rule_based_result
    
    async def _get_available_services(self, salon_name: str) -> List[str]:
        """Elérhető szolgáltatások lekérése"""
        try:
            from backend.database.salon_operations import get_services
            services_data = await get_services(salon_name)
            return [service for service, duration in services_data]
        except Exception as e:
            logger.error(f"❌ Services fetch error: {e}")
            return []
    
    def _combine_results(self, rule_result: Dict, ai_result: Dict) -> Dict:
        """Eredmények kombinálása"""
        combined = {}
        
        for field in ['service', 'date', 'time', 'name', 'phone']:
            # Preferáljuk az AI eredményt, ha magasabb confidence-je van
            if ai_result.get(field) and ai_result.get('confidence', 0) > rule_result.get('confidence', 0):
                combined[field] = ai_result[field]
            else:
                combined[field] = rule_result.get(field)
        
        # Confidence számítás
        filled_fields = sum(1 for v in combined.values() if v is not None)
        combined['confidence'] = filled_fields / 5.0
        
        return combined
    
# modules/ai/hybrid_extractor.py
async def extract_services_intent(self, text: str, salon_name: str) -> Dict:
    """AI-alapú szolgáltatás szándék felismerés"""
    try:
        prompt = f"""
        Elemezd a felhasználó üzenetét és állapítsd meg, hogy szolgáltatásokra kíváncsi!
        
        FELHASZNÁLÓ: "{text}"
        
        Kérdések amikre IGEN a válasz:
        - "Mik a szolgáltatásaid?"
        - "Mit csináltok?" 
        - "Milyen frizurákat vágtok?"
        - "Festeni is tudtok?"
        - "Milyen hajkezelések vannak?"
        - "Milyen szolgáltatások érhetők el?"
        - "Mit lehet nálatok csináltatni?"
        
        Válaszolj JSON formátumban:
        {{
            "services_intent": true/false,
            "confidence": 0.0-1.0
        }}
        """
        
        response = await self.gemini_client.generate_content_async(prompt)
        result = json.loads(response.text)
        
        return result
        
    except Exception as e:
        logger.error(f"❌ AI services intent error: {e}")
        return {"services_intent": False, "confidence": 0.0}