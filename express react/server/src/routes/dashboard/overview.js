// server/src/routes/dashboard/overview.js
const router = require('express').Router();
const { connectToSalonDatabase } = require('../../../database/database');
const { computeProductivity } = require('../../services/productivityService');
const { ensureSalonDb } = require('./middleware');

const toDateKey = (date) => date.toISOString().split('T')[0];

const columnExists = async (db, databaseName, table, column) => {
  const [rows] = await db.promise().execute(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    [databaseName, table, column]
  );
  return rows.length > 0;
};

const tableExists = async (db, databaseName, table) => {
  const [rows] = await db.promise().execute(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name = ?
      LIMIT 1
    `,
    [databaseName, table]
  );
  return rows.length > 0;
};

const buildDailySeries = (length, rows) => {
  const today = new Date();
  const rowMap = new Map(rows.map((row) => [row.day, row]));
  const series = [];

  for (let i = length - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = toDateKey(date);
    const row = rowMap.get(key) || {};

    series.push({
      date: key,
      revenue: Number(row.revenue || 0),
      appointments: Number(row.appointments || 0),
    });
  }

  return series;
};

const buildMonthlySeries = (length, rows) => {
  const base = new Date();
  const rowMap = new Map(rows.map((row) => [row.bucket, row]));
  const series = [];

  for (let i = length - 1; i >= 0; i -= 1) {
    const date = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    const row = rowMap.get(key) || {};

    series.push({
      date: key,
      revenue: Number(row.revenue || 0),
      appointments: Number(row.appointments || 0),
    });
  }

  return series;
};

router.get('/overview/charts', ensureSalonDb, async (req, res) => {
  try {
    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const dbName = req.user.salon_db_name;

    const hasBookings = await tableExists(db, dbName, 'bookings');
    const hasServices = await tableExists(db, dbName, 'services');
    const hasPriceColumn = hasBookings
      ? await columnExists(db, dbName, 'bookings', 'price')
      : false;

    const revenueExpr = hasPriceColumn ? 'COALESCE(SUM(price), 0)' : '0';

    let revenueWeek = [];
    let revenueMonth = [];
    let revenueYear = [];
    let calendar = [];
    let services = [];

    if (hasBookings) {
      const [weekRows] = await db.promise().execute(
        `
          SELECT DATE(booking_date) AS day,
                 COUNT(*) AS appointments,
                 ${revenueExpr} AS revenue
          FROM bookings
          WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          GROUP BY day
          ORDER BY day
        `
      );
      revenueWeek = buildDailySeries(7, weekRows);

      const [monthRows] = await db.promise().execute(
        `
          SELECT DATE(booking_date) AS day,
                 COUNT(*) AS appointments,
                 ${revenueExpr} AS revenue
          FROM bookings
          WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
          GROUP BY day
          ORDER BY day
        `
      );
      revenueMonth = buildDailySeries(30, monthRows);

      const [yearRows] = await db.promise().execute(
        `
          SELECT DATE_FORMAT(booking_date, '%Y-%m-01') AS bucket,
                 COUNT(*) AS appointments,
                 ${revenueExpr} AS revenue
          FROM bookings
          WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY bucket
          ORDER BY bucket
        `
      );
      revenueYear = buildMonthlySeries(12, yearRows);

      calendar = await computeProductivity({
        salonDbName: dbName,
        daysBack: 90,
        avgServiceMinutes: 45,
        fallbackAvgPrice: 15000,
      });

      const [serviceRows] = await db.promise().execute(
        `
          SELECT service,
                 COUNT(*) AS total,
                 ${revenueExpr} AS revenue
          FROM bookings
          WHERE service IS NOT NULL AND service <> ''
          GROUP BY service
          ORDER BY total DESC
          LIMIT 8
        `
      );

      if (serviceRows.length) {
        services = serviceRows.map((row) => ({
          name: row.service,
          value: Number(row.total || 0),
          revenue: Number(row.revenue || 0),
        }));
      }
    }

    if (!services.length && hasServices) {
      const [serviceFallback] = await db
        .promise()
        .execute(
          'SELECT service, time, price FROM services ORDER BY service LIMIT 8'
        );
      services = serviceFallback.map((row) => ({
        name: row.service,
        value: Number(row.time || 0),
        revenue: Number(row.price || 0),
      }));
    }

    if (!calendar.length && hasOpeningHours) {
      const [hoursRows] = await db
        .promise()
        .execute(
          `
            SELECT date AS day,
                   COUNT(*) AS appointments
            FROM opening_hours
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY day
            ORDER BY day
          `
        );
      calendar = hoursRows.map((row) => ({
        date: row.day,
        revenue: 0,
        appointments: Number(row.appointments || 0),
      }));
    }

    res.json({
      revenue: {
        week: revenueWeek,
        month: revenueMonth,
        year: revenueYear,
      },
      services,
      calendar,
      productivity: calendar,
    });
  } catch (error) {
    console.error('Overview charts hiba:', error);
    res.json({
      revenue: { week: [], month: [], year: [] },
      services: [],
      calendar: [],
      productivity: [],
    });
  }
});

module.exports = router;
