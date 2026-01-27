const router = require('express').Router();
const { connectToDatabase } = require('../../../database/database');
const { ensureSalonDb, errorHandler } = require('./middleware');

const getManagementDbName = (salonDbName = '') =>
  salonDbName.endsWith('_management') ? salonDbName : `${salonDbName}_management`;

const ensureResourceTable = async (db) => {
  await db
    .promise()
    .execute(
      `CREATE TABLE IF NOT EXISTS resource (
         id BIGINT PRIMARY KEY AUTO_INCREMENT,
         custom_id VARCHAR(50) NOT NULL UNIQUE,
         type VARCHAR(50) NOT NULL,
         description TEXT NULL
       )`
    );
};

router.get('/resources', ensureSalonDb, async (req, res) => {
  try {
    const managementDbName = getManagementDbName(req.user.salon_db_name);
    const db = await connectToDatabase(managementDbName);
    await ensureResourceTable(db);

    const [rows] = await db.promise().execute(`SELECT id, custom_id, type, description FROM resource ORDER BY id DESC`);
    res.json(rows);
  } catch (error) {
    errorHandler(res, error, 'Hiba a resource lista lekérésénél');
  }
});

router.post('/resources', ensureSalonDb, async (req, res) => {
  try {
    const { custom_id, type, description } = req.body;
    if (!custom_id || !type) {
      return res.status(400).json({ error: 'custom_id és type kötelező' });
    }

    const managementDbName = getManagementDbName(req.user.salon_db_name);
    const db = await connectToDatabase(managementDbName);
    await ensureResourceTable(db);

    await db
      .promise()
      .execute(
        `INSERT INTO resource (custom_id, type, description) VALUES (?, ?, ?)`,
        [custom_id, type, description || null]
      );

    res.json({ success: true });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'custom_id már létezik' });
    }
    errorHandler(res, error, 'Hiba a resource mentésénél');
  }
});

module.exports = router;
