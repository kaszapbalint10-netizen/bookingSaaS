import React, { useState, useEffect } from 'react';
import {
  Home,
  CalendarClock,
  Users,
  Clock3,
  Settings,
  NotebookPen,
  Sparkles,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';

const iconMap = {
  overview: Home,
  appointments: CalendarClock,
  services: NotebookPen,
  'opening-hours': Clock3,
  team: Users,
  settings: Settings,
};

const GlassSidebar = ({
  items,
  currentSection,
  onSelect,
  deviceType = 'desktop',
  onToggleTheme = () => {},
  isDark = false,
  onLogout = () => {},
}) => {
  const [expanded, setExpanded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, opacity: 0 });
  const [dark, setDark] = useState(isDark);

  // Sync internal toggle state with prop so the UI reflects the actual theme
  useEffect(() => {
    setDark(isDark);
  }, [isDark]);

  if (deviceType === 'mobile') {
    return null;
  }

  const handleHoverEnter = (index, el) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();
    const top = rect.top - parentRect.top;
    setIndicator({ top, height: rect.height, opacity: 1 });
    setHoveredIndex(index);
  };

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false);
        setIndicator((prev) => ({ ...prev, opacity: 0 }));
        setHoveredIndex(null);
      }}
      className={`desktop-sidebar ${expanded ? 'expanded' : 'collapsed'}`}
    >
      <div className="sidebar-rail">
        <div className="sidebar-top">
          <div className="logo">
            <div className="logo-dot" />
          </div>

          <nav className="nav">
            <span
              className="nav-hover-indicator"
              style={{
                transform: `translateY(${indicator.top || 0}px)`,
                height: indicator.height || 0,
                opacity: indicator.opacity,
              }}
            />
            {items.map((item, index) => {
              const Icon = iconMap[item.id] || Sparkles;
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  onMouseEnter={(e) => handleHoverEnter(index, e.currentTarget)}
                  className={`nav-item ${active ? 'active' : ''} ${hoveredIndex === index ? 'hovering' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label" aria-hidden={!expanded}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className={`theme-switch ${dark ? 'is-on' : ''}`}
            onClick={() => {
              setDark((prev) => !prev);
              onToggleTheme();
            }}
            aria-pressed={dark}
            aria-label="Toggle theme"
          >
            <span className="switch-track" aria-hidden="true">
              <span className="switch-icon switch-icon-sun">
                <Sun />
              </span>
              <span className="switch-icon switch-icon-moon">
                <Moon />
              </span>
              <span className="switch-thumb" />
            </span>
          </button>

          <button
            type="button"
            className="theme-switch logout-switch"
            onClick={onLogout}
            aria-label="Logout"
          >
            <span className="switch-icon logout-icon" aria-hidden="true">
              <LogOut size={18} />
            </span>
            <span className="nav-label" aria-hidden={!expanded}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default GlassSidebar;
