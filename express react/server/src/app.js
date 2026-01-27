const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const assistantsRoute = require('./routes/assistants');
const bookingsRoute = require('./routes/bookings');
const healthRoute = require('./routes/health');
const dashboardRoute = require('./routes/dashboard/');
const authRoute = require('./routes/auth'); 
const guestRoute = require('./routes/guest'); 
const settingsRoute = require('./routes/dashboard/settings');
const assetsRoute = require('./routes/assets');
const salonsRoute = require('./routes/salons');

const app = express();

// CORS beállítás
const allowLocal = (origin = '') =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
  /^http:\/\/192\.168\.\d+\.\d+(?::\d+)?$/i.test(origin) ||
  /^http:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/i.test(origin);

const extraOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman / same-origin
      if (allowLocal(origin) || extraOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('CORS blocked'), false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statikus fájlok
app.use('/images', express.static(path.join(__dirname, '..', 'config')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Route-ok
app.use('/api', assistantsRoute);
app.use('/api', bookingsRoute);
app.use('/api', healthRoute);
app.use('/api', dashboardRoute);
app.use('/api/auth', authRoute); 
app.use('/api/guest', guestRoute); 
app.use('/api/dashboard/settings', settingsRoute);
app.use('/api/assets', assetsRoute);
app.use('/api/salons', salonsRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Salon Management API'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error.message);
  res.status(500).json({ 
    error: 'Szerver hiba',
    message: 'A szerver átmenetileg nem elérhető'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint nem található',
    path: req.path,
    method: req.method
  });
});

module.exports = app;
