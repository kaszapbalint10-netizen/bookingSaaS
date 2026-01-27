// server/src/routes/dashboard/stats.js
const router = require('express').Router();
const { connectToSalonDatabase, ensureSalonTables } = require('../../../database/database');
const { ensureSalonDb, errorHandler } = require('./middleware');

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

const getDefaultStats = () => ({
  todayBookings: 0,
  weeklyRevenue: 0,
  totalCustomers: 0,
  avgServiceTime: 45,
  isOpenToday: true,
  servicesCount: 0,
});

router.get('/stats', ensureSalonDb, async (req, res) => {
  try {
    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const dbName = req.user.salon_db_name;
    const stats = getDefaultStats();

    if (await tableExists(db, dbName, 'bookings')) {
      const [today] = await db
        .promise()
        .execute(
          `SELECT COUNT(*) AS count FROM bookings WHERE DATE(booking_date) = CURDATE()`
        );
      stats.todayBookings = today[0]?.count || 0;

      if (await columnExists(db, dbName, 'bookings', 'price')) {
        const [revenue] = await db
          .promise()
          .execute(
            `SELECT COALESCE(SUM(price), 0) AS revenue
             FROM bookings
             WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
          );
        stats.weeklyRevenue = Number(revenue[0]?.revenue || 0);
      }
    }

    if (await tableExists(db, dbName, 'users')) {
      const [customers] = await db
        .promise()
        .execute('SELECT COUNT(*) AS count FROM users');
      stats.totalCustomers = customers[0]?.count || 0;
    }

    if (await tableExists(db, dbName, 'services')) {
      const [serviceCount] = await db
        .promise()
        .execute('SELECT COUNT(*) AS count FROM services');
      stats.servicesCount = serviceCount[0]?.count || 0;

      const [avgTime] = await db
        .promise()
        .execute('SELECT AVG(time) AS avgTime FROM services WHERE time IS NOT NULL');
      if (avgTime[0]?.avgTime) {
        stats.avgServiceTime = Math.round(avgTime[0].avgTime);
      }
    }

    if (await tableExists(db, dbName, 'opening_hours')) {
      const [openSlots] = await db
        .promise()
        .execute(
          `SELECT COUNT(*) AS count
           FROM opening_hours
           WHERE date = CURDATE() AND time_slot_type = 'OPEN'`
        );
      stats.isOpenToday = openSlots[0]?.count > 0;
    }

    res.json(stats);
  } catch (error) {
    console.error('Statisztika hiba:', error);
    res.json(getDefaultStats());
  }
});

router.get('/status', ensureSalonDb, async (req, res) => {
  try {
    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const dbName = req.user.salon_db_name;

    const [servicesCount] = (await tableExists(db, dbName, 'services'))
      ? await db.promise().execute('SELECT COUNT(*) AS count FROM services')
      : [[{ count: 0 }]];
    const [bookingsCount] = (await tableExists(db, dbName, 'bookings'))
      ? await db
          .promise()
          .execute(
            'SELECT COUNT(*) AS count FROM bookings WHERE DATE(booking_date) >= CURDATE()'
          )
      : [[{ count: 0 }]];
    const [openingHoursCount] = (await tableExists(db, dbName, 'opening_hours'))
      ? await db.promise().execute('SELECT COUNT(*) AS count FROM opening_hours')
      : [[{ count: 0 }]];

    res.json({
      salonDbName: req.user.salon_db_name,
      services: servicesCount[0]?.count || 0,
      todayBookings: bookingsCount[0]?.count || 0,
      openingHours: openingHoursCount[0]?.count || 0,
      status: 'active',
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    errorHandler(res, error, 'Hiba az állapot lekérésekor');
  }
});

router.post('/refresh', ensureSalonDb, async (req, res) => {
  try {
    await ensureSalonTables(req.user.salon_db_name);
    res.json({
      success: true,
      message: 'Dashboard adatok újratöltve',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorHandler(res, error, 'Hiba az újratöltéskor');
  }
});

module.exports = router;
