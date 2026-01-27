#!/usr/bin/env node

/**
 * Demo seeder: creates test users and 2 months of bookings.
 *
 * Usage examples:
 *   node scripts/seed-demo-bookings.js
 *   node scripts/seed-demo-bookings.js --db=salon_test --users=120 --days=60
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${key}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const salonDb = getArg('db', 'salon_test');
const userCount = Number(getArg('users', 120));
const daysBack = Number(getArg('days', 60));
const defaultPassword = getArg('password', 'TempPass123!');
const stylistPool = [1, 2, 3];

const services = [
  { name: 'Haircut', duration: 45, price: [9000, 15000] },
  { name: 'Coloring', duration: 90, price: [18000, 32000] },
  { name: 'Styling', duration: 60, price: [12000, 20000] },
  { name: 'Manicure', duration: 45, price: [8000, 14000] },
  { name: 'Pedicure', duration: 60, price: [9000, 16000] },
  { name: 'Facial', duration: 50, price: [11000, 19000] },
];

const firstNames = ['Anna', 'Bence', 'Csilla', 'Dora', 'Erik', 'Fanni', 'Gabor', 'Hanna', 'Istvan', 'Judit', 'Kata', 'Levente', 'Maja', 'Noemi', 'Olivier', 'Petra', 'Rita', 'Sara', 'Tamas', 'Viktor'];
const lastNames = ['Kovacs', 'Szabo', 'Nagy', 'Kiss', 'Varga', 'Balogh', 'Toth', 'Papp', 'Horvath', 'Farkas', 'Gulyas', 'Lakatos', 'Molnar', 'Simon', 'Vida'];

const cfg = {
  host: process.env.DB_HOST || '192.168.112.102',
  user: process.env.DB_USER || 'test1',
  password: process.env.DB_PASSWORD || 'test1',
  port: Number(process.env.DB_PORT || 3306),
  timezone: 'Z',
};

const toSqlDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomPhone = () => `+36${randomInt(20, 70)}${randomInt(1000000, 9999999)}`;

const randomBookingDate = (days) => {
  const now = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const ts = randomInt(start.getTime(), now.getTime());
  const slot = new Date(ts);
  slot.setHours(randomInt(8, 18), [0, 15, 30, 45][randomInt(0, 3)], 0, 0);
  return slot;
};

async function ensureTables(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(20),
      password VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      preferred_chatbot ENUM('telegram','whatsapp','email','sms') DEFAULT 'telegram',
      telegram_chat_id VARCHAR(100),
      whatsapp_number VARCHAR(20),
      meta_data LONGTEXT,
      communication_preferences LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_visit TIMESTAMP NULL,
      is_active TINYINT(1) DEFAULT 1,
      phone_encrypted LONGTEXT,
      address_encrypted LONGTEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      stylist_id INT NOT NULL,
      service VARCHAR(255) NOT NULL,
      duration INT NOT NULL,
      booking_date DATETIME NOT NULL,
      status INT DEFAULT 0,
      price DECIMAL(10,2) NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function main() {
  const connection = await mysql.createConnection({ ...cfg, database: salonDb });
  await ensureTables(connection);

  console.log(`Seeding ${userCount} users into ${salonDb}...`);
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const [existing] = await connection.execute('SELECT email, id FROM users');
  const existingEmails = new Map(existing.map((r) => [r.email, r.id]));
  const userIds = [];

  for (let i = 0; i < userCount; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const email = `demo${i + 1}@example.com`;

    if (existingEmails.has(email)) {
      userIds.push(existingEmails.get(email));
      continue;
    }

    const [result] = await connection.execute(
      `INSERT INTO users (email, phone, password, first_name, last_name, preferred_chatbot, is_active)
       VALUES (?, ?, ?, ?, ?, 'telegram', 1)`,
      [email, randomPhone(), passwordHash, first, last]
    );
    userIds.push(result.insertId);
  }

  console.log(`Users ready, creating bookings for the last ${daysBack} days...`);

  let bookingCounter = 0;
  for (const userId of userIds) {
    const bookingsForUser = randomInt(1, 4); // 1-4 bookings per user
    for (let j = 0; j < bookingsForUser; j++) {
      const service = pick(services);
      const price = randomInt(service.price[0], service.price[1]);
      const when = randomBookingDate(daysBack);
      await connection.execute(
        `INSERT INTO bookings
          (customer_id, stylist_id, service, duration, booking_date, price, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          pick(stylistPool),
          service.name,
          service.duration,
          toSqlDateTime(when),
          price,
          'Demo generated booking',
        ]
      );
      bookingCounter += 1;
    }
  }

  console.log(`Done. Created/ensured ${userIds.length} users and ${bookingCounter} bookings.`);
  console.log(`Default password for generated users: ${defaultPassword}`);
  await connection.end();
}

main().catch((err) => {
  console.error('Seeder error:', err);
  process.exit(1);
});
