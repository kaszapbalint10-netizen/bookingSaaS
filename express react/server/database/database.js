// database.js - TELJESEN JAVITOTT VERZIO A HIANYZO TABLAKKAL

const mysql = require('mysql2');

// Simple colored log helpers (ANSI)
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;



// Globalis connection pool-ok

const connections = new Map();



// Fo kapcsolat letrehozasa

async function createMainConnection() {

  try {

    const pool = mysql.createPool({

      host: process.env.DB_HOST || '192.168.112.102',

      port: Number(process.env.DB_PORT || 3306),

      user: process.env.DB_USER || 'test1',

      password: process.env.DB_PASSWORD || 'test1',

      database: 'mysql',

      waitForConnections: true,

      connectionLimit: 3,

      queueLimit: 0,

      timezone: 'Z'

    });



    console.log(green('Main MySQL connection OK'));

    return pool;

  } catch (error) {

    console.error(red('Main MySQL connection error:'), error.message);

    throw error;

  }

}



// Kozponti adatbazis inicializalasa

async function initializeCentralDatabase() {

  try {

    const mainConn = await createMainConnection();

    

    // Kozponti adatbazis letrehozasa - JAVITOTT NEV

    await mainConn.promise().execute(`CREATE DATABASE IF NOT EXISTS central_salon_management`);

    console.log(green('Central DB created/verified: central_salon_management'));

    

    // Kapcsolodas a kozponti adatbazishoz

    const centralDb = await connectToDatabase('central_salon_management');

    

    // Staff directory tabla letrehozasa

    await centralDb.promise().execute(`

      CREATE TABLE IF NOT EXISTS staff_directory (

        id INT AUTO_INCREMENT PRIMARY KEY,

        email VARCHAR(255) UNIQUE NOT NULL,

        first_name VARCHAR(100) NOT NULL,

        last_name VARCHAR(100) NOT NULL,

        salon_db_name VARCHAR(100) NOT NULL,

        management_db_name VARCHAR(100) NOT NULL,

        role ENUM('owner', 'admin', 'stylist', 'reception', 'unknown') DEFAULT 'unknown',

        is_active BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        last_login TIMESTAMP NULL,

        INDEX idx_email (email),

        INDEX idx_salon_db (salon_db_name)

      )

    `);

    

    console.log(green('Central staff_directory initialized'));

    return centralDb;

  } catch (error) {

    console.error(red('Central DB init error:'), error.message);

    throw error;

  }

}



// Hianyzo tablak inicializalasa salon adatbazisokhoz

// Szalon adatbázis táblák létrehozása a megadott sémával
async function initializeSalonTables(salonDbName) {
  try {
    const salonDb = await connectToDatabase(salonDbName);
    console.log(`Initializing tables: ${salonDbName}`);

    // bookings
    await salonDb.promise().execute(`
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

    // notification_settings
    await salonDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        new_booking_notify TINYINT(1) DEFAULT 1,
        booking_update_notify TINYINT(1) DEFAULT 1,
        booking_cancel_notify TINYINT(1) DEFAULT 1,
        reminder_24h TINYINT(1) DEFAULT 1,
        reminder_2h TINYINT(1) DEFAULT 1,
        newsletter_subscribed TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // opening_hours
    await salonDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS opening_hours (
        date DATE NOT NULL,
        time_slot_type ENUM('OPEN','BREAK') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
                location VARCHAR(100) DEFAULT "Főszalon"
      )
    `);

    // refresh_tokens
    await salonDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token LONGTEXT NOT NULL,
        token_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
        is_revoked TINYINT(1) DEFAULT 0,
        revoked_at TIMESTAMP NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_token_id (token_id),
        INDEX idx_expires_at (expires_at)
      )
    `);

    // salon_info
    await salonDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS salon_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        salon_name VARCHAR(255),
        address_street VARCHAR(255),
        address_city VARCHAR(255),
        address_zip VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(500),
        hero_image_url VARCHAR(500),
        favicon_url VARCHAR(500),
        background_color VARCHAR(7) DEFAULT '#0b0b0f',
        gradient_start_color VARCHAR(7) DEFAULT '#05090c',
        gradient_end_color VARCHAR(7) DEFAULT '#101b26',
        primary_color VARCHAR(7) DEFAULT '#5ac8fa',
        secondary_color VARCHAR(7) DEFAULT '#007aff',
        font_family VARCHAR(100) DEFAULT 'Arial',
        glass_effect_enabled TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // services
    await salonDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS services (
        service VARCHAR(255) NOT NULL,
        time INT NOT NULL,
        price DECIMAL(10,2) NOT NULL
      )
    `);

    // users
    await salonDb.promise().execute(`
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

    console.log(green(`Tables created for ${salonDbName}`));
  } catch (error) {
    console.error(red(`Table initialization error (${salonDbName}):`), error.message);
  }
}




// Management tablak inicializalasa

async function initializeManagementTables(managementDbName) {
  try {
    const managementDb = await connectToDatabase(managementDbName);

    // resource
    await managementDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS resource (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        custom_id VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        description TEXT NULL,
        INDEX idx_custom_id (custom_id)
      )
    `);

    // staff
    await managementDb.promise().execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('owner','admin','stylist','reception') DEFAULT 'owner',
        email_verified TINYINT(1) DEFAULT 0,
        verification_token VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active TINYINT(1) DEFAULT 1,
        profile_image VARCHAR(500),
        phone VARCHAR(20),
        reset_token VARCHAR(255),
        reset_expires DATETIME NULL,
        reset_used TINYINT(1) DEFAULT 0,
        INDEX idx_email (email)
      )
    `);

    console.log(`Management tables initialized: ${managementDbName}`);
  } catch (error) {
    console.error(`Management tables init error (${managementDbName}):`, error.message);
    throw error;
  }
}



// Alap nyitvatartasi idok beszurasa (jelenleg ures, az uj sema szerint nem szurunk day_of_week-et)
async function initializeDefaultOpeningHours(_db) {
  try {
    console.log("Baseline opening hours skipped (no day_of_week schema).");
  } catch (error) {
    console.error("Opening hours init error:", error.message);
  }
}

function sanitizeDbName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}
// Uj adatbazis letrehozasa - BOVITVE HIANYZO TABLAKKAL

async function createDatabase(dbName) {

  try {

    const mainConn = await createMainConnection();

    const cleanDbName = sanitizeDbName(dbName);

    

    console.log(`Creating database: ${cleanDbName}`);

    

    // Fo adatbazis letrehozasa

    await mainConn.promise().execute(`CREATE DATABASE IF NOT EXISTS \`${cleanDbName}\``);

    

    // Management adatbazis letrehozasa

    const managementDbName = `${cleanDbName}_management`;

    await mainConn.promise().execute(`CREATE DATABASE IF NOT EXISTS \`${managementDbName}\``);

    

    // Hianyzo tablak inicializalasa

    await initializeSalonTables(cleanDbName);

    await initializeManagementTables(managementDbName);

    

    console.log(`Databases created: ${cleanDbName}, ${managementDbName}`);

    

    return {

      salonDb: cleanDbName,

      managementDb: managementDbName

    };

  } catch (error) {

    console.error(`Database creation error:`, error.message);

    throw error;

  }

}



// Staff hozzaadasa a kozponti nyilvantartashoz

async function addStaffToCentralDirectory(staffData) {

  try {

    const centralDb = await connectToDatabase('central_salon_management');

    const id = staffData.id || null;

    await centralDb.promise().execute(

      `INSERT INTO staff_directory (id, email, first_name, last_name, salon_db_name, management_db_name, role)

       VALUES (?, ?, ?, ?, ?, ?, ?)

       ON DUPLICATE KEY UPDATE

         id = VALUES(id),

         first_name = VALUES(first_name),

         last_name = VALUES(last_name),

         salon_db_name = VALUES(salon_db_name),

         management_db_name = VALUES(management_db_name),

         role = VALUES(role),

         is_active = TRUE`,

      [

        id,

        staffData.email,

        staffData.first_name,

        staffData.last_name,

        staffData.salon_db_name,

        staffData.management_db_name,

        staffData.role || 'unknown'

      ]

    );

    console.log(green(`Staff added to central directory: ${staffData.email} (id: ${id ?? 'auto'})`));

  } catch (error) {

    console.error(red('Staff add error:'), error.message);

    throw error;

  }

}



