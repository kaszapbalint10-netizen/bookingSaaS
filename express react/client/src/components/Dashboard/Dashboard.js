// Dashboard.js - Apple-style glass dashboard
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import useDashboardData from './hooks/useDashboardData';
import axios from './utils/axiosConfig';

import './css/Dashboard.css';
import './css/Dashboard.Desktop.css';
import './css/Dashboard.Tablet.css';
import './css/Dashboard.Mobile.css';
import './css/Services.css';
import './css/OpeningHours.css';
import './sections/Overview/styles/overview.css';
import './sections/Overview/styles/KPI.css';
import './sections/Overview/styles/PricingCalendar.css';
import './sections/Overview/styles/liquid-bg.css';

import GlassSidebar from './components/GlassSidebar';
import HeroBanner from './components/HeroBanner';
import KpiSection from './components/KpiSection';
import ChartsSection from './components/ChartsSection';
import ServicesGrid from './components/ServicesGrid';
import OpeningHoursCalendar from './components/OpeningHoursCalendar';
import TeamSection from './components/TeamSection';
import AppointmentsSection from './components/AppointmentsSection';
import Settings from './sections/Settings/index';
import Overview from './sections/Overview/index';
import Tools from './sections/Tools';
import Products from './sections/Products';

import { menuItems } from './utils/menuConfig';

const DeviceContext = createContext();

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

