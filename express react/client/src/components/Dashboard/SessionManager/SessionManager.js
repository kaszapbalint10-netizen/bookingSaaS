// components/Dashboard/components/SessionManager/SessionManager.js
import React, { useState, useEffect } from 'react';
import './css/SessionManager.css';

const SessionManager = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // Mock adatok - később API hívással kell helyettesíteni
      const mockSessions = [
        {
          id: 1,
          user_agent: 'Chrome/Windows',
          ip_address: '192.168.1.100',
          login_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true
        },
        {
          id: 2,
          user_agent: 'Firefox/MacOS',
          ip_address: '192.168.1.101',
          login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          is_active: false
        }
      ];
      
      setSessions(mockSessions);
    } catch (error) {
      console.error('Munkamenetek betöltési hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      // API hívás a munkamenet megszakításához
      console.log('Munkamenet megszakítása:', sessionId);
      
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Munkamenet megszakítási hiba:', error);
    }
  };

  const terminateAllSessions = async () => {
    try {
      // API hívás az összes munkamenet megszakításához
      console.log('Összes munkamenet megszakítása');
      
      setSessions(prev => prev.filter(session => session.is_active));
    } catch (error) {
      console.error('Munkamenetek megszakítási hiba:', error);
    }
  };

  if (loading) {
    return <div className="loading">Munkamenetek betöltése...</div>;
  }

  return (
    <div className="session-manager">
      <h3>Aktív munkamenetek</h3>
      
      <div className="sessions-list">
        {sessions.map(session => (
          <div key={session.id} className={`session-item ${session.is_active ? 'active' : ''}`}>
            <div className="session-info">
              <div className="session-device">
                <strong>{session.user_agent}</strong>
                {session.is_active && <span className="current-badge">Aktív</span>}
              </div>
              <div className="session-details">
                <span>IP: {session.ip_address}</span>
                <span>Belépve: {new Date(session.login_at).toLocaleString('hu-HU')}</span>
                <span>Utolsó tevékenység: {new Date(session.last_activity).toLocaleString('hu-HU')}</span>
              </div>
            </div>
            
            {!session.is_active && (
              <button 
                className="btn danger"
                onClick={() => terminateSession(session.id)}
              >
                Kijelentkeztetés
              </button>
            )}
          </div>
        ))}
      </div>

      {sessions.filter(s => !s.is_active).length > 0 && (
        <div className="session-actions">
          <button 
            className="btn danger"
            onClick={terminateAllSessions}
          >
            Összes munkamenet megszakítása
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionManager;