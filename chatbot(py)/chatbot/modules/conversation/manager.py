import datetime
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class ConversationManager:
    """Intelligens beszélgetés kezelő"""
    
    def __init__(self):
        self.user_sessions = {}
    
    def get_session(self, salon_name: str, chat_id: int) -> Dict:
        """Session lekérése vagy létrehozása"""
        session_id = f"{salon_name}_{chat_id}"
        if session_id not in self.user_sessions:
            self.user_sessions[session_id] = {
                'extracted_info': {},
                'missing_info': ['service', 'date', 'time', 'name', 'phone'],
                'conversation_step': 0,
                'last_activity': datetime.datetime.now(),
                'is_greeting_handled': False
            }
        else:
            self.user_sessions[session_id]['last_activity'] = datetime.datetime.now()
        return self.user_sessions[session_id]
    def get_conversation_history(self, salon_name: str, chat_id: int) -> List[str]:
        """Beszélgetés előzmények lekérése AI-hoz"""
        session = self.get_session(salon_name, chat_id)
        return session.get('conversation_history', [])
    
    def add_to_conversation_history(self, salon_name: str, chat_id: int, message: str):
        """Üzenet hozzáadása a beszélgetés előzményekhez"""
        session = self.get_session(salon_name, chat_id)
        
        if 'conversation_history' not in session:
            session['conversation_history'] = []
        
        session['conversation_history'].append(message)
        
        # Csak az utolsó 10 üzenetet tartjuk meg
        if len(session['conversation_history']) > 10:
            session['conversation_history'] = session['conversation_history'][-10:]
    
    def update_session(self, salon_name: str, chat_id: int, extracted_info: Dict, global_user_info: Dict):
        session = self.get_session(salon_name, chat_id)
        
        # Kinyert információk hozzáadása (csak ha nem None)
        for key, value in extracted_info.items():
            if value and key != 'confidence':
                session['extracted_info'][key] = value
        
        # Globális user info-ból hiányzó adatok kitöltése
        if global_user_info.get('name') and not session['extracted_info'].get('name'):
            session['extracted_info']['name'] = global_user_info['name']
        
        if global_user_info.get('phone') and not session['extracted_info'].get('phone'):
            session['extracted_info']['phone'] = global_user_info['phone']
        
        # Hiányzó információk meghatározása
        required_fields = ['service', 'date', 'time', 'name', 'phone']
        session['missing_info'] = [
            field for field in required_fields 
            if not session['extracted_info'].get(field)
        ]
        
        session['conversation_step'] += 1
    
    def mark_greeting_handled(self, salon_name: str, chat_id: int):
        """Köszönés kezelésének megjelölése"""
        session = self.get_session(salon_name, chat_id)
        session['is_greeting_handled'] = True
    
    def is_greeting_handled(self, salon_name: str, chat_id: int) -> bool:
        """Ellenőrzi, hogy kezeltük-e már a köszönést"""
        session = self.get_session(salon_name, chat_id)
        return session.get('is_greeting_handled', False)
    
    def get_missing_info(self, salon_name: str, chat_id: int) -> List[str]:
        """Hiányzó információk lekérése"""
        session = self.get_session(salon_name, chat_id)
        return session.get('missing_info', [])
    
    def get_extracted_info(self, salon_name: str, chat_id: int) -> Dict:
        """Kinyert információk lekérése"""
        session = self.get_session(salon_name, chat_id)
        return session.get('extracted_info', {})
    
    def clear_session(self, salon_name: str, chat_id: int):
        """Session törlése"""
        session_id = f"{salon_name}_{chat_id}"
        if session_id in self.user_sessions:
            del self.user_sessions[session_id]
        def get_conversation_history(self, salon_name: str, chat_id: int) -> List[str]:
            session_id = f"{salon_name}_{chat_id}"
            session = self.user_sessions.get(session_id, {})
            return session.get('conversation_history', [])
        
        def add_to_conversation_history(self, salon_name: str, chat_id: int, message: str):
            """Üzenet hozzáadása a beszélgetés előzményekhez"""
            session_id = f"{salon_name}_{chat_id}"
            if session_id not in self.user_sessions:
                self.user_sessions[session_id] = {}
            
            if 'conversation_history' not in self.user_sessions[session_id]:
                self.user_sessions[session_id]['conversation_history'] = []
            
            self.user_sessions[session_id]['conversation_history'].append(message)
            
            # Csak az utolsó 10 üzenetet tartjuk meg
            if len(self.user_sessions[session_id]['conversation_history']) > 10:
                self.user_sessions[session_id]['conversation_history'] = \
                    self.user_sessions[session_id]['conversation_history'][-10:]
    
    def get_missing_info(self, salon_name: str, chat_id: int) -> List[str]:
        """Hiányzó információk lekérése - DEBUG-GEL"""
        session = self.get_session(salon_name, chat_id)
        extracted_info = session.get('extracted_info', {})
        
        required_fields = ['service', 'date', 'time', 'name', 'phone']
        missing = [field for field in required_fields if not extracted_info.get(field)]

        if extracted_info.get('date') and not extracted_info.get('time') and not extracted_info.get('time_period'):
            if 'time_period' not in missing:
                missing.append('time_period')
        
        logger.info(f"🔍 [DEBUG] Missing info check:")
        logger.info(f"🔍 [DEBUG] - Session: {salon_name}_{chat_id}")
        logger.info(f"🔍 [DEBUG] - Extracted info: {extracted_info}")
        logger.info(f"🔍 [DEBUG] - Required fields: {required_fields}")
        logger.info(f"🔍 [DEBUG] - Missing: {missing}")
        
        return missing
    
    def get_extracted_info(self, salon_name: str, chat_id: int) -> Dict:
        """Kinyert információk lekérése - DEBUG-GEL"""
        session = self.get_session(salon_name, chat_id)
        extracted_info = session.get('extracted_info', {})
        
        logger.info(f"🔍 [DEBUG] Get extracted info: {extracted_info}")
        return extracted_info.copy()  # Másolat, hogy ne módosuljon

conversation_manager = ConversationManager()