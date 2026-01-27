const mysql = require('mysql2/promise');
const { getEncryption } = require('./src/security');
const argon2 = require('argon2');
require('dotenv').config();

async function createTestUser() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'salon_browser'
    });

    console.log('📊 Csatlakozva a salon_browser adatbázishoz');

    // Jelszó hash létrehozása
    const plainPassword = 'Test123!@#';
    const hashedPassword = await argon2.hash(plainPassword);
    console.log('🔐 Jelszó hash létrehozva');

    // Encryption
    const encryption = getEncryption();
    const encryptedPhone = encryption.encrypt('+36701234567');
    const encryptedAddress = encryption.encrypt('Budapest, Astoria u. 10.');

    // Felhasználó létrehozása/frissítése
    const email = 'test@salon.com';

    // Előbb ellenőrizzük, hogy létezik-e
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log('👤 Felhasználó már létezik, frissítés...');
      await connection.query(
        `UPDATE users SET 
          password_hash = ?, 
          phone_encrypted = ?, 
          address_encrypted = ? 
        WHERE email = ?`,
        [hashedPassword, encryptedPhone, encryptedAddress, email]
      );
    } else {
      console.log('👤 Új felhasználó létrehozása...');
      await connection.query(
        `INSERT INTO users 
        (email, password_hash, phone_encrypted, address_encrypted, first_name, last_name) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, encryptedPhone, encryptedAddress, 'Test', 'User']
      );
    }

    console.log(`✅ Teszt felhasználó kész!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Jelszó: ${plainPassword}`);
    console.log(`\n🚀 Most próbálhatod meg a bejelentkezést!`);

    await connection.end();
  } catch (error) {
    console.error('❌ Hiba:', error.message);
    process.exit(1);
  }
}

createTestUser();
