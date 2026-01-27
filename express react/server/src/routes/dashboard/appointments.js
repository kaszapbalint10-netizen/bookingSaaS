// server/src/routes/dashboard/appointments.js
const router = require('express').Router();
const { ensureSalonDb, errorHandler } = require('./middleware');
const { connectToSalonDatabase } = require('../../../database/database');

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

router.get('/appointments', ensureSalonDb, async (req, res) => {
  try {
    const db = await connectToSalonDatabase(req.user.salon_db_name);

    // Detect available user table (registered_users vs users)
    const [tableRows] = await db
      .promise()
      .execute(
        `SELECT TABLE_NAME 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ? 
           AND TABLE_NAME IN ('registered_users','users')`,
        [req.user.salon_db_name]
      );

    const hasRegisteredUsers = tableRows.some((t) => t.TABLE_NAME === 'registered_users');
    const hasUsers = tableRows.some((t) => t.TABLE_NAME === 'users');

    let joinClause = '';
    let nameSelect = 'NULL as full_name';
    let nameTable = null;

    if (hasRegisteredUsers) {
      joinClause = 'LEFT JOIN registered_users ru ON ru.id = b.customer_id';
      nameTable = 'registered_users';
    } else if (hasUsers) {
      joinClause = 'LEFT JOIN users ru ON ru.id = b.customer_id';
      nameTable = 'users';
    }

    if (nameTable) {
      const [columns] = await db
        .promise()
        .execute(
          `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [req.user.salon_db_name, nameTable]
        );
      const colSet = new Set(columns.map((c) => c.COLUMN_NAME));
      if (colSet.has('first_name') && colSet.has('last_name')) {
        nameSelect = "CONCAT_WS(' ', ru.first_name, ru.last_name) AS full_name";
      } else if (colSet.has('nev')) {
        nameSelect = 'ru.nev AS full_name';
      } else {
        nameSelect = 'NULL as full_name';
      }
    }

    const [appointments] = await db.promise().execute(
      `SELECT b.customer_id,
              b.stylist_id,
              b.service,
              b.duration,
              b.booking_date,
              b.status,
              b.price,
              b.notes,
              b.created_at,
              ${nameSelect}
       FROM bookings b
       ${joinClause}
       WHERE b.booking_date >= NOW()
       ORDER BY b.booking_date ASC
       LIMIT 10`
    );

    const formatted = appointments.map((appointment) => {
      const fullName = appointment.full_name ? String(appointment.full_name).trim() : '';
      return {
        customer_id: appointment.customer_id,
        stylist_id: appointment.stylist_id,
        service: appointment.service,
        duration: appointment.duration,
        time: formatTime(appointment.booking_date),
        date: appointment.booking_date,
        status: appointment.status,
        price: appointment.price,
        notes: appointment.notes,
        created_at: appointment.created_at,
        customer_name: fullName || null,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Időpontok lekérési hiba:', error);
    errorHandler(res, error, 'Hiba az időpontok betöltésekor');
  }
});

router.post('/appointments', ensureSalonDb, async (req, res) => {
  try {
    const {
      customer_id,
      stylist_id,
      service,
      duration,
      booking_date,
      price,
      notes,
    } = req.body;

    if (!customer_id || !stylist_id || !service || !duration || !booking_date) {
      return res.status(400).json({ error: 'Hiányzó kötelező mezők' });
    }

    const db = await connectToSalonDatabase(req.user.salon_db_name);

    await db.promise().execute(
      `INSERT INTO bookings
        (customer_id, stylist_id, service, duration, booking_date, price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, stylist_id, service, duration, booking_date, price ?? null, notes ?? null]
    );

    res.json({ success: true, message: 'Időpont sikeresen létrehozva' });
  } catch (error) {
    errorHandler(res, error, 'Hiba az időpont létrehozásakor');
  }
});

router.delete('/appointments/:customer_id/:booking_date', ensureSalonDb, async (req, res) => {
  try {
    const { customer_id, booking_date } = req.params;
    const db = await connectToSalonDatabase(req.user.salon_db_name);

    await db
      .promise()
      .execute(`DELETE FROM bookings WHERE customer_id = ? AND booking_date = ?`, [
        customer_id,
        booking_date,
      ]);

    res.json({ success: true, message: 'Időpont sikeresen törölve' });
  } catch (error) {
    errorHandler(res, error, 'Hiba az időpont törlésekor');
  }
});

module.exports = router;
