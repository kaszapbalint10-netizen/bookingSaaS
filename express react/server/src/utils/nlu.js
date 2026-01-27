// server/src/utils/nlu.js

// ékezet-függetlenítés
function norm(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove diacritics
}

// kategória detektálás a felhasználói üzenetből
function detectCategoryFromText(text = '') {
  const t = norm(text);

  // economy
  if (/\beconomy\b/.test(t)) return 'economy';
  if (/\beco\b/.test(t)) return 'economy';
  if (/(olcso|takarek|varos|varosi|kicsi|mini)/.test(t)) return 'economy';
  if (/(fiat 500|yaris|aygo|picanto|i10)/.test(t)) return 'economy';

  // compact
  if (/\bcompact\b/.test(t)) return 'compact';
  if (/(kompakt|kozep(?!(?:-| )?meret)|golf|focus|astra|ceed)/.test(t)) return 'compact';

  // mid-size
  if (/(mid(?:-| )?size|midsize)/.test(t)) return 'mid-size';
  if (/(kozep(?:-| )?meret|kozepmeret|nagyobb mint kompakt|premium)/.test(t)) return 'mid-size';
  if (/(octavia|a4|3-as bmw|bmw 3|passat|mazda 6)/.test(t)) return 'mid-size';

  // suv
  if (/\bsuv\b/.test(t)) return 'suv';
  if (/(terep|magas ules|csalad|nagy csomagter)/.test(t)) return 'suv';
  if (/(x3|q5|kodiaq|glc|tiguan|sportage|rav4)/.test(t)) return 'suv';

  return null;
}

// meglévő érték normalizálása (pl. "mid size" → "mid-size")
function normalizeServiceValue(val) {
  const t = norm(val);
  if (!t) return null;
  if (/\beconomy\b|^eco$/.test(t)) return 'economy';
  if (/\bcompact\b|kompakt|kozep(?!(?:-| )?meret)/.test(t)) return 'compact';
  if (/(mid(?:-| )?size|kozep(?:-| )?meret|midsize|premium)/.test(t)) return 'mid-size';
  if (/\bsuv\b|terep|csalad/.test(t)) return 'suv';
  return null;
}

/**
 * Enrich/normalize NLU:
 * - ha entities.service hiányzik → próbáljuk detektálni a user üzenetből
 * - ha entities.service van, de variáns (pl. "mid size") → normalizáljuk "mid-size"-ra
 */
function enrichNLU(nlu = {}, userMessage = '') {
  const out = { ...nlu, entities: { ...(nlu.entities || {}) } };

  // 1) ha van service, normalizáljuk
  if (out.entities.service) {
    const fixed = normalizeServiceValue(out.entities.service);
    if (fixed) out.entities.service = fixed;
  }

  // 2) ha nincs service, próbáljuk a user üzenetből kivenni
  if (!out.entities.service) {
    const detected = detectCategoryFromText(userMessage);
    if (detected) out.entities.service = detected;
  }

  return out;
}

module.exports = { enrichNLU, detectCategoryFromText, normalizeServiceValue };
