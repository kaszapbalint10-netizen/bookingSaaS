# backend/security/rate_limiter.py
import time
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class RateLimiter:
    """Egyszerű rate limiter"""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.user_requests = defaultdict(list)
    
    def is_allowed(self, user_id: int) -> bool:
        """Ellenőrzi, hogy a user küldhet-e üzenetet"""
        now = time.time()
        user_requests = self.user_requests[user_id]
        
        # Régi request-ek törlése
        user_requests[:] = [req_time for req_time in user_requests 
                           if now - req_time < self.window_seconds]
        
        # Limit ellenőrzése
        if len(user_requests) >= self.max_requests:
            logger.warning(f"🚨 Rate limit exceeded for user {user_id}")
            return False
        
        # Új request hozzáadása
        user_requests.append(now)
        return True

# Globális rate limiter
rate_limiter = RateLimiter(max_requests=15, window_seconds=60)