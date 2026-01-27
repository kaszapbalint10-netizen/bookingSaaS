const express = require('express');
const { connectToDatabase } = require('../../database/database');

const router = express.Router();

const safeParseJSON = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Nyitvatartás lekérése a szalon saját opening_hours táblájából
const fetchOpenHours = async (slug) => {
  const dbName = slug?.startsWith("salon_") ? slug : `salon_${slug}`;
  try {
    const db = await connectToDatabase(dbName);
    const [rows] = await db.promise().query(
      `SELECT date, time_slot_type, start_time, end_time
         FROM opening_hours
         ORDER BY date ASC, time_slot_type ASC`
    );
    if (!rows.length) return null;

    const map = {};
    rows.forEach((row) => {
      const dayKey = row.date && typeof row.date.toISOString === 'function'
        ? row.date.toISOString().slice(0, 10)
        : String(row.date);
      if (row.time_slot_type === 'OPEN') {
        map[dayKey] = `${(row.start_time || '').toString().slice(0, 5)} - ${(row.end_time || '').toString().slice(0, 5)}`;
      } else if (row.time_slot_type === 'BREAK') {
        const existing = map[dayKey] ? `${map[dayKey]} ` : '';
        map[dayKey] = `${existing}(Szünet: ${(row.start_time || '').toString().slice(0, 5)}-${(row.end_time || '').toString().slice(0, 5)})`;
      }
    });
    return map;
  } catch (_err) {
    return null;
  }
};
// Szalon saját adatbázisából (pl. salon_test) próbáljuk kiolvasni a salon_info táblát
const fetchSalonInfo = async (slug) => {
  const dbName = slug?.startsWith('salon_') ? slug : `salon_${slug}`;
  try {
    const db = await connectToDatabase(dbName);
    const [rows] = await db.promise().query(
      `SELECT *
         FROM salon_info
         ORDER BY id ASC
         LIMIT 1`
    );
    if (!rows.length) return null;
    const info = rows[0];
    return {
      name: info.salon_name || null,
      description: info.description || null,
      address: info.address_street || null,
      city: info.address_city || null,
      district: info.address_zip || null,
      phone: info.phone || null,
      email: info.email || null,
      website: info.website || null,
      heroImage: info.hero_image_url || null,
      thumbnailImage: info.logo_url || null,
      primaryColor: info.primary_color || null,
      secondaryColor: info.secondary_color || null,
      gradientStart: info.gradient_start_color || null,
      gradientEnd: info.gradient_end_color || null,
      backgroundColor: info.background_color || null,
      fontFamily: info.font_family || null,
    };
  } catch (err) {
    return null;
  }
};

router.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase('salon_browser');
    const [rows] = await db.promise().query(
      `SELECT 
        id, name, slug, tagline, description,
        city, district, address, latitude, longitude,
        phone, email, website, category, price_range,
        rating, review_count, services, amenities,
        hero_image, thumbnail_image, primary_color, secondary_color,
        is_open, staff_count, open_hours
      FROM salons
      ORDER BY rating DESC, review_count DESC`
    );

    const normalized = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      tagline: row.tagline,
      description: row.description,
      city: row.city,
      district: row.district,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: row.phone,
      email: row.email,
      website: row.website,
      category: row.category,
      priceRange: row.price_range,
      rating: Number(row.rating),
      reviews: row.review_count,
      services: safeParseJSON(row.services, []),
      amenities: safeParseJSON(row.amenities, []),
      heroImage: row.hero_image,
      thumbnailImage: row.thumbnail_image,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      isOpen: !!row.is_open,
      staffCount: row.staff_count,
      openHours: openHoursFromDb || safeParseJSON(row.open_hours, {}),
    }));

    res.json({ salons: normalized });
  } catch (error) {
    console.error('Salon browser fetch error:', error);
    res.status(500).json({ error: 'Nem sikerült betölteni a szalon adatokat.' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = await connectToDatabase('salon_browser');
    const [rows] = await db.promise().query(
      `SELECT * FROM salons WHERE slug = ? LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Szalon nem található.' });
    }

    const row = rows[0];
    const info = await fetchSalonInfo(slug);
    const openHoursFromDb = await fetchOpenHours(slug);

    const salon = {
      id: row.id,
      name: info?.name || row.name,
      slug: row.slug,
      tagline: row.tagline,
      description: info?.description || row.description,
      city: info?.city || row.city,
      district: info?.district || row.district,
      address: info?.address || row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: info?.phone || row.phone,
      email: info?.email || row.email,
      website: info?.website || row.website,
      category: row.category,
      priceRange: row.price_range,
      rating: Number(row.rating),
      reviews: row.review_count,
      services: safeParseJSON(row.services, []),
      amenities: safeParseJSON(row.amenities, []),
      heroImage: info?.heroImage || row.hero_image,
      thumbnailImage: info?.thumbnailImage || row.thumbnail_image,
      primaryColor: info?.primaryColor || row.primary_color,
      secondaryColor: info?.secondaryColor || row.secondary_color,
      gradientStart: info?.gradientStart || null,
      gradientEnd: info?.gradientEnd || null,
      backgroundColor: info?.backgroundColor || null,
      fontFamily: info?.fontFamily || null,
      isOpen: !!row.is_open,
      staffCount: row.staff_count,
      openHours: openHoursFromDb || safeParseJSON(row.open_hours, {}),
      createdAt: row.created_at,
    };

    res.json({ salon });
  } catch (error) {
    console.error('Salon detail fetch error:', error);
    res.status(500).json({ error: 'Nem sikerült betölteni a szalon adatait.' });
  }
});

module.exports = router;


