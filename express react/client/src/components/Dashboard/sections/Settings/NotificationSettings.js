// components/Dashboard/sections/NotificationSettings/NotificationSettings.js
import React, { useState } from 'react';
import axios from '../../utils/axiosConfig';
import './css/NotificationSettings.css';

const NotificationSettings = ({ settingsData, onUpdate }) => {
  const [formData, setFormData] = useState({
    new_booking_notify: settingsData.notifications?.new_booking_notify ?? true,
    booking_update_notify: settingsData.notifications?.booking_update_notify ?? true,
    booking_cancel_notify: settingsData.notifications?.booking_cancel_notify ?? true,
    reminder_24h: settingsData.notifications?.reminder_24h ?? true,
    reminder_2h: settingsData.notifications?.reminder_2h ?? true,
    newsletter_subscribed: settingsData.notifications?.newsletter_subscribed ?? true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.patch('/api/dashboard/settings/notifications', formData);

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onUpdate();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba a mentés során' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-settings">
      <h2>Értesítési beállítások</h2>
      
      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          <div className="notification-category">
            <h3>📩 Email értesítések</h3>
            
            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  name="new_booking_notify"
                  checked={formData.new_booking_notify}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  <strong>Új foglalás</strong>
                  <small>Értesítés, amikor új időpontot foglalnak</small>
                </span>
              </label>

              <label className="toggle-item">
                <input
                  type="checkbox"
                  name="booking_update_notify"
                  checked={formData.booking_update_notify}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  <strong>Foglalás módosítás</strong>
                  <small>Értesítés, ha egy foglalást módosítanak</small>
                </span>
              </label>

              <label className="toggle-item">
                <input
                  type="checkbox"
                  name="booking_cancel_notify"
                  checked={formData.booking_cancel_notify}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  <strong>Foglalás lemondás</strong>
                  <small>Értesítés, ha egy foglalást lemondanak</small>
                </span>
              </label>
            </div>
          </div>

          <div className="notification-category">
            <h3>⏰ Automatikus emlékeztetők</h3>
            
            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  name="reminder_24h"
                  checked={formData.reminder_24h}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  <strong>24 órás emlékeztető</strong>
                  <small>Automatikus emlékeztető 24 órával a foglalás előtt</small>
                </span>
              </label>

              <label className="toggle-item">
                <input
                  type="checkbox"
                  name="reminder_2h"
                  checked={formData.reminder_2h}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  <strong>2 órás emlékeztető</strong>
                  <small>Automatikus emlékeztető 2 órával a foglalás előtt</small>
                </span>
              </label>
            </div>
          </div>

          <div className="notification-category">
            <h3>📬 Hírlevél</h3>
            
            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  name="newsletter_subscribed"
                  checked={formData.newsletter_subscribed}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  <strong>Hírlevél feliratkozás</strong>
                  <small>Kapj értesítéseket az új funkciókról és akciókról</small>
                </span>
              </label>
            </div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Mentés...' : 'Értesítési beállítások mentése'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationSettings;
