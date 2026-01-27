// server/src/middleware/dashboardAuth.js
const jwt = require('jsonwebtoken');
const { ensureSalonTables } = require('../../database/database');

const dashboardAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Nincs bejelentkezve' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      console.error('JWT verify error:', err.message);
      return res.status(401).json({ error: 'Érvénytelen vagy lejárt token' });
    }

    if (!decoded?.salonDb) {
      return res.status(401).json({ error: 'Hiányzik a szalon adatbázis azonosító' });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      salon_db_name: decoded.salonDb,
      role: decoded.role || 'owner',
      first_name: decoded.firstName || decoded.first_name || '',
      last_name: decoded.lastName || decoded.last_name || ''
    };

    await ensureSalonTables(req.user.salon_db_name);
    next();
  } catch (error) {
    console.error('Dashboard auth error:', error);
    res.status(500).json({ error: 'Hiba a hitelesítés során' });
  }
};

module.exports = dashboardAuth;
