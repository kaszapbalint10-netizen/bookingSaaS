// src/config/menuConfig.js

export const menuItems = [
  { id: 'overview', icon: '/assets/icons/overview.png', label: 'Áttekintés' },
  { id: 'appointments', icon: '/assets/icons/appointments.png', label: 'Időpontok' },
  { id: 'team', icon: '/assets/icons/team.png', label: 'Csapat' },
  { id: 'services', icon: '/assets/icons/services.png', label: 'Szolgáltatások' },
  { id: 'tools', icon: '/assets/icons/services.png', label: 'Eszközök' },
  { id: 'products', icon: '/assets/icons/services.png', label: 'Termékek' },
  { id: 'opening-hours', icon: '/assets/icons/opening-hours.png', label: 'Nyitvatartás' },
  { id: 'settings', icon: '/assets/icons/settings.png', label: 'Beállítások' },
];

export const mobileMenuItems = [
  { id: 'overview', icon: '/assets/icons/overview.png', label: 'Főoldal' },
  { id: 'appointments', icon: '/assets/icons/appointments.png', label: 'Időpont' },
  { id: 'services', icon: '/assets/icons/services.png', label: 'Szolgáltatások' },
  { id: 'tools', icon: '/assets/icons/services.png', label: 'Eszközök' },
  { id: 'products', icon: '/assets/icons/services.png', label: 'Termékek' },
  { id: 'team', icon: '/assets/icons/team.png', label: 'Csapat' },
  { id: 'settings', icon: '/assets/icons/settings.png', label: 'Beállítások' },
];

export default {
  menuItems,
  mobileMenuItems,
};
