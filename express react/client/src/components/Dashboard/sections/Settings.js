// sections/Settings.js
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = ({
  user,
  logout,
  toggleTheme,
  theme,
  loadDashboardData,
  backgroundChoice = 'blob',
  onBackgroundChange = () => {},
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Vendég';
    return `${user.first_name} ${user.last_name}`;
  };

  const getSalonName = () => {
    if (!user || !user.salon_db) return 'Fodrász Szalon';
    const salonName = user.salon_db.replace('salon_', '').replace(/_/g, ' ');
    return salonName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const bgOptions = useMemo(
    () => [
      { value: 'blob', label: 'Alap (folyékony háttér)' },
      { value: 'overview-bg.jpg', label: 'Háttér 1 (overview-bg.jpg)' },
      { value: '2.jpg', label: 'Háttér 2 (2.jpg)' },
      { value: '3.jpg', label: 'Háttér 3 (3.jpg)' },
    ],
    []
  );

  return (
    <section id="settings" className="section shown">
      <h1 className="title">Beállítások</h1>

      <div className="card">
        <h3>Felhasználói információk</h3>
        <div className="user-info">
          <div className="info-item">
            <strong>Név:</strong> {getUserDisplayName()}
          </div>
          <div className="info-item">
            <strong>Email:</strong> {user?.email}
          </div>
          <div className="info-item">
            <strong>Szalon:</strong> {getSalonName()}
          </div>
          <div className="info-item">
            <strong>Szerepkör:</strong> {user?.role}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Beállítások</h3>
        <div className="settings-options">
          <label className="setting-option">
            <span>Értesítések</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="setting-option">
            <span>Automatikus emailek</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="setting-option">
            <span>24 órás formátum</span>
            <input type="checkbox" />
          </label>
        </div>
      </div>

      <div className="card">
        <h3>Design</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Háttér kiválasztása (feltöltött képekből):</p>
        <div className="settings-options" style={{ flexDirection: 'column', gap: '10px' }}>
          {bgOptions.map((opt) => (
            <label key={opt.value} className="setting-option">
              <span>{opt.label}</span>
              <input
                type="radio"
                name="bg-choice"
                value={opt.value}
                checked={backgroundChoice === opt.value}
                onChange={() => onBackgroundChange(opt.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Rendszer műveletek</h3>
        <div className="system-actions">
          <button className="btn" onClick={loadDashboardData}>
            Adatok frissítése
          </button>
          <button className="btn ghost" onClick={toggleTheme}>
            Téma váltása ({theme === 'dark' ? 'Sötét' : 'Világos'})
          </button>
          <button className="btn danger" onClick={handleLogout}>
            Kijelentkezés
          </button>
        </div>
      </div>
    </section>
  );
};

export default Settings;
