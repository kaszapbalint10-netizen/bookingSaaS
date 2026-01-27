// server/src/routes/dashboard/settingsRoutes.js
const router = require('express').Router();
const { connectToSalonDatabase } = require('../../../database/database');
const { ensureSalonDb } = require('./middleware');
const { hashPassword, verifyPassword, generateVerificationToken, isValidEmail, isValidPhone } = require('../../services/authUtils');
const { sendVerificationEmail } = require('../../services/emailService');

const ensureStaffColumns = async (db) => {
  const [profileColumns] = await db.promise().query("SHOW COLUMNS FROM staff LIKE 'profile_image'");
  if (!profileColumns.length) {
    await db.promise().execute(
      "ALTER TABLE staff ADD COLUMN profile_image VARCHAR(500) NULL DEFAULT NULL"
    );
  }

  const [phoneColumns] = await db.promise().query("SHOW COLUMNS FROM staff LIKE 'phone'");
  if (!phoneColumns.length) {
    await db.promise().execute(
      "ALTER TABLE staff ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL"
    );
  }

  const [updatedColumns] = await db.promise().query("SHOW COLUMNS FROM staff LIKE 'updated_at'");
  if (!updatedColumns.length) {
    await db.promise().execute(
      "ALTER TABLE staff ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );
  }
};

const ensureSalonInfoTable = async (db) => {
  await db.promise().execute(`
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

  const [idColumns] = await db.promise().query("SHOW COLUMNS FROM salon_info LIKE 'id'");
  if (!idColumns.length) {
    await db.promise().execute(
      "ALTER TABLE salon_info ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST"
    );
  }

  const columnDefinitions = [
    { name: 'background_color', ddl: "ALTER TABLE salon_info ADD COLUMN background_color VARCHAR(7) DEFAULT '#0b0b0f' AFTER favicon_url" },
    { name: 'gradient_start_color', ddl: "ALTER TABLE salon_info ADD COLUMN gradient_start_color VARCHAR(7) DEFAULT '#05090c' AFTER background_color" },
    { name: 'gradient_end_color', ddl: "ALTER TABLE salon_info ADD COLUMN gradient_end_color VARCHAR(7) DEFAULT '#101b26' AFTER gradient_start_color" },
    { name: 'glass_effect_enabled', ddl: "ALTER TABLE salon_info ADD COLUMN glass_effect_enabled TINYINT(1) DEFAULT 1 AFTER font_family" }
  ];

  for (const column of columnDefinitions) {
    const [exists] = await db.promise().query(`SHOW COLUMNS FROM salon_info LIKE '${column.name}'`);
    if (!exists.length) {
      await db.promise().execute(column.ddl);
    }
  }
};

const ensureNotificationSettingsTable = async (db) => {
  await db.promise().execute(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      new_booking_notify BOOLEAN DEFAULT true,
      booking_update_notify BOOLEAN DEFAULT true,
      booking_cancel_notify BOOLEAN DEFAULT true,
      reminder_24h BOOLEAN DEFAULT true,
      reminder_2h BOOLEAN DEFAULT true,
      newsletter_subscribed BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [idColumns] = await db.promise().query("SHOW COLUMNS FROM notification_settings LIKE 'id'");
  if (!idColumns.length) {
    await db.promise().execute(
      "ALTER TABLE notification_settings ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST"
    );
  }
};

// Profil adatok módosítása
router.patch('/profile', ensureSalonDb, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const db = await connectToSalonDatabase(req.user.salon_db_name + '_management');
    await ensureStaffColumns(db);

    // Validációk
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Érvénytelen telefonszám formátum' });
    }

    const updateFields = [];
    const updateValues = [];

    if (first_name) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nincs módosítandó adat' });
    }

    updateValues.push(req.user.id);

    await db.promise().execute(
      `UPDATE staff SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Központi adatbázis frissítése
    const centralDb = await connectToSalonDatabase('central_salon_management');
    await centralDb.promise().execute(
      `UPDATE staff_directory SET first_name = ?, last_name = ? WHERE email = ? AND salon_db_name = ?`,
      [first_name || req.user.first_name, last_name || req.user.last_name, req.user.email, req.user.salon_db_name]
    );

    res.json({ success: true, message: 'Profil adatok sikeresen frissítve' });
  } catch (error) {
    console.error('Profil frissítési hiba:', error);
    res.status(500).json({ error: 'Szerver hiba a profil frissítésekor' });
  }
});

