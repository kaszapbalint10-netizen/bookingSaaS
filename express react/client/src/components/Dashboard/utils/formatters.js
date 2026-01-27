// utils/formatters.js
export const formatCurrency = (amount) => {
  if (!amount) return '0 Ft';
  return new Intl.NumberFormat('hu-HU').format(amount) + ' Ft';
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString.substring(0, 5); // HH:MM formátum
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('hu-HU');
};