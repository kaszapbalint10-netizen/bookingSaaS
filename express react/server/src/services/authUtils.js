const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Jelszó hash-elés
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Jelszó ellenőrzés
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// JWT token generálás
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '7d' // 7 nap
  });
}

// JWT token validálás
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Érvénytelen token');
  }
}

// Verification token generálás (32 karakteres random string)
function generateVerificationToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Email validáció
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Telefon validáció (magyar formátumok)
function isValidPhone(phone) {
  const phoneRegex = /^(\+36|06)[0-9]{8,9}$/;
  return phoneRegex.test(phone);
}

// Jelszó erősség validáció (min 8 karakter, 1 szám)
function isStrongPassword(password) {
  return password.length >= 8 && /\d/.test(password);
}

// Szalon név tisztítása (adatbázis névhez)
function cleanSalonName(salonName) {
  return salonName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateVerificationToken,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  cleanSalonName
};