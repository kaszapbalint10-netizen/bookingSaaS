# chatbot/modules/ai/info_extractor.py
import datetime
import re
import logging
from typing import Dict, Optional, List
import asyncio

logger = logging.getLogger(__name__)

class SmartInfoExtractor:
    """Okos információ kinyerő - ADATBÁZISBÓL SZERVEZETT SZOLGÁLTATÁSOKKAL"""
    
    def __init__(self):
        self.services_cache = {}  # Cache: {salon_name: {keyword: service_name}}
        self.cache_timestamp = {}
    
    async def _refresh_services_cache(self, salon_name: str):
        """Szolgáltatások frissítése az adatbázisból"""
        try:
            # BACKEND: Szolgáltatások lekérése
            from backend.database.salon_operations import get_services
            
            services_data = await get_services(salon_name)
            
            services_map = {}
            for service_name, duration in services_data:
                # Kulcsszavak generálása a szolgáltatás nevéből
                keywords = self._generate_keywords(service_name)
                for keyword in keywords:
                    services_map[keyword] = service_name
            
            self.services_cache[salon_name] = services_map
            self.cache_timestamp[salon_name] = datetime.datetime.now()
            
            logger.info(f"✅ Services cache frissítve: {salon_name} - {len(services_map)} kulcsszó")
            
        except Exception as e:
            logger.error(f"❌ Hiba a services cache frissítésénél ({salon_name}): {e}")
            # Fallback alapértelmezett szolgáltatások
            self.services_cache[salon_name] = self._get_fallback_services()
    
    def _generate_keywords(self, service_name: str) -> List[str]:
        """Kulcsszavak generálása a szolgáltatás nevéből"""
        service_lower = service_name.lower()
        keywords = []
        
        # Alap kulcsszavak
        keywords.append(service_lower)  # teljes név
        keywords.append(service_lower.replace('haj', '').strip())  # "haj" nélkül
        
        # Ragozások
        words = service_lower.split()
        for word in words:
            if len(word) > 3:  # csak értelmes hosszú szavak
                keywords.append(word)
                keywords.append(word + 'ra')  # -ra rag
                keywords.append(word + 're')  # -re rag
                keywords.append(word + 't')   # -t rag
                keywords.append(word + 'nak') # -nak rag
                keywords.append(word + 'nek') # -nek rag
        
        # Egyedi esetek
        if 'festés' in service_lower or 'festes' in service_lower:
            keywords.extend(['festés', 'festes', 'festésre', 'festésre', 'festést', 'festest'])
        if 'vágás' in service_lower or 'vagas' in service_lower:
            keywords.extend(['vágás', 'vagas', 'vágásra', 'vagasra', 'vágást', 'vagast'])
        if 'melír' in service_lower or 'melir' in service_lower:
            keywords.extend(['melír', 'melir', 'melírozás', 'melirozas'])
        if 'balayage' in service_lower:
            keywords.extend(['balayage', 'balayage-ra', 'balayage-ra'])
        if 'szőkítés' in service_lower or 'szokites' in service_lower:
            keywords.extend(['szőkítés', 'szokites', 'szőkítésre', 'szokitesre'])
        if 'mosás' in service_lower or 'mosas' in service_lower:
            keywords.extend(['mosás', 'mosas', 'mosásra', 'mosasra'])
        if 'frízura' in service_lower or 'frizura' in service_lower:
            keywords.extend(['frízura', 'frizura', 'fodrász', 'fodrasz'])
        if 'szín' in service_lower or 'szin' in service_lower:
            keywords.extend(['szín', 'szin', 'színezés', 'szinezes'])
        
        return list(set(keywords))  # duplikátumok eltávolítása
    
    def _get_fallback_services(self) -> Dict[str, str]:
        """Fallback szolgáltatások ha az adatbázis nem elérhető"""
        return {
            'vágás': 'Hajvágás', 'vágásra': 'Hajvágás', 'vágást': 'Hajvágás', 'vagas': 'Hajvágás',
            'festés': 'Hajfestés', 'festésre': 'Hajfestés', 'festést': 'Hajfestés', 'festes': 'Hajfestés',
            'balayage': 'Balayage', 'balayage-ra': 'Balayage',
            'melír': 'Melírozás', 'melírozás': 'Melírozás', 'melir': 'Melírozás',
            'szőkítés': 'Hajszőkítés', 'szőkítésre': 'Hajszőkítés', 'szokites': 'Hajszőkítés',
            'mosás': 'Hajmosás', 'mosásra': 'Hajmosás', 'mosas': 'Hajmosás',
            'frízura': 'Frízura', 'frizura': 'Frízura',
        }
    
    async def extract_service(self, text: str, salon_name: str) -> str:
        """Szolgáltatás kinyerése a szövegből - ADATBÁZISBÓL"""
        try:
            # Cache ellenőrzése és frissítése (1 órás cache)
            if (salon_name not in self.services_cache or 
                datetime.datetime.now() - self.cache_timestamp.get(salon_name, datetime.datetime.min) > datetime.timedelta(hours=1)):
                await self._refresh_services_cache(salon_name)
            
            services_map = self.services_cache.get(salon_name, {})
            text_lower = text.lower()
            
            # Pontos egyezés keresése
            for keyword, service_name in services_map.items():
                if keyword in text_lower:
                    logger.info(f"✅ Szolgáltatás megtalálva: '{keyword}' -> '{service_name}'")
                    return service_name
            
            # Ha nincs egyezés, alapértelmezett
            logger.info(f"🔍 Nincs szolgáltatás egyezés, alapértelmezett használata")
            return None
            
        except Exception as e:
            logger.error(f"❌ Hiba a szolgáltatás kinyerésénél: {e}")
            return None

    @staticmethod
    def extract_date(text: str) -> Optional[datetime.date]:
        """Dátum kinyerése a szövegből"""
        today = datetime.date.today()
        text_lower = text.lower()
        
        # Holnap
        if 'holnap' in text_lower:
            return today + datetime.timedelta(days=1)
        
        # Holnapután
        if 'holnapután' in text_lower or 'holnap után' in text_lower:
            return today + datetime.timedelta(days=2)
        
        # Ma
        if 'ma' in text_lower:
            return today
        
        # Hét napjai
        weekdays = {
            'hétfő': 0, 'hetfo': 0,
            'kedd': 1, 
            'szerda': 2,
            'csütörtök': 3, 'csutortok': 3,
            'péntek': 4, 'pentek': 4,
            'szombat': 5,
            'vasárnap': 6, 'vasarnap': 6
        }
        
        for day_name, day_num in weekdays.items():
            if day_name in text_lower:
                days_ahead = day_num - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                return today + datetime.timedelta(days=days_ahead)
        
        # Konkrét dátum formátumok
        date_patterns = [
            r'(\d{4})[\.\-](\d{2})[\.\-](\d{2})',  # YYYY-MM-DD
            r'(\d{2})[\.\-](\d{2})[\.\-](\d{4})',  # DD-MM-YYYY
            r'(\d{1,2})[\.\-](\d{1,2})'            # DD-MM
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    groups = match.groups()
                    if len(groups) == 3:
                        if len(groups[0]) == 4:  # YYYY-MM-DD
                            year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                        else:  # DD-MM-YYYY
                            day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
                    else:  # DD-MM (aktuális év)
                        day, month = int(groups[0]), int(groups[1])
                        year = today.year
                    
                    return datetime.date(year, month, day)
                except (ValueError, TypeError):
                    continue
        
        return None

    @staticmethod
    def extract_time(text: str) -> Optional[datetime.time]:
        """Idő kinyerése a szövegből"""
        text_lower = text.lower()
        
        # Először próbáljunk meg pontos időformátumot találni
        time_patterns = [
            r'(\d{1,2})[:\.](\d{2})',           # 14:30 vagy 14.30
            r'(\d{1,2})\s*óra',                 # 14 óra
            r'(\d{1,2})',                       # 14
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    hour = int(match.group(1))
                    
                    # Perc kinyerése
                    minute = 0
                    if len(match.groups()) > 1 and match.group(2):
                        minute_str = match.group(2)
                        if minute_str.isdigit():
                            minute = int(minute_str)
                    
                    # Délután/este korrekció
                    if ('délután' in text_lower or 'este' in text_lower or 'du' in text_lower) and hour < 12:
                        hour += 12
                    
                    # Reggel korrekció
                    if ('reggel' in text_lower or 'délelőtt' in text_lower or 'delelott' in text_lower) and hour >= 12:
                        hour -= 12
                    
                    # Érvényesség ellenőrzés
                    if 0 <= hour <= 23 and 0 <= minute <= 59:
                        return datetime.time(hour, minute)
                        
                except (ValueError, TypeError):
                    continue
        
        return None
    

    @staticmethod
    def extract_name(text: str) -> Optional[str]:
        """Név kinyerése a szövegből"""
        # Név minta: legalább 2 szó, mindkettő nagybetűvel kezdődik
        name_patterns = [
            r'([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)\s+([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)',  # Kovács Éva
            r'(?:név|neve|nevem)\s+([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+\s+[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)',  # név Kovács Éva
            r'([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)\s+([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)\s+(?:név|neve|nevem)',  # Kovács Éva név
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text)
            if match:
                # Az első két csoportot vesszük (keresztnév + vezetéknév)
                groups = match.groups()
                if len(groups) >= 2:
                    name = f"{groups[0]} {groups[1]}"
                    logger.info(f"✅ Név megtalálva: {name}")
                    return name
        
        return None

    @staticmethod
    def extract_phone(text: str) -> Optional[str]:
        """Telefonszám kinyerése a szövegből"""
        phone_patterns = [
            r'(\+?36|06)[\s\-]?(\d{1,2})[\s\-]?(\d{3})[\s\-]?(\d{3,4})',  # +36 20 123 4567
            r'(\d{2})[\s\-]?(\d{3})[\s\-]?(\d{3,4})',                     # 20 123 4567
            r'(\+36\d{9})',                                               # +36201234567
            r'(06\d{8,9})',                                               # 06201234567
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                phone = re.sub(r'[^\d+]', '', match.group(0))
                logger.info(f"✅ Telefonszám megtalálva: {phone}")
                return phone
        
        return None

    @staticmethod
    def extract_time_period(text: str) -> Optional[str]:
        """Időszak kinyerése (délelőtt/délután) - STATIC"""
        text_lower = text.lower()
        
        délelőtt_keywords = ['délelőtt', 'delelott', 'reggel', 'reggeli', 'délelőttre', 'reggelre', 'reggelire', 'reggel']
        délután_keywords = ['délután', 'delutan', 'du', 'délutánra', 'delutanra', 'délután', 'este', 'estére']
        
        if any(keyword in text_lower for keyword in délelőtt_keywords):
            return 'délelőtt'
        elif any(keyword in text_lower for keyword in délután_keywords):
            return 'délután'
        
        return None

    async def extract_all(self, text: str, salon_name: str) -> Dict:
        """Minden információ kinyerése egy szövegből - STATIC HIVÁSSAL"""
        result = {
            'date': self.extract_date(text),
            'time': self.extract_time(text),
            'service': await self.extract_service(text, salon_name),
            'name': self.extract_name(text),
            'phone': self.extract_phone(text),
            'time_period': SmartInfoExtractor.extract_time_period(text),  # ✅ STATIC HIVÁS
            'confidence': 0.0
        }
        
        # Confidence számítás
        filled_fields = sum(1 for v in result.values() if v is not None and v != 'time_period')
        result['confidence'] = filled_fields / 5.0
        
        logger.info(f"🔍 Összes kinyert információ: {result}")
        return result

# Globális példány
info_extractor = SmartInfoExtractor()