// Email cím módosítása
router.patch('/email', ensureSalonDb, async (req, res) => {
  try {
    const { new_email } = req.body;
    
    if (!new_email || !isValidEmail(new_email)) {
      return res.status(400).json({ error: 'Érvénytelen email cím' });
    }

    const db = await connectToSalonDatabase(req.user.salon_db_name + '_management');
    const centralDb = await connectToSalonDatabase('central_salon_management');

    // Ellenőrizzük, hogy létezik-e már ez az email
    const [existing] = await db.promise().execute(
      'SELECT id FROM staff WHERE email = ? AND id != ?',
      [new_email, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ez az email cím már használatban van' });
    }

    // Verification token generálása
    const verificationToken = generateVerificationToken();

    // Email küldése
    await sendVerificationEmail(new_email, verificationToken, req.user.salon_db_name.replace('salon_', ''), req.user.first_name);

    // Ideiglenes tárolás a central adatbázisban
    await centralDb.promise().execute(
      `INSERT INTO email_changes (user_id, old_email, new_email, verification_token, salon_db_name) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE new_email = ?, verification_token = ?, created_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.user.email, new_email, verificationToken, req.user.salon_db_name, new_email, verificationToken]
    );

    res.json({ success: true, message: 'Verifikációs email elküldve az új címre' });
  } catch (error) {
    console.error('Email módosítási hiba:', error);
    res.status(500).json({ error: 'Szerver hiba az email módosításakor' });
  }
});

// Jelszó módosítása
router.patch('/password', ensureSalonDb, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Mindkét jelszó megadása kötelező' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie' });
    }

    const db = await connectToSalonDatabase(req.user.salon_db_name + '_management');

    // Jelenlegi jelszó ellenőrzése
    const [users] = await db.promise().execute(
      'SELECT password FROM staff WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }

    const isCurrentPasswordValid = await verifyPassword(current_password, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'A jelenlegi jelszó nem megfelelő' });
    }

    // Új jelszó hash-elése és mentése
    const hashedNewPassword = await hashPassword(new_password);
    await db.promise().execute(
      'UPDATE staff SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({ success: true, message: 'Jelszó sikeresen megváltoztatva' });
  } catch (error) {
    console.error('Jelszó módosítási hiba:', error);
    res.status(500).json({ error: 'Szerver hiba a jelszó módosításakor' });
  }
});

// Profilkép feltöltése
router.post('/profile-image', ensureSalonDb, async (req, res) => {
  try {
    // Itt kell implementálni a file upload logikát
    // Cloudinary vagy local storage
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Kép URL megadása kötelező' });
    }

    const db = await connectToSalonDatabase(req.user.salon_db_name + '_management');
    await ensureStaffColumns(db);
    await db.promise().execute(
      'UPDATE staff SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [image_url, req.user.id]
    );

    res.json({ success: true, message: 'Profilkép sikeresen frissítve', image_url });
  } catch (error) {
    console.error('Profilkép feltöltési hiba:', error);
    res.status(500).json({ error: 'Szerver hiba a profilkép feltöltésekor' });
  }
});

// Szalon információk mentése
router.patch('/salon-info', ensureSalonDb, async (req, res) => {
  try {
    const { 
      salon_name, 
      address_street, 
      address_city, 
      address_zip, 
      phone, 
      email, 
      website, 
      description 
    } = req.body;

    const db = await connectToSalonDatabase(req.user.salon_db_name);
    await ensureSalonInfoTable(db);

    // Létező rekord ellenőrzése
    const [existing] = await db.promise().execute('SELECT id FROM salon_info LIMIT 1');

    if (existing.length > 0) {
      // Update
      await db.promise().execute(
        `UPDATE salon_info SET 
         salon_name = ?, address_street = ?, address_city = ?, address_zip = ?, 
         phone = ?, email = ?, website = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [salon_name, address_street, address_city, address_zip, phone, email, website, description, existing[0].id]
      );
    } else {
      // Insert
      await db.promise().execute(
        `INSERT INTO salon_info 
         (salon_name, address_street, address_city, address_zip, phone, email, website, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [salon_name, address_street, address_city, address_zip, phone, email, website, description]
      );
    }

    res.json({ success: true, message: 'Szalon információk sikeresen mentve' });
  } catch (error) {
    console.error('Szalon info mentési hiba:', error);
    res.status(500).json({ error: 'Szerver hiba a szalon információk mentésekor' });
  }
});

// Értesítési beállítások
router.patch('/notifications', ensureSalonDb, async (req, res) => {
  try {
    const {
      new_booking_notify,
      booking_update_notify,
      booking_cancel_notify,
      reminder_24h,
      reminder_2h,
      newsletter_subscribed
    } = req.body;

    const db = await connectToSalonDatabase(req.user.salon_db_name);
    await ensureNotificationSettingsTable(db);

    const [existing] = await db.promise().execute('SELECT id FROM notification_settings LIMIT 1');

    if (existing.length > 0) {
      await db.promise().execute(
        `UPDATE notification_settings SET 
         new_booking_notify = ?, booking_update_notify = ?, booking_cancel_notify = ?,
         reminder_24h = ?, reminder_2h = ?, newsletter_subscribed = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [new_booking_notify, booking_update_notify, booking_cancel_notify, reminder_24h, reminder_2h, newsletter_subscribed, existing[0].id]
      );
    } else {
      await db.promise().execute(
        `INSERT INTO notification_settings 
         (new_booking_notify, booking_update_notify, booking_cancel_notify, reminder_24h, reminder_2h, newsletter_subscribed) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [new_booking_notify, booking_update_notify, booking_cancel_notify, reminder_24h, reminder_2h, newsletter_subscribed]
      );
    }

    res.json({ success: true, message: 'Értesítési beállítások sikeresen mentve' });
  } catch (error) {
    console.error('Értesítési beállítások mentési hiba:', error);
    res.status(500).json({ error: 'Szerver hiba az értesítési beállítások mentésekor' });
  }
});

// Design beállítások
router.patch('/design', ensureSalonDb, async (req, res) => {
  try {
    const {
      primary_color,
      secondary_color,
      background_color,
      gradient_start_color,
      gradient_end_color,
      font_family,
      logo_url,
      hero_image_url,
      favicon_url,
      glass_effect_enabled
    } = req.body;

    const db = await connectToSalonDatabase(req.user.salon_db_name);
    await ensureSalonInfoTable(db);

    const [existing] = await db.promise().execute('SELECT id FROM salon_info LIMIT 1');

    const updateFields = [];
    const insertColumns = [];
    const updateValues = [];

    const pushField = (fieldName, value) => {
      if (value === undefined || value === null) return;
      updateFields.push(`${fieldName} = ?`);
      insertColumns.push(fieldName);
      updateValues.push(value);
    };

    pushField('primary_color', primary_color);
    pushField('secondary_color', secondary_color);
    pushField('background_color', background_color);
    pushField('gradient_start_color', gradient_start_color);
    pushField('gradient_end_color', gradient_end_color);
    pushField('font_family', font_family);
    pushField('logo_url', logo_url);
    pushField('hero_image_url', hero_image_url);
    pushField('favicon_url', favicon_url);
    if (glass_effect_enabled !== undefined && glass_effect_enabled !== null) {
      pushField('glass_effect_enabled', glass_effect_enabled ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nincs módosítandó adat' });
    }

    if (existing.length > 0) {
      updateValues.push(existing[0].id);
      await db.promise().execute(
        `UPDATE salon_info SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );
    } else {
      // Alapértelmezett értékekkel insert
      await db.promise().execute(
        `INSERT INTO salon_info (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
        updateValues
      );
    }

    res.json({ success: true, message: 'Design beállítások sikeresen mentve' });
  } catch (error) {
    console.error('Design beállítások mentési hiba:', error);
    res.status(500).json({ error: 'Szerver hiba a design beállítások mentésekor' });
  }
});

// Adatok exportálása
router.get('/export/:type', ensureSalonDb, async (req, res) => {
  try {
    const { type } = req.params;
    const db = await connectToSalonDatabase(req.user.salon_db_name);

    let data = [];
    let filename = '';

    switch (type) {
      case 'clients':
        const [clients] = await db.promise().execute('SELECT * FROM users');
        data = clients;
        filename = `${req.user.salon_db_name}_ugyfelek_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'appointments':
        const [appointments] = await db.promise().execute('SELECT * FROM bookings');
        data = appointments;
        filename = `${req.user.salon_db_name}_foglalasok_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      default:
        return res.status(400).json({ error: 'Érvénytelen export típus' });
    }

    // CSV konvertálás
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(field => 
        `"${String(field || '').replace(/"/g, '""')}"`
      ).join(','));
      
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.json({ message: 'Nincs exportálandó adat' });
    }
  } catch (error) {
    console.error('Export hiba:', error);
    res.status(500).json({ error: 'Szerver hiba az exportáláskor' });
  }
});

// Beállítások betöltése
router.get('/settings', ensureSalonDb, async (req, res) => {
  try {
    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const managementDb = await connectToSalonDatabase(req.user.salon_db_name + '_management');
    await ensureStaffColumns(managementDb);
    await ensureSalonInfoTable(db);
    await ensureNotificationSettingsTable(db);

    // Profil adatok
    const [profile] = await managementDb.promise().execute(
      'SELECT first_name, last_name, email, phone, profile_image FROM staff WHERE id = ?',
      [req.user.id]
    );

    // Szalon információk
    const [salonInfo] = await db.promise().execute('SELECT * FROM salon_info LIMIT 1');
    
    // Értesítési beállítások
    const [notifications] = await db.promise().execute('SELECT * FROM notification_settings LIMIT 1');

    res.json({
      profile: profile[0] || {},
      salonInfo: salonInfo[0] || {},
      notifications: notifications[0] || {}
    });
  } catch (error) {
    console.error('Beállítások betöltési hiba:', error);
    res.status(500).json({ error: 'Szerver hiba a beállítások betöltésekor' });
  }
});

module.exports = router;