// User keresese a kozponti adatbazisban

async function findUserInCentralDirectory(email) {

  try {

    const centralDb = await connectToDatabase('central_salon_management');

    

    const [users] = await centralDb.promise().execute(

      `SELECT * FROM staff_directory WHERE email = ? AND is_active = TRUE`,

      [email]

    );

    

    if (users.length > 0) {

      console.log(`User found in central DB: ${email}`);

      return users[0];

    } else {

      console.log(`User not found in central DB: ${email}`);

      return null;

    }

  } catch (error) {

    console.error(red('Central DB lookup error:'), error.message);

    throw error;

  }

}



// Kapcsolat specifikus adatbazishoz

async function connectToDatabase(dbName) {

  if (connections.has(dbName)) {

    return connections.get(dbName);

  }



  try {

    console.log(`Connecting to ${dbName}`);

    

    const pool = mysql.createPool({

      host: process.env.DB_HOST || '192.168.112.102',

      port: Number(process.env.DB_PORT || 3306),

      user: process.env.DB_USER || 'test1',

      password: process.env.DB_PASSWORD || 'test1',

      database: dbName,

      waitForConnections: true,

      connectionLimit: 2,

      queueLimit: 0,

      timezone: 'Z'

    });



    // Teszt kapcsolat

    const connection = await pool.promise().getConnection();

    connection.release();

    

    connections.set(dbName, pool);

    console.log(green(`Connection OK: ${dbName}`));

    

    return pool;

  } catch (error) {

    console.error(red(`Connection error (${dbName}):`), error.message);

    throw error;

  }

}



// Salon adatbazis kapcsolat - UJ FUNKCIO

async function connectToSalonDatabase(salonDbName) {

  return await connectToDatabase(salonDbName);

}



// Tablak ellenorzese es letrehozasa salon adatbazisban - UJ FUNKCIO

async function ensureSalonTables(salonDbName) {
  try {
    const db = await connectToSalonDatabase(salonDbName);

    console.log(`Checking tables: ${salonDbName}`);

    // USERS tábla
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        specialty VARCHAR(100),
        role ENUM('owner', 'admin', 'stylist', 'reception') DEFAULT 'stylist',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);

    // SERVICES tábla
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service VARCHAR(100) NOT NULL,
        time INT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        duration INT,
        category VARCHAR(50) DEFAULT 'Altalanos',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // OPENING_HOURS tábla – új séma (nincs day_of_week)
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS opening_hours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        time_slot_type ENUM('OPEN','BREAK') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(100) DEFAULT 'Főszalon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BOOKINGS tábla
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        employee_id INT,
        service_id INT,
        booking_date DATETIME NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        price DECIMAL(10,2),
        duration INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (booking_date),
        INDEX idx_status (status)
      )
    `);
    try { await db.promise().execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stylist_id INT NULL`); } catch (_) {}
    try { await db.promise().execute(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service VARCHAR(255) NULL`); } catch (_) {}

    console.log(`Tables verified: ${salonDbName}`);
    return db;
  } catch (error) {
    console.error(`Tables verification error (${salonDbName}):`, error.message);
    throw error;
  }
}

// Meglevo adatbazis hianyzo tablainak frissitese

async function updateExistingDatabases() {

  try {

    const mainConn = await createMainConnection();

    

    // Osszes adatbazis lekerese

    const [databases] = await mainConn.promise().execute('SHOW DATABASES');

    

    for (const db of databases) {

      const dbName = db.Database;

      

      // Csak salon adatbazisok frissitese

      if (dbName.startsWith('salon_') && !dbName.includes('management')) {

        console.log(`Updating: ${dbName}`);

        await initializeSalonTables(dbName);

        

        // Management adatbazis is frissitese

        const managementDbName = `${dbName}_management`;

        if (databases.some(d => d.Database === managementDbName)) {

          await initializeManagementTables(managementDbName);

        }

      }

    }

    

    console.log('All existing databases updated');

  } catch (error) {

    console.error('Database update error:', error.message);

  }

}



// Adatbazis torlese - UJ FUNKCIO

async function deleteDatabase(dbName) {

  try {

    const mainConn = await createMainConnection();

    const cleanDbName = sanitizeDbName(dbName);

    const managementDbName = `${cleanDbName}_management`;

    

    console.log(`Deleting database: ${cleanDbName}`);

    

    await mainConn.promise().execute(`DROP DATABASE IF EXISTS \`${cleanDbName}\``);

    await mainConn.promise().execute(`DROP DATABASE IF EXISTS \`${managementDbName}\``);

    

    // Kapcsolatok eltavolitasa a pool-bol

    if (connections.has(cleanDbName)) {

      connections.delete(cleanDbName);

    }

    if (connections.has(managementDbName)) {

      connections.delete(managementDbName);

    }

    

    console.log(`Databases deleted: ${cleanDbName}, ${managementDbName}`);

    return true;

  } catch (error) {

    console.error(`Database delete error:`, error.message);

    throw error;

  }

}



