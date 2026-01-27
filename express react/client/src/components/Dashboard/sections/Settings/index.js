
// components/Dashboard/sections/Settings/index.js
import React, { useState, useEffect } from 'react';
import ProfileSettings from './ProfileSettings';
import SalonSettings from './SalonSettings';
import NotificationSettings from './NotificationSettings';
import DesignSettings from './DesignSettings';
import SecuritySettings from './SecuritySettings';
import DataManagement from './DataManagement';
import axios from '../../utils/axiosConfig';
import { User, Building2, Bell, Droplet, Shield, Database } from 'lucide-react';
import './css/Settings.css';

const Settings = ({
  user,
  logout,
  toggleTheme,
  theme,
  loadDashboardData,
  onThemeUpdate,
  backgroundChoice,
  onBackgroundChange,
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/settings/settings');
      setSettingsData(data);
    } catch (error) {
      console.error('Beallitasok betoltese sikertelen:', error);
      setSettingsData({});
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', component: ProfileSettings, icon: User },
    { id: 'salon', label: 'Szalon', component: SalonSettings, icon: Building2 },
    { id: 'notifications', label: 'Értesítések', component: NotificationSettings, icon: Bell },
    { id: 'design', label: 'Design', component: DesignSettings, icon: Droplet },
    { id: 'security', label: 'Biztonság', component: SecuritySettings, icon: Shield },
    { id: 'data', label: 'Adatkezelés', component: DataManagement, icon: Database },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  if (loading) {
    return (
      <section id="settings" className="section shown">
        <div className="loading-spinner">Beállítások betöltése...</div>
      </section>
    );
  }

  return (
    <section id="settings" className="section shown">
      <h1 className="title">Beállítások</h1>

      <div className="settings-container">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {Icon && <Icon className="settings-nav-icon" strokeWidth={2.4} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="settings-content">
          {ActiveComponent && (
            <ActiveComponent
              user={user}
              settingsData={settingsData}
              onUpdate={loadSettingsData}
              logout={logout}
              toggleTheme={toggleTheme}
              theme={theme}
              onThemeUpdate={onThemeUpdate}
              backgroundChoice={backgroundChoice}
              onBackgroundChange={onBackgroundChange}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default Settings;



