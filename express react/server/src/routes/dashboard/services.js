// server/src/routes/dashboard/services.js
const router = require('express').Router();
const { connectToSalonDatabase } = require('../../../database/database');
const { ensureSalonDb, errorHandler } = require('./middleware');

const columnExists = async (db, databaseName, table, column) => {
  const [columns] = await db.promise().execute(
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
  return columns.length > 0;
};

const tableExists = async (db, databaseName, table) => {
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
};

router.get('/services', ensureSalonDb, async (req, res) => {
  try {
    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const dbName = req.user.salon_db_name;

    if (!(await tableExists(db, dbName, 'services'))) {
      return res.json([]);
    }

    const hasPrice = await columnExists(db, dbName, 'services', 'price');
    const hasDuration = await columnExists(db, dbName, 'services', 'duration');

    const selectFields = ['service', 'time'];
    if (hasPrice) selectFields.push('price');
    if (hasDuration) selectFields.push('duration');

    const [rows] = await db
      .promise()
      .execute(`SELECT ${selectFields.join(', ')} FROM services ORDER BY service`);

    const services = rows.map((row) => ({
      service: row.service,
      duration: hasDuration ? row.duration : row.time,
      price: hasPrice ? Number(row.price ?? 0) : null,
    }));

    res.json(services);
  } catch (error) {
    console.error('Szolgáltatások lekérési hiba:', error.message);
    res.json([]);
  }
});

router.post('/services', ensureSalonDb, async (req, res) => {
  try {
    const { service, duration, price } = req.body;

    if (!service || !duration) {
      return res.status(400).json({ error: 'Hiányzó kötelező mezők' });
    }

    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const dbName = req.user.salon_db_name;

    if (!(await tableExists(db, dbName, 'services'))) {
      return res.status(400).json({ error: 'A services tábla nem elérhető' });
    }

    const hasPrice = await columnExists(db, dbName, 'services', 'price');

    const fields = ['service', 'time'];
    const placeholders = ['?', '?'];
    const values = [service, duration];

    if (hasPrice) {
      fields.push('price');
      placeholders.push('?');
      values.push(price ?? 0);
    }

    await db
      .promise()
      .execute(
        `INSERT INTO services (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );

    res.json({ success: true, message: 'Szolgáltatás sikeresen hozzáadva' });
  } catch (error) {
    errorHandler(res, error, 'Hiba a szolgáltatás hozzáadásakor');
  }
});

router.put('/services/:serviceName', ensureSalonDb, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { service, duration, price } = req.body;

    const db = await connectToSalonDatabase(req.user.salon_db_name);
    const dbName = req.user.salon_db_name;

    if (!(await tableExists(db, dbName, 'services'))) {
      return res.status(400).json({ error: 'A services tábla nem elérhető' });
    }

    const hasPrice = await columnExists(db, dbName, 'services', 'price');

    const updateFields = ['service = ?', 'time = ?'];
    const values = [service, duration];

    if (hasPrice) {
      updateFields.push('price = ?');
      values.push(price ?? 0);
    }

    values.push(serviceName);

    await db
      .promise()
      .execute(
        `UPDATE services SET ${updateFields.join(', ')} WHERE service = ?`,
        values
      );

    res.json({ success: true, message: 'Szolgáltatás sikeresen frissítve' });
  } catch (error) {
    errorHandler(res, error, 'Hiba a szolgáltatás frissítésekor');
  }
});

router.delete('/services/:serviceName', ensureSalonDb, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const db = await connectToSalonDatabase(req.user.salon_db_name);

    await db.promise().execute(`DELETE FROM services WHERE service = ?`, [serviceName]);

    res.json({ success: true, message: 'Szolgáltatás sikeresen törölve' });
  } catch (error) {
    errorHandler(res, error, 'Hiba a szolgáltatás törlésekor');
  }
});

module.exports = router;