// Kapcsolatok lezarasa - UJ FUNKCIO

async function closeAllConnections() {

  try {

    for (const [dbName, pool] of connections) {

      await pool.end();

      console.log(`Connection closed: ${dbName}`);

    }

    connections.clear();

    console.log('All connections closed');

  } catch (error) {

    console.error('Connection close error:', error.message);

  }

}



// database.js - TOKENES FUNKCIOK



// Stylist meghivasanak rogzitese tokennel

async function inviteStylistToCentral(invitationData) {

  try {

    const centralDb = await connectToDatabase('central_salon_management');

    

    // ?? TOKEN GENERALAS

    const crypto = require('crypto');

    const invitationToken = crypto.randomBytes(32).toString('hex');

    

    // ?? LEJARATI DATUM (7 nap)

    const expirationDate = new Date();

    expirationDate.setDate(expirationDate.getDate() + 7);



    await centralDb.promise().execute(

      `INSERT INTO invited_stylists (

        email, invited_by_salon, salon_db_name, management_db_name, 

        invited_role, invitation_token, invitation_expires_at

      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [

        invitationData.email,

        invitationData.invited_by_salon,

        invitationData.salon_db_name,

        invitationData.management_db_name,

        invitationData.invited_role || 'stylist',

        invitationToken,

        expirationDate

      ]

    );

    

    console.log(`Stylist invitation saved with token: ${invitationToken.substring(0, 16)}...`);

    return invitationToken;

    

  } catch (error) {

    console.error('? Stylist invitation error:', error.message);

    throw error;

  }

}



// Meghivo ellenorzese token alapjan

async function verifyStylistInvitation(token) {

  try {

    const centralDb = await connectToDatabase('central_salon_management');

    

    const [invitations] = await centralDb.promise().execute(

      `SELECT * FROM invited_stylists 

       WHERE invitation_token = ? 

       AND is_accepted = FALSE 

       AND invitation_expires_at > NOW()`,

      [token]

    );



    return invitations.length > 0 ? invitations[0] : null;

  } catch (error) {

    console.error('Invitation verification error:', error.message);

    return null;

  }

}



// Meghivo elfogadasanak jelolese

async function acceptStylistInvitation(token) {

  try {

    const centralDb = await connectToDatabase('central_salon_management');

    

    await centralDb.promise().execute(

      `UPDATE invited_stylists 

       SET is_accepted = TRUE, accepted_at = NOW() 

       WHERE invitation_token = ?`,

      [token]

    );

    

    console.log(`Invitation accepted for token: ${token.substring(0, 16)}...`);

    return true;

  } catch (error) {

    console.error('Invitation acceptance error:', error.message);

    throw error;

  }

}



module.exports = {

  createMainConnection,

  createDatabase,

  deleteDatabase,

  connectToDatabase,

  connectToSalonDatabase,

  sanitizeDbName,

  initializeCentralDatabase,

  addStaffToCentralDirectory,

  findUserInCentralDirectory,

  initializeSalonTables,

  initializeManagementTables,

  ensureSalonTables,

  updateExistingDatabases,

  closeAllConnections,

  inviteStylistToCentral,

  verifyStylistInvitation,

  acceptStylistInvitation

};













