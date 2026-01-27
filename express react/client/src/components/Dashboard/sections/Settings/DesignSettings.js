// components/Dashboard/sections/DesignSettings/DesignSettings.js
import React, { useMemo, useState } from 'react';
import ImageUpload from './ImageUpload';
import axios from '../../utils/axiosConfig';
import './css/DesignSettings.css';

const DEFAULT_THEME = {
  primary: '#C612E6',
  gradientStart: '#0f172a',
  gradientEnd: '#020617',
  font: 'Arial',
  glass: true,
};

const DesignSettings = ({
  settingsData,
  onUpdate,
  onThemeUpdate,
  backgroundChoice = 'blob',
  onBackgroundChange = () => {},
}) => {
  const currentBg = backgroundChoice || 'blob';
  const [formData, setFormData] = useState({
    primary_color: settingsData.salonInfo?.primary_color || DEFAULT_THEME.primary,
    font_family: settingsData.salonInfo?.font_family || DEFAULT_THEME.font,
    glass_effect_enabled:
      settingsData.salonInfo?.glass_effect_enabled !== undefined
        ? !!settingsData.salonInfo.glass_effect_enabled
        : DEFAULT_THEME.glass,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const shadeColor = (color, percent) => {
    // Simple hex lighten/darken helper; assumes #rrggbb
    if (!color || color.length !== 7 || !color.startsWith('#')) return color || DEFAULT_THEME.primary;
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = (num >> 16) + amt;
    const g = ((num >> 8) & 0x00ff) + amt;
    const b = (num & 0x0000ff) + amt;
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const toHex = (v) => clamp(v).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const derivedColors = useMemo(() => {
    const primary = formData.primary_color || DEFAULT_THEME.primary;
    return {
      secondary: shadeColor(primary, -12),
      gradientStart: shadeColor(primary, 14),
      gradientEnd: shadeColor(primary, -18),
      soft: shadeColor(primary, 40),
    };
  }, [formData.primary_color]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleGlass = () => {
    setFormData((prev) => ({
      ...prev,
      glass_effect_enabled: !prev.glass_effect_enabled,
    }));
  };

  const handleColorChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        primary_color: formData.primary_color,
        font_family: formData.font_family,
        glass_effect_enabled: formData.glass_effect_enabled ? 1 : 0,
      };

      const { data } = await axios.patch('/api/dashboard/settings/design', payload);

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onUpdate();
        onThemeUpdate?.();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error while saving design settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = (imageUrl) => {
    axios
      .patch('/api/dashboard/settings/design', { hero_image_url: imageUrl })
      .then(({ data }) => {
        if (data.success) {
          setMessage({ type: 'success', text: 'Hero image updated' });
          onUpdate();
        } else if (data.error) {
          setMessage({ type: 'error', text: data.error });
        }
      })
      .catch((error) => {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Error while uploading hero image',
        });
      });
  };

  const handleFaviconUpload = (imageUrl) => {
    setMessage('');
    if (!imageUrl) {
      setMessage({
        type: 'error',
        text: 'Favicon must be PNG, WebP or SVG (under 1MB).',
      });
      return;
    }

    axios
      .patch('/api/dashboard/settings/design', { favicon_url: imageUrl })
      .then(({ data }) => {
        if (data.success) {
          setMessage({ type: 'success', text: 'Favicon updated' });
          onUpdate();
        } else if (data.error) {
          setMessage({ type: 'error', text: data.error });
        }
      })
      .catch((error) => {
        const errMsg =
          error.response?.data?.error ||
          'Error while uploading favicon. Only PNG/SVG/WebP allowed, max 1MB.';
        setMessage({ type: 'error', text: errMsg });
      });
  };

  const handleResetTheme = () => {
    setFormData({
      primary_color: DEFAULT_THEME.primary,
      font_family: formData.font_family || DEFAULT_THEME.font,
      glass_effect_enabled: DEFAULT_THEME.glass,
    });
    setMessage({
      type: 'info',
      text: 'Default primary + liquid glass restored. Save to apply.',
    });
  };

  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Courier New', label: 'Courier New' },
  ];

  return (
    <div className="design-settings">
      <h2>Design beállítások</h2>

      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          {/* Colors */}
          <div className="design-section">
            <h3>Brand color & glass</h3>
            <div className="theme-actions">
              <button
                type="button"
                className="theme-reset-btn"
                onClick={handleResetTheme}
                disabled={loading}
              >
                Restore defaults
              </button>
            </div>

            <div className="color-picker-group single">
              <div className="color-picker">
                <label>Primary color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    placeholder="#5ac8fa"
                  />
                </div>
                <div
                  className="color-preview"
                  style={{ backgroundColor: formData.primary_color }}
                ></div>
                <p className="color-helper">
                  Single brand color. Secondary/gradients are auto-generated.
                </p>
              </div>
            </div>

            <div className="toggle-row">
              <div>
                <label className="toggle-label">Liquid Glass</label>
                <p className="toggle-helper">macOS-style glass blur + glow (default ON)</p>
              </div>
              <button
                type="button"
                className={`glass-toggle ${formData.glass_effect_enabled ? 'on' : 'off'}`}
                onClick={handleToggleGlass}
              >
                <span className="thumb" />
                <span className="glass-toggle-text">
                  {formData.glass_effect_enabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            {/* Preview */}
            <div className="design-preview">
              <h4>Preview</h4>
              <div
                className={`preview-card ${formData.glass_effect_enabled ? 'glass-on' : 'glass-off'}`}
                style={{
                  '--primary-color': formData.primary_color,
                  '--secondary-color': derivedColors.secondary,
                  '--primary-soft': derivedColors.soft,
                  '--font-family': formData.font_family,
                  '--glass-border': formData.glass_effect_enabled
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(255,255,255,0.18)',
                  '--glass-bg': formData.glass_effect_enabled
                    ? 'rgba(255,255,255,0.14)'
                    : 'rgba(0,0,0,0.22)',
                  '--glass-glow': formData.glass_effect_enabled
                    ? '0 22px 48px rgba(0,0,0,0.35)'
                    : '0 12px 22px rgba(0,0,0,0.18)',
                  backgroundImage: `radial-gradient(circle at 20% 20%, ${derivedColors.gradientStart}33, transparent 40%), radial-gradient(circle at 80% 0%, ${derivedColors.gradientEnd}55, transparent 45%), linear-gradient(135deg, ${derivedColors.gradientStart}, ${derivedColors.gradientEnd})`,
                  backgroundColor: derivedColors.gradientEnd,
                }}
              >
                <div
                  className={`preview-header ${
                    formData.glass_effect_enabled ? 'glass-on' : 'glass-off'
                  }`}
                  style={{ backgroundColor: formData.glass_effect_enabled ? 'transparent' : formData.primary_color }}
                >
                  <h3 style={{ color: 'white', fontFamily: formData.font_family }}>
                    {settingsData.salonInfo?.salon_name || 'Szalon Neve'}
                  </h3>
                </div>
                <div className="preview-content">
                  <button
                    className="preview-btn primary"
                    style={{
                      backgroundColor: formData.primary_color,
                      fontFamily: formData.font_family,
                    }}
                  >
                    Primary action
                  </button>
                  <button
                    className="preview-btn secondary"
                    style={{
                      backgroundColor: derivedColors.secondary,
                      fontFamily: formData.font_family,
                    }}
                  >
                    Secondary action
                  </button>
                  <div className={`glass-chip ${formData.glass_effect_enabled ? 'glass-on' : 'glass-off'}`}>
                    {formData.glass_effect_enabled ? 'Glass enabled' : 'Glass disabled'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="design-section">
            <h3>Typography</h3>

            <div className="form-group">
              <label>Font family</label>
              <select
                name="font_family"
                value={formData.font_family}
                onChange={handleChange}
                style={{ fontFamily: formData.font_family }}
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
          </div>
        </div>

          {/* Háttér */}
          <div className="design-section">
            <h3>Háttér</h3>
            <p className="color-helper">Válassz a feltöltött képek közül vagy maradjon a blob háttér.</p>
            <div
              className="settings-options"
              style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px' }}
            >
              {[
                { value: 'blob', label: 'Alap (folyékony háttér)' },
                { value: 'overview-bg.jpg', label: 'Háttér 1 (overview-bg.jpg)', thumb: '/assets/backgrounds/overview-bg.jpg' },
                { value: '2.jpg', label: 'Háttér 2 (2.jpg)', thumb: '/assets/backgrounds/2.jpg' },
                { value: '3.jpg', label: 'Háttér 3 (3.jpg)', thumb: '/assets/backgrounds/3.jpg' },
              ].map((opt) => {
                const isBlob = opt.value === 'blob';
                const thumbStyle = isBlob
                  ? {
                      backgroundImage:
                        'radial-gradient(circle at 20% 20%, rgba(122,155,255,0.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(90,200,250,0.5), transparent 45%), linear-gradient(140deg, #0f172a, #020617)',
                    }
                  : { backgroundImage: `url(${opt.thumb})` };
                return (
                  <label key={opt.value} className="setting-option bg-option">
                    <div className="bg-thumb" style={thumbStyle} />
                    <span>{opt.label}</span>
                    <input
                      type="radio"
                      name="bg-choice"
                      value={opt.value}
                      checked={currentBg === opt.value}
                      onChange={() => onBackgroundChange(opt.value)}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Images */}
          <div className="design-section">
            <h3>Képek</h3>

            <div className="image-upload-section">
              <div className="image-upload-item">
                <h4>Hero kép</h4>
                <p>Főoldalon megjelenő nagy kép</p>
                <ImageUpload
                  currentImage={settingsData.salonInfo?.hero_image_url}
                  onImageUpload={handleHeroImageUpload}
                  type="hero"
                  entityId={settingsData.salonInfo?.id || 'salon-hero'}
                />
              </div>

              <div className="image-upload-item">
                <h4>Favicon</h4>
                <p>Böngésző lapon megjelenő kis ikon (16x16 vagy 32x32 pixel)</p>
                <ImageUpload
                  currentImage={settingsData.salonInfo?.favicon_url}
                  onImageUpload={handleFaviconUpload}
                  type="favicon"
                  entityId={settingsData.salonInfo?.id || 'salon-favicon'}
                />
              </div>
            </div>
          </div>

          {message && <div className={`message ${message.type}`}>{message.text}</div>}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Mentés...' : 'Design beállítások mentése'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DesignSettings;