const Dashboard = () => {
  const [currentSection, setCurrentSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  const [theme, setTheme] = useState('light');
  const [designTheme, setDesignTheme] = useState({
    primary: '#C612E6',
    secondary: '#a30fb7',
    gradientStart: '#0f172a',
    gradientEnd: '#020617',
    glass: true,
  });
  const [backgroundChoice, setBackgroundChoice] = useState('blob');

  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const {
    stats,
    appointments,
    services,
    team,
    openingHoursData,
    loading,
    loadServices,
    loadOpeningHours,
    loadStats,
    loadAppointments,
    loadTeam,
  } = useDashboardData();

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1025) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const savedBg = localStorage.getItem('dashboardBgChoice');
    if (savedBg) {
      setBackgroundChoice(savedBg);
    }
  }, []);

  const shadeColor = useCallback((color, percent) => {
    if (!color || color.length !== 7 || !color.startsWith('#')) return color || '#5ac8fa';
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = (num >> 16) + amt;
    const g = ((num >> 8) & 0x00ff) + amt;
    const b = (num & 0x0000ff) + amt;
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const toHex = (v) => clamp(v).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  const applyThemeVars = useCallback(
    (themeData) => {
      if (!themeData) return;
      const root = document.documentElement;
      const primary = themeData.primary || themeData.primary_color || '#5ac8fa';
      const shade = (color, percent) => {
        if (!color || color.length !== 7 || !color.startsWith('#')) return color || '#5ac8fa';
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const r = (num >> 16) + amt;
        const g = ((num >> 8) & 0x00ff) + amt;
        const b = (num & 0x0000ff) + amt;
        const clamp = (v) => Math.max(0, Math.min(255, v));
        const toHex = (v) => clamp(v).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--primary-strong', shade(primary, -12));
      root.style.setProperty('--primary-soft', shade(primary, 40));
      root.style.setProperty('--primary-dark', shade(primary, -18));
      root.style.setProperty('--primary-light', 'rgba(91, 140, 255, 0.1)');
      if (themeData.font_family) {
        root.style.setProperty('--font-family', themeData.font_family);
      }
    },
    []
  );

  useEffect(() => {
    const clearVars = [
      '--primary',
      '--primary-strong',
      '--primary-soft',
      '--primary-dark',
      '--primary-light',
      '--font-family',
    ];
    if (backgroundChoice === 'blob') {
      applyThemeVars(designTheme);
    } else {
      [document.body, document.documentElement].forEach((el) => {
        clearVars.forEach((v) => el?.style?.removeProperty(v));
      });
    }
  }, [backgroundChoice, designTheme, applyThemeVars]);

  const loadDesignTheme = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/dashboard/settings');
      const salonInfo = data?.salonInfo || {};
      // Tisztítsuk az esetlegesen megmaradt inline CSS változókat
      const clearVars = ['--primary', '--primary-strong', '--primary-soft', '--primary-dark', '--primary-light', '--font-family'];
      [document.body, document.documentElement].forEach((el) => {
        clearVars.forEach((v) => el?.style?.removeProperty(v));
      });
      setDesignTheme((prev) => ({
        ...prev,
        primary: salonInfo.primary_color || prev.primary,
        secondary: salonInfo.secondary_color || prev.secondary,
        gradientStart: salonInfo.gradient_start_color || prev.gradientStart,
        gradientEnd: salonInfo.gradient_end_color || prev.gradientEnd,
        glass: salonInfo.glass_effect_enabled !== undefined ? !!salonInfo.glass_effect_enabled : prev.glass,
      }));
      applyThemeVars({
        primary: salonInfo.primary_color,
        secondary: salonInfo.secondary_color,
        gradient_start_color: salonInfo.gradient_start_color,
        gradient_end_color: salonInfo.gradient_end_color,
        background_color: salonInfo.background_color,
        font_family: salonInfo.font_family,
      });
    } catch (error) {
      console.error('Design theme load error:', error);
    }
  }, [applyThemeVars]);

  useEffect(() => {
    if (location.state?.fromVerification && location.state?.section === 'settings') {
      setCurrentSection('settings');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    loadDesignTheme();
  }, [loadDesignTheme]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadStats(),
      loadAppointments(),
      loadServices(),
      loadOpeningHours(),
      loadTeam(),
    ]);
  }, [loadStats, loadAppointments, loadServices, loadOpeningHours, loadTeam]);

  const getSalonName = () => {
    if (!user || !user.salon_db) return 'Salon Dashboard';
    const salonName = user.salon_db.replace('salon_', '').replace(/_/g, ' ');
    return salonName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getUserDisplayName = () => {
    if (!user) return 'Vendeg';
    return `${user.first_name} ${user.last_name}`;
  };

  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    if (deviceType === 'mobile') {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <Overview
            stats={stats}
            appointments={appointments}
            services={services}
            user={user}
            backgroundChoice={backgroundChoice}
          />
        );
      case 'appointments':
        return <AppointmentsSection appointments={appointments} onReload={loadAppointments} />;
      case 'services':
        return <ServicesGrid services={services} loadServices={loadServices} />;
      case 'tools':
        return <Tools />;
      case 'products':
        return <Products />;
      case 'opening-hours':
        return <OpeningHoursCalendar openingHours={openingHoursData} />;
      case 'team':
      return <TeamSection team={team} loadTeam={loadTeam} />;
      case 'settings':
        return (
          <Settings
            user={user}
            logout={handleLogout}
            toggleTheme={toggleTheme}
            theme={theme}
            loadDashboardData={refreshAll}
            onThemeUpdate={loadDesignTheme}
            backgroundChoice={backgroundChoice}
            onBackgroundChange={(choice) => {
              setBackgroundChoice(choice);
              localStorage.setItem('dashboardBgChoice', choice);
            }}
          />
        );
      default:
        return <KpiSection stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-white bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-sm text-white/70">Dashboard betoltese...</p>
        </div>
      </div>
    );
  }

  return (
    <DeviceContext.Provider value={{ deviceType }}>
      <div className={`salon-dashboard ${theme === 'dark' ? 'dark' : ''}`}>
        <div
          className="liquid-bg"
          aria-hidden="true"
          style={
            backgroundChoice && backgroundChoice !== 'blob'
              ? {
                  backgroundImage: `url(/assets/backgrounds/${backgroundChoice})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : undefined
          }
        >
          {(!backgroundChoice || backgroundChoice === 'blob') && (
            <>
              <span className="blob blob-big" />
              <span className="blob blob-medium" />
              <span className="blob blob-small-a" />
              <span className="blob blob-small-b" />
            </>
          )}
        </div>

        <GlassSidebar
          items={menuItems}
          currentSection={currentSection}
          onSelect={handleSectionChange}
          deviceType={deviceType}
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
          isDark={theme === 'dark'}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />

        <main className="main">{renderSection()}</main>
      </div>
    </DeviceContext.Provider>
  );
};

export default Dashboard;
