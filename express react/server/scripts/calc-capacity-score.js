#!/usr/bin/env node

/**
 * Calculates daily capacity, utilization, revenue ceiling and a 1-100 score.
 *
 * Usage:
 *   node scripts/calc-capacity-score.js --db=salon_test --date=2025-12-11
 * Optional:
 *   --stylists=3   (override active stylist count)
 *   --avgdur=45    (override average service time in minutes)
 *   --avgprice=15000 (override average service price)
 *
 * Score logic:
 *   - capacity_minutes = open_minutes * stylist_count
 *   - avg_duration = services.time avg OR override OR 45
 *   - avg_price = services.price avg OR override OR 15000
 *   - capacity_bookings = capacity_minutes / avg_duration
 *   - revenue_ceiling = capacity_bookings * avg_price
 *   - utilization_time = actual_duration / capacity_minutes
 *   - utilization_rev  = actual_revenue / revenue_ceiling
 *   - score = clamp((0.6 * utilization_time + 0.4 * utilization_rev) * 100, 1..100)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const args = process.argv.slice(2);
const arg = (key) => {
  const found = args.find((a) => a.startsWith(`--${key}=`));
  return found ? found.split('=')[1] : undefined;
};

const salonDb = arg('db') || 'salon_test';
const targetDate = arg('date') || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const stylistsOverride = arg('stylists') ? Number(arg('stylists')) : undefined;
const avgDurationOverride = arg('avgdur') ? Number(arg('avgdur')) : undefined;
const avgPriceOverride = arg('avgprice') ? Number(arg('avgprice')) : undefined;

const cfg = {
  host: process.env.DB_HOST || '192.168.112.102',
  user: process.env.DB_USER || 'test1',
  password: process.env.DB_PASSWORD || 'test1',
  port: Number(process.env.DB_PORT || 3306),
  timezone: 'Z',
};

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

async function fetchOne(conn, sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function main() {
  const salonConn = await mysql.createConnection({ ...cfg, database: salonDb });

  // 1) Opening hours → open minutes
  const openings = await fetchOne(
    salonConn,
    `SELECT start_time, end_time FROM opening_hours WHERE date = ? AND time_slot_type = 'OPEN'`,
    [targetDate]
  );
  const openMinutes = openings.reduce((sum, row) => {
    const start = new Date(`1970-01-01T${row.start_time}Z`);
    const end = new Date(`1970-01-01T${row.end_time}Z`);
    const diff = (end - start) / (1000 * 60);
    return sum + Math.max(0, diff);
  }, 0);

  // 2) Stylist count (management DB) or override
  let stylistCount = stylistsOverride;
  if (!stylistCount) {
    const mgmtName = `${salonDb}_management`;
    const mgmtConn = await mysql.createConnection({ ...cfg, database: mgmtName });
    const staff = await fetchOne(
      mgmtConn,
      `SELECT COUNT(*) AS c FROM staff WHERE is_active = 1`
    );
    stylistCount = staff[0]?.c || 1;
    await mgmtConn.end();
  }

  // 3) Average service duration and price
  let avgDuration = avgDurationOverride;
  let avgPrice = avgPriceOverride;
  if (!avgDuration || !avgPrice) {
    const serviceAgg = await fetchOne(
      salonConn,
      `SELECT AVG(time) AS avg_time, AVG(price) AS avg_price FROM services WHERE time IS NOT NULL`
    );
    avgDuration = avgDuration || Math.round(serviceAgg[0]?.avg_time || 45);
    avgPrice = avgPrice || Number(serviceAgg[0]?.avg_price || 15000);
  }

  // 4) Actual bookings for the day
  const bookings = await fetchOne(
    salonConn,
    `SELECT duration, price FROM bookings WHERE DATE(booking_date) = ?`,
    [targetDate]
  );
  const actualDuration = bookings.reduce((sum, b) => sum + (b.duration || avgDuration), 0);
  const actualRevenue = bookings.reduce(
    (sum, b) => sum + (b.price != null ? Number(b.price) : avgPrice),
    0
  );

  // 5) Capacity and score
  const capacityMinutes = openMinutes * stylistCount;
  const capacityBookings = capacityMinutes > 0 ? capacityMinutes / avgDuration : 0;
  const revenueCeiling = capacityBookings * avgPrice;

  const utilTime = capacityMinutes > 0 ? actualDuration / capacityMinutes : 0;
  const utilRev = revenueCeiling > 0 ? actualRevenue / revenueCeiling : 0;
  const scoreRaw = (0.6 * utilTime + 0.4 * utilRev) * 100;
  const score = clamp(Math.round(scoreRaw), bookings.length ? 1 : 0, 100);

  console.log('=== Capacity Score ===');
  console.log(`Salon DB:          ${salonDb}`);
  console.log(`Date:              ${targetDate}`);
  console.log(`Stylists:          ${stylistCount}`);
  console.log(`Open minutes:      ${openMinutes}`);
  console.log(`Capacity minutes:  ${capacityMinutes}`);
  console.log(`Avg duration (m):  ${avgDuration}`);
  console.log(`Avg price (HUF):   ${avgPrice}`);
  console.log(`Capacity bookings: ${capacityBookings.toFixed(2)}`);
  console.log(`Revenue ceiling:   ${Math.round(revenueCeiling)} HUF`);
  console.log(`Actual bookings:   ${bookings.length}`);
  console.log(`Actual duration:   ${actualDuration} minutes`);
  console.log(`Actual revenue:    ${Math.round(actualRevenue)} HUF`);
  console.log(`Utilization time:  ${(utilTime * 100).toFixed(1)} %`);
  console.log(`Utilization rev:   ${(utilRev * 100).toFixed(1)} %`);
  console.log(`Score (1-100):     ${score}`);

  await salonConn.end();
}

main().catch((err) => {
  console.error('Calculation error:', err);
  process.exit(1);
});
