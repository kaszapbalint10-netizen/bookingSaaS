#!/usr/bin/env node

/**
 * Database Setup Script
 * Futtatás: npm run setup:db
 */

const mysql = require('mysql2');
require('dotenv').config();

const SQL_SCRIPTS = {
  refresh_tokens: `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token LONGTEXT NOT NULL,
      token_id VARCHAR(36) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      is_revoked BOOLEAN DEFAULT FALSE,
      revoked_at TIMESTAMP NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at),
      INDEX idx_token_id (token_id)
    )
  `,

  staff_encryption: `
    ALTER TABLE staff 
    ADD COLUMN IF NOT EXISTS phone_encrypted LONGTEXT,
    ADD COLUMN IF NOT EXISTS address_encrypted LONGTEXT,
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
  `,

  users_encryption: `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS phone_encrypted LONGTEXT,
    ADD COLUMN IF NOT EXISTS address_encrypted LONGTEXT
  `,

  users_table: `
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone_encrypted LONGTEXT,
      address_encrypted LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,

  refresh_tokens_users_fk: `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token LONGTEXT NOT NULL,
      token_id VARCHAR(36) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      is_revoked BOOLEAN DEFAULT FALSE,
      revoked_at TIMESTAMP NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at),
      INDEX idx_token_id (token_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `
};

/**
 * Setup all databases
 */
async function setupAllDatabases() {
  try {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || '192.168.112.102',
      user: process.env.DB_USER || 'test1',
      password: process.env.DB_PASSWORD || 'test1',
      database: 'mysql',
      port: process.env.DB_PORT || 3306
    });

    // Connect
    connection.connect((err) => {
      if (err) {
        console.error('❌ MySQL connection error:', err.message);
        process.exit(1);
      }
      console.log('✅ MySQL connected');
    });

    const db = connection.promise();

    // Get all salon databases
    console.log('\n🔍 Salon adatbázisok keresése...');
    const [databases] = await db.execute(`
      SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME LIKE 'salon_%' AND SCHEMA_NAME NOT LIKE '%_management'
    `);

    if (databases.length === 0) {
      console.log('⚠️ Nincs salon adatbázis találva');
      connection.end();
      return;
    }

    console.log(`📁 Talált ${databases.length} salon adatbázis\n`);

    // Setup each database
    for (const db_info of databases) {
      const dbName = db_info.SCHEMA_NAME;

      if (!dbName || dbName === 'undefined') continue;

      console.log(`\n🔄 Feldolgozás: ${dbName}`);

      try {
        // Create a new connection for each database (to avoid USE issues)
        const dbConnection = mysql.createConnection({
          host: process.env.DB_HOST || '192.168.112.102',
          user: process.env.DB_USER || 'test1',
          password: process.env.DB_PASSWORD || 'test1',
          database: dbName,
          port: process.env.DB_PORT || 3306
        });

        const dbPromise = dbConnection.promise();

        // Check which tables exist
        const [tables] = await dbPromise.execute(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
          [dbName]
        );
        
        const tableNames = tables.map(t => t.TABLE_NAME);
        const hasStaff = tableNames.includes('staff');
        const hasUsers = tableNames.includes('users');

        console.log(`  📊 Táblák: ${tableNames.join(', ')}`);

        // Create users table if doesn't exist
        if (!hasUsers && !hasStaff) {
          try {
            await dbPromise.execute(SQL_SCRIPTS.users_table);
            console.log(`  ✅ Users tábla létrehozva`);
          } catch (err) {
            console.log(`  ℹ️ Users tábla: ${err.message}`);
          }
        }

        // Create refresh_tokens table (with FK handling)
        try {
          if (hasUsers) {
            // If users table exists, use FK
            await dbPromise.execute(SQL_SCRIPTS.refresh_tokens_users_fk);
          } else {
            // Otherwise create without FK
            await dbPromise.execute(SQL_SCRIPTS.refresh_tokens);
          }
          console.log(`  ✅ Refresh tokens tábla kész`);
        } catch (err) {
          console.log(`  ℹ️ Refresh tokens: ${err.message}`);
        }

        // Add encrypted fields to staff (if exists)
        if (hasStaff) {
          try {
            await dbPromise.execute(SQL_SCRIPTS.staff_encryption);
            console.log(`  ✅ Staff titkosított mezők kész`);
          } catch (err) {
            console.log(`  ℹ️ Staff mezők: ${err.message}`);
          }
        }

        // Add encrypted fields to users (if exists)
        if (hasUsers) {
          try {
            await dbPromise.execute(SQL_SCRIPTS.users_encryption);
            console.log(`  ✅ Users titkosított mezők kész`);
          } catch (err) {
            console.log(`  ℹ️ Users mezők: ${err.message}`);
          }
        }

        dbConnection.end();

      } catch (error) {
        console.error(`  ❌ Hiba: ${error.message}`);
      }
    }

    console.log('\n✅ Adatbázis setup kész!\n');
    connection.end();

  } catch (error) {
    console.error('❌ Setup hiba:', error.message);
    process.exit(1);
  }
}

// Run setup
setupAllDatabases().catch(error => {
  console.error('❌ Kritikus hiba:', error);
  process.exit(1);
});
