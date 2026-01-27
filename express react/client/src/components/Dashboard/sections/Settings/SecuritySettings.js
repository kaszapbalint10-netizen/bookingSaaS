// components/Dashboard/sections/SecuritySettings/SecuritySettings.js
import React, { useState } from 'react';
import PasswordStrength from './/PasswordStrength';
import SessionManager from '../../SessionManager/SessionManager';
import axios from '../../utils/axiosConfig';
import './css/SecuritySettings.css';

const SecuritySettings = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('password');
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'password', label: '🔐 Jelszó' },
    { id: 'sessions', label: '💻 Munkamenetek' },
    { id: '2fa', label: '🛡️ Kétfaktoros azonosítás' }
  ];

  return (
    <div className="security-settings">
      <h2>Biztonsági beállítások</h2>
      
      <div className="security-tabs">
        <nav className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="tab-content">
          {activeTab === 'password' && (
            <PasswordChangeForm onUpdate={onUpdate} setMessage={setMessage} />
          )}
          
          {activeTab === 'sessions' && (
            <SessionManager user={user} />
          )}
          
          {activeTab === '2fa' && (
            <TwoFactorSettings />
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

// Jelszó változtatás komponens
const PasswordChangeForm = ({ onUpdate, setMessage }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validációk
    if (formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'A jelszavak nem egyeznek' });
      setLoading(false);
      return;
    }

    if (formData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie' });
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.patch('/api/dashboard/settings/password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        onUpdate();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba a jelszó módosítása során' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-change-form">
      <h3>Jelszó módosítása</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Jelenlegi jelszó</label>
          <input
            type="password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            required
            placeholder="Add meg a jelenlegi jelszavad"
          />
        </div>

        <div className="form-group">
          <label>Új jelszó</label>
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            required
            placeholder="Legalább 8 karakter"
          />
          <PasswordStrength password={formData.new_password} />
        </div>

        <div className="form-group">
          <label>Új jelszó megerősítése</label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            placeholder="Írd be újra az új jelszót"
          />
        </div>

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Mentés...' : 'Jelszó módosítása'}
        </button>
      </form>
    </div>
  );
};

// Kétfaktoros azonosítás komponens
const TwoFactorSettings = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle2FA = async () => {
    setLoading(true);
    
    try {
      // Itt kell implementálni a 2FA be/kapcsolást
      // Most csak mockoljuk
      setTimeout(() => {
        setTwoFAEnabled(!twoFAEnabled);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('2FA hiba:', error);
      setLoading(false);
    }
  };

  return (
    <div className="twofa-settings">
      <h3>Kétfaktoros azonosítás (2FA)</h3>
      
      <div className="twofa-status">
        <div className="status-info">
          <strong>Állapot:</strong>
          <span className={`status ${twoFAEnabled ? 'enabled' : 'disabled'}`}>
            {twoFAEnabled ? '🔒 Bekapcsolva' : '🔓 Kikapcsolva'}
          </span>
        </div>
        
        <p className="twofa-description">
          A kétfaktoros azonosítás extra biztonsági réteget ad a fiókodhoz. 
          Bejelentkezéskor nem csak a jelszavadat, hanem egy időalapú kódot is meg kell adnod.
        </p>

        <button 
          className={`btn ${twoFAEnabled ? 'danger' : 'primary'}`}
          onClick={handleToggle2FA}
          disabled={loading}
        >
          {loading ? 'Feldolgozás...' : 
           twoFAEnabled ? '2FA kikapcsolása' : '2FA bekapcsolása'}
        </button>

        {twoFAEnabled && (
          <div className="twofa-setup">
            <h4>Beállítási útmutató</h4>
            <ol>
              <li>Töltsd le az Authenticator alkalmazást (Google Authenticator, Authy)</li>
              <li>Olvasd be a QR kódot az alkalmazással</li>
              <li>Add meg a generált 6 számjegyű kódot a megerősítéshez</li>
            </ol>
            <div className="qr-code-placeholder">
              {/* Itt jelenik meg a QR kód */}
              <div className="qr-code-mock">
                <span>QR Kód helye</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
