// sections/Overview/hooks/useAutoRefresh.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useAutoRefresh = (refreshCallback) => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('--:--');
  const intervalRef = useRef(null);

  const toggleAutoRefresh = useCallback(() => {
    const newState = !isAutoRefresh;
    setIsAutoRefresh(newState);
    
    if (newState) {
      // Start auto refresh
      intervalRef.current = setInterval(() => {
        refreshCallback();
        setLastRefresh(new Date().toLocaleTimeString('hu-HU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }, 5 * 60 * 1000); // 5 minutes
    } else {
      // Stop auto refresh
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isAutoRefresh, refreshCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isAutoRefresh,
    toggleAutoRefresh,
    lastRefresh
  };
};