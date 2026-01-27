// components/Dashboard/sections/SalonSettings/SalonSettings.js
import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import axios from '../../utils/axiosConfig';
import './css/SalonSettings.css';

const SalonSettings = ({ settingsData, onUpdate }) => {
  const [formData, setFormData] = useState({
    salon_name: settingsData.salonInfo?.salon_name || '',
    address_street: settingsData.salonInfo?.address_street || '',
    address_city: settingsData.salonInfo?.address_city || '',
    address_zip: settingsData.salonInfo?.address_zip || '',
    phone: settingsData.salonInfo?.phone || '',
    email: settingsData.salonInfo?.email || '',
    website: settingsData.salonInfo?.website || '',
    description: settingsData.salonInfo?.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.patch('/api/dashboard/settings/salon-info', formData);

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

  const handleLogoUpload = (logoUrl) => {
    axios.patch('/api/dashboard/settings/design', { logo_url: logoUrl })
      .then(({ data }) => {
        if (data.success) {
          setMessage({ type: 'success', text: 'Logo sikeresen frissítve' });
          onUpdate();
        } else if (data.error) {
          setMessage({ type: 'error', text: data.error });
        }
      })
      .catch((error) => {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba a logo feltöltése során' });
      });
  };

  return (
    <div className="salon-settings">
      <h2>Szalon beállítások</h2>
      
      <div className="settings-card">
        {/* Logo feltöltés */}
        <div className="logo-section">
          <h3>Szalon logo</h3>
          <ImageUpload 
            currentImage={settingsData.salonInfo?.logo_url}
            onImageUpload={handleLogoUpload}
            type="logo"
            entityId={settingsData.salonInfo?.id || settingsData.salonInfo?.salon_name || 'salon-logo'}
          />
        </div>

        {/* Szalon információk */}
        <form onSubmit={handleSubmit} className="salon-form">
          <h3>Alap információk</h3>
          
          <div className="form-group">
            <label>Szalon neve *</label>
            <input
              type="text"
              name="salon_name"
              value={formData.salon_name}
              onChange={handleChange}
              required
              placeholder="Az Ön Szalonja Neve"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Utca, házszám</label>
              <input
                type="text"
                name="address_street"
                value={formData.address_street}
                onChange={handleChange}
                placeholder="Fő utca 1."
              />
            </div>
            
            <div className="form-group">
              <label>Város</label>
              <input
                type="text"
                name="address_city"
                value={formData.address_city}
                onChange={handleChange}
                placeholder="Budapest"
              />
            </div>
            
            <div className="form-group">
              <label>Irányítószám</label>
              <input
                type="text"
                name="address_zip"
                value={formData.address_zip}
                onChange={handleChange}
                placeholder="1011"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Telefonszám</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+36 1 234 5678"
              />
            </div>
            
            <div className="form-group">
              <label>Email cím</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="szalon@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Weboldal</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label>Rövid leírás a szalonról</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Írjon egy rövid leírást a szalonjáról, szolgáltatásairól..."
              maxLength="500"
            />
            <small>{formData.description.length}/500 karakter</small>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Mentés...' : 'Szalon információk mentése'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalonSettings;
