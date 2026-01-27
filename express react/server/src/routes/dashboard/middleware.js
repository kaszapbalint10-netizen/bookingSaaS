// server/src/routes/dashboard/middleware.js
const dashboardAuth = require('../../middleware/dashboardAuth');

const ensureSalonDb = (req, res, next) => dashboardAuth(req, res, next);

const errorHandler = (res, error, message) => {
  console.error(message, error);
  res.status(500).json({ error: message });
};

module.exports = {
  ensureSalonDb,
  errorHandler
};
