// server/src/routes/dashboard/index.js
const router = require('express').Router();
const dashboardAuth = require('../../middleware/dashboardAuth');

// Alrouter-ek importálása
const statsRoutes = require('./stats');
const servicesRoutes = require('./services');
const teamRoutes = require('./team');
const appointmentsRoutes = require('./appointments');
const openingHoursRoutes = require('./opening-hours');
const overviewRoutes = require('./overview');
const authRoutes = require('./auth');
const settingsRoutes = require('./settings');
const resourcesRoutes = require('./resources');

// Globális dashboard hitelesítés
router.use('/dashboard', dashboardAuth);

// Alrouter-ek összefűzése
router.use('/dashboard', statsRoutes);
router.use('/dashboard', servicesRoutes);
router.use('/dashboard', teamRoutes);
router.use('/dashboard', appointmentsRoutes);
router.use('/dashboard', openingHoursRoutes);
router.use('/dashboard', overviewRoutes);
router.use('/dashboard', settingsRoutes);
router.use('/dashboard', resourcesRoutes);
router.use('/auth', authRoutes);

module.exports = router;
