const router = require("express").Router();
const { connectToSalonDatabase } = require("../../../database/database");
const { ensureSalonDb } = require("./middleware");

// Összes nyitvatartás lekérése dátum tartományra
router.get("/opening-hours", ensureSalonDb, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log("? Opening hours betöltése:", { startDate, endDate }, req.user.salon_db_name);

    const db = await connectToSalonDatabase(req.user.salon_db_name);

    let query = "SELECT * FROM opening_hours";
    const params = [];

    if (startDate && endDate) {
      query += " WHERE date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    query += " ORDER BY date, start_time";

    const [hours] = await db.promise().execute(query, params);
    console.log(`?? Opening hours loaded: ${hours.length} slots`);
    res.json(hours);
  } catch (error) {
    console.error("? Opening hours error:", error.message);
    res.json([]);
  }
});

// Nyitvatartás lekérése konkrét dátumra
router.get("/opening-hours/:date", ensureSalonDb, async (req, res) => {
  try {
    const { date } = req.params;
    console.log("? Opening hours betöltése dátumra:", date, req.user.salon_db_name);

    const db = await connectToSalonDatabase(req.user.salon_db_name);

    const [hours] = await db
      .promise()
      .execute("SELECT * FROM opening_hours WHERE date = ? ORDER BY start_time", [date]);

    console.log(`?? Opening hours loaded for ${date}: ${hours.length} slots`);
    res.json(hours);
  } catch (error) {
    console.error("? Opening hours error:", error.message);
    res.json([]);
  }
});

// Nyitvatartás mentése
router.post("/opening-hours", ensureSalonDb, async (req, res) => {
  try {
    const { date, timeSlots } = req.body;
    console.log("Nyitvatartás mentése:", { date, timeSlots });

    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ error: "Hiányzó adatok" });
    }

    // DÁTUM FORMÁTUM KONVERTÁLÁS
    const formatDateForMySQL = (dateString) => {
      const dt = new Date(dateString);
      return dt.toISOString().split("T")[0]; // YYYY-MM-DD
    };

    const mysqlDate = formatDateForMySQL(date);
    console.log("Konvertált dátum:", mysqlDate);

    const db = await connectToSalonDatabase(req.user.salon_db_name);

    // Oszlopok felderítése (régi/új sémához is mûködjön)
    const [columns] = await db.promise().execute("SHOW COLUMNS FROM opening_hours");
    const hasDayOfWeek = columns.some((c) => c.Field === "day_of_week");
    const hasOpenTime = columns.some((c) => c.Field === "open_time");
    const hasCloseTime = columns.some((c) => c.Field === "close_time");
    const hasIsClosed = columns.some((c) => c.Field === "is_closed");
    const hasLocation = columns.some((c) => c.Field === "location");

    // Elõzõ idõsávok törlése az adott napra (és a day_of_week-re is, ha van rá unique index)
    if (hasDayOfWeek) {
      const dayOfWeek = new Date(mysqlDate).getDay();
      await db.promise().execute("DELETE FROM opening_hours WHERE date = ? OR day_of_week = ?", [mysqlDate, dayOfWeek]);
    } else {
      await db.promise().execute("DELETE FROM opening_hours WHERE date = ?", [mysqlDate]);
    }

    // Új idõsávok beszúrása (mindkét séma támogatása)
    for (const slot of timeSlots) {
      const slotDate = formatDateForMySQL(slot.date);
      const dayOfWeek = new Date(slotDate).getDay(); // 0-6

      const fields = ["date"];
      const values = [slotDate];

      if (hasDayOfWeek) {
        fields.push("day_of_week");
        values.push(dayOfWeek);
      }

      fields.push("time_slot_type");
      values.push(slot.time_slot_type);

      if (hasOpenTime) {
        fields.push("open_time");
        values.push(slot.start_time);
      }
      if (hasCloseTime) {
        fields.push("close_time");
        values.push(slot.end_time);
      }

      fields.push("start_time", "end_time");
      values.push(slot.start_time, slot.end_time);

      if (hasIsClosed) {
        fields.push("is_closed");
        values.push(0);
      }

      if (hasLocation) {
        fields.push("location");
        values.push(slot.location || "Fõszalon");
      }

      const placeholders = fields.map(() => "?").join(",");
      const sql = `INSERT INTO opening_hours (${fields.join(",")}) VALUES (${placeholders})`;
      await db.promise().execute(sql, values);
    }

    console.log("Nyitvatartás sikeresen mentve");

    res.json({ success: true, message: "Nyitvatartás sikeresen mentve" });
  } catch (error) {
    console.error("? Hiba a nyitvatartás mentésekor:", error.message);
    res.status(500).json({ error: "Szerver hiba", message: error.message });
  }
});

module.exports = router;
