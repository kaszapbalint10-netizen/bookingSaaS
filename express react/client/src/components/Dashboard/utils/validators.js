// utils/validators.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^(\+36|06)[0-9]{8,9}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  return password.length >= 8 && /\d/.test(password);
};