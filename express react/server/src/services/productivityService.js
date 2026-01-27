// services/productivityService.js
const {
  connectToSalonDatabase,
  connectToDatabase,
} = require('../../database/database');

const toDateKey = (date) => date.toISOString().split('T')[0];

async function tableExists(db, databaseName, table) {
  const [rows] = await db
    .promise()
    .execute(
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
}

async function columnExists(db, databaseName, table, column) {
  const [rows] = await db
    .promise()
    .execute(
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
}

/**
 * Compute daily productivity/completion for a salon DB.
 * Returns array of { date, revenue, appointments, completion } for the last N days.
 */
async function computeProductivity({
  salonDbName,
  daysBack = 90,
  avgServiceMinutes = 45,
  fallbackAvgPrice = 15000,
}) {
  const db = await connectToSalonDatabase(salonDbName);
  const hasBookings = await tableExists(db, salonDbName, 'bookings');
  if (!hasBookings) return [];

  const hasOpeningHours = await tableExists(db, salonDbName, 'opening_hours');
  const hasPriceColumn = await columnExists(db, salonDbName, 'bookings', 'price');
  const revenueExpr = hasPriceColumn ? 'COALESCE(SUM(price), 0)' : '0';

  const [calendarRows] = await db.promise().execute(
    `
      SELECT DATE(b.booking_date) AS day,
             COUNT(*) AS appointments,
             ${revenueExpr} AS revenue,
             SUM(COALESCE(b.duration, 0)) AS duration_sum
      FROM bookings b
      WHERE b.booking_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY day
      ORDER BY day
    `,
    [daysBack]
  );

  // stylist count from management DB
  let stylists = 1;
  try {
    const mgmtDb = await connectToDatabase(`${salonDbName}_management`);
    const [staffRows] = await mgmtDb.promise().execute(
      `SELECT COUNT(*) AS c FROM staff WHERE is_active = 1`
    );
    stylists = Math.max(1, Number(staffRows?.[0]?.c || 1));
  } catch (e) {
    stylists = 1;
  }

  // opening hours per day
  let openMinutesFn = () => 9 * 60; // fallback: 9 hours
  if (hasOpeningHours) {
    try {
      const [ohRows] = await db.promise().execute(
        `SELECT TIMESTAMPDIFF(MINUTE, start_time, end_time) AS mins, date
         FROM opening_hours
         WHERE time_slot_type = 'OPEN'
           AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [daysBack]
      );
      const ohMap = new Map();
      ohRows.forEach((r) => {
        const key = toDateKey(new Date(r.date));
        ohMap.set(key, (ohMap.get(key) || 0) + Number(r.mins || 0));
      });
      openMinutesFn = (date) => ohMap.get(date) || 9 * 60;
    } catch (e) {
      openMinutesFn = () => 9 * 60;
    }
  }

  return calendarRows.map((row) => {
    const dateKey = toDateKey(new Date(row.day));
    const apps = Number(row.appointments || 0);
    const rev = Number(row.revenue || 0);
    const durationSum = Number(row.duration_sum || 0);
    const effectiveDuration = durationSum > 0 ? durationSum : apps * avgServiceMinutes;
    const openMins = openMinutesFn(dateKey);
    const capacityMins = openMins * stylists;
    const capacityBookings = capacityMins > 0 ? capacityMins / avgServiceMinutes : 0;
    const avgPrice = apps > 0 ? rev / apps : fallbackAvgPrice;
    const revenueCeiling = capacityBookings * avgPrice;
    const utilTime = capacityMins > 0 ? effectiveDuration / capacityMins : 0;
    const utilRev = revenueCeiling > 0 ? rev / revenueCeiling : 0;
    const completion = Math.max(0, Math.min(1, 0.6 * utilTime + 0.4 * utilRev)) * 100;

    return {
      date: row.day,
      revenue: rev,
      appointments: apps,
      durationMinutes: effectiveDuration,
      capacityMinutes: capacityMins,
      revenueCeiling,
      completion,
    };
  });
}

module.exports = {
  computeProductivity,
};
