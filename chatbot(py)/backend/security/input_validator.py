# backend/security/input_validator.py
import re
import logging
from typing import Tuple, Dict
from datetime import datetime

logger = logging.getLogger(__name__)

class InputValidator:
    """Input validátor prompt injection ellen"""
    
    # Tiltott minták
    INJECTION_PATTERNS = [
        r'(?:figyelmen kívül hagyd?|ignore|override)',
        r'(?:előző?|previous|earlier) (?:utasítás|instruction|prompt)',
        r'(?:most már|now you are) (?:admin|root|system)',
        r'(?:repeat|repeat back|echo) (?:your|the) (?:prompt|instructions)',
        r'(?:forget|disregard) (?:all|everything)',
        r'(?:following|next) (?:message|instruction)',
        r'system:',
        r'###',
        r'"""',
        r'```',
    ]
    
    # Engedélyezett karakterek
    ALLOWED_CHARS = r'[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9\s\.,!?\-\:;@\(\)]'
    
    @classmethod
    def validate_input(cls, text: str, user_id: int) -> Tuple[bool, str, Dict]:
        """Input validálása és szűrése"""
        if not text or len(text.strip()) == 0:
            return False, "Üres üzenet", {}
        
        # 1. Hossz korlátozás
        if len(text) > 500:
            return False, "Túl hosszú üzenet (max 500 karakter)", {}
        
        # 2. Injection pattern-ek ellenőrzése
        injection_found = cls._detect_injection(text)
        if injection_found:
            logger.warning(f"🚨 Injection kísérlet user {user_id}: {text}")
            return False, "Érvénytelen kérés", {"injection_detected": True}
        
        # 3. Karakter szűrés
        if not cls._validate_chars(text):
            return False, "Érvénytelen karakterek", {}
        
        # 4. Túl gyors üzenetek (rate limiting)
        if not cls._check_rate_limit(user_id):
            return False, "Túl gyors üzenetküldés", {}
        
        # 5. Tisztított szöveg
        clean_text = cls._sanitize_text(text)
        
        return True, clean_text, {
            "length": len(clean_text),
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
    
    @classmethod
    def _detect_injection(cls, text: str) -> bool:
        """Prompt injection detektálása"""
        text_lower = text.lower()
        
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, text_lower):
                return True
        
        # Speciális karakterek gyakorisága
        special_chars = ['#', '{', '}', '[', ']', '|', '`']
        special_count = sum(text.count(char) for char in special_chars)
        if special_count > 5:
            return True
            
        return False
    
    @classmethod
    def _validate_chars(cls, text: str) -> bool:
        """Engedélyezett karakterek ellenőrzése"""
        return bool(re.match(f'^{cls.ALLOWED_CHARS}+$', text))
    
    @classmethod
    def _check_rate_limit(cls, user_id: int) -> bool:
        """Rate limiting egyszerű implementáció"""
        # Itt lehetne Redis vagy database-based rate limiting
        # Most csak egy egyszerű verzio
        return True  # TODO: Implement rate limiting
    
    @classmethod
    def _sanitize_text(cls, text: str) -> str:
        """Szöveg tisztítása"""
        # Több whitespace eltávolítása
        text = re.sub(r'\s+', ' ', text)
        # HTML tag-ek eltávolítása
        text = re.sub(r'<[^>]+>', '', text)
        return text.strip()