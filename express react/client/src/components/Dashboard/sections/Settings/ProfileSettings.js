// components/Dashboard/sections/ProfileSettings/ProfileSettings.js
import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import axios from '../../utils/axiosConfig';
import './css/ProfileSettings.css';

const ProfileSettings = ({ user, settingsData, onUpdate }) => {
  const [formData, setFormData] = useState({
    first_name: settingsData.profile?.first_name || user?.first_name || '',
    last_name: settingsData.profile?.last_name || user?.last_name || '',
    phone: settingsData.profile?.phone || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

    try {
      const { data } = await axios.patch('/api/dashboard/settings/profile', formData);

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onUpdate();
      } else {
        setMessage({ type: 'error', text: data.error || 'Mentési hiba' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba a mentés során' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (imageUrl) => {
    // Profilkép mentése
    axios.post('/api/dashboard/settings/profile-image', { image_url: imageUrl })
      .then(({ data }) => {
        if (data.success) {
          setMessage({ type: 'success', text: data.message });
          onUpdate();
        } else {
          setMessage({ type: 'error', text: data.error || 'Kép mentési hiba' });
        }
      })
      .catch((error) => {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba a kép feltöltése során' });
      });
  };

  return (
    <div className="profile-settings">
      <h2>Profil beállítások</h2>
      
      <div className="settings-card">
        {/* Profilkép feltöltés */}
        <div className="profile-image-section">
          <h3>Profilkép</h3>
          <ImageUpload 
            currentImage={settingsData.profile?.profile_image}
            onImageUpload={handleImageUpload}
            type="profile"
            entityId={user?.id}
          />
        </div>

        {/* Alapadatok */}
        <form onSubmit={handleSubmit} className="profile-form">
          <h3>Alapadatok</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Keresztnév</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Vezetéknév</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email cím</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="disabled-input"
            />
            <small>Email cím módosításához használd az "Email módosítása" gombot</small>
          </div>

          <div className="form-group">
            <label>Telefonszám</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+36 20 123 4567"
            />
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Mentés...' : 'Profil mentése'}
          </button>
        </form>

        {/* Email módosítás */}
        <div className="email-change-section">
          <h3>Email cím módosítása</h3>
          <EmailChangeForm 
            currentEmail={formData.email}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  );
};

// Email változtatás komponens
const EmailChangeForm = ({ currentEmail, onUpdate }) => {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.patch('/api/dashboard/settings/email', { new_email: newEmail });

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setNewEmail('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba az email módosítása során' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="email-change-form">
      <div className="form-group">
        <label>Új email cím</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="új.email@example.com"
          required
        />
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <button type="submit" className="btn secondary" disabled={loading}>
        {loading ? 'Küldés...' : 'Email módosítása'}
      </button>
    </form>
  );
};

export default ProfileSettings;
