function fmtHUF(n) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft';
}

function formatBookingReply(agentType, nlu, price) {
  const e = nlu.entities || {};
  const lines = [];
  lines.push('**Foglalási összefoglaló**', '');

  const rows = [
    e.carModel ? `**Autó**: ${e.carModel}` :
    e.service  ? `**Kategória**: ${String(e.service).toUpperCase()}` : null,
    (e.date && e.dateEnd) ? `**Időtartam**: ${e.date} → ${e.dateEnd} (${e.days ?? "?"} nap)` :
    (e.date ? `**Dátum**: ${e.date}` : null),
    e.pickupLocation ? `**Átvétel**: ${e.pickupLocation}` : null,
    e.returnLocation ? `**Leadás**: ${e.returnLocation}` : null,
    (price != null) ? `**Becsült ár**: ${fmtHUF(price)}` : null
  ].filter(Boolean);

  if (rows.length) lines.push(rows.map(s => `• ${s}`).join('\n'));
  lines.push('', '**Következő lépés**');

  if (nlu.clarifications?.length) lines.push(`– ${nlu.clarifications[0]}`);
  else lines.push('– Megerősíted a fenti adatokat? Írd: **Megerősítem**.');

  return lines.join('\n');
}

function listCarCategories(pricing, data) {
  if (!pricing?.categories) {
    return '**Elérhető kategóriák**\n\n• Economy\n• Compact\n• Mid-size\n• SUV\n\nVálassz kategóriát (pl. **Economy**).';
  }

  const lines = ['**Elérhető kategóriák**', ''];
  const map = pricing.categories;
  const counts = {
    economy: (data?.economy?.length || 0),
    compact: (data?.compact?.length || 0),
    'mid-size': (data?.['mid-size']?.length || 0),
    suv: (data?.suv?.length || 0)
  };

  const order = ['economy', 'compact', 'mid-size', 'suv'];
  order.forEach(key => {
    if (!map[key]) return;
    const price = new Intl.NumberFormat('hu-HU').format(map[key].base_price) + ' Ft/nap';
    const cnt = counts[key] || 0;
    const label = key === 'mid-size' ? 'Mid-size' : key.charAt(0).toUpperCase() + key.slice(1);
    lines.push(`• **${label}** — ${price} (${cnt} autó)`);
  });

  lines.push('', 'Válassz kategóriát (pl. **Economy**), vagy kérj ajánlást.');
  return lines.join('\n');
}

function listCategoryModels(categoryKey, data) {
  const models = (data?.[categoryKey] || []).map(c => `${c.brand} ${c.model}`);
  if (!models.length) return null;
  return models.slice(0, 3).join(', ') + (models.length > 3 ? '…' : '');
}

function recommendCar(pricing, data, hint) {
  // hint: pl. 'város', 'család', 'hosszú út', 'olcsó', 'prémium', stb. (egyszerű szabályokkal kezeljük)
  const lines = ['**Ajánlat**', ''];

  // egyszerű kulcsszó → kategória
  const h = (hint || '').toLowerCase();
  let pick = 'economy';
  if (/család|gyerek|csomag|tér|kombi|kirándul|hegy|terep/.test(h)) pick = 'suv';
  else if (/hosszú|autópálya|kényel|prémium|üzleti/.test(h)) pick = 'mid-size';
  else if (/közép|biztonság|kényelmes/.test(h)) pick = 'compact';
  else if (/olcs|város|parkol|takarék/.test(h)) pick = 'economy';

  const orderLabel = (k) => k === 'mid-size' ? 'Mid-size' : k.charAt(0).toUpperCase() + k.slice(1);
  const price = pricing?.categories?.[pick]?.base_price;
  const models = listCategoryModels(pick, data);

  lines.push(`• **Kategória**: ${orderLabel(pick)}${price ? ` — ${new Intl.NumberFormat('hu-HU').format(price)} Ft/nap` : ''}`);
  if (models) lines.push(`• **Példák**: ${models}`);

  // rövid indoklás
  const reasons = {
    economy: 'Városba, alacsony fogyasztás, könnyű parkolás.',
    compact: 'Kiegyensúlyozott méret, kényelmes utazás 4–5 főnek.',
    'mid-size': 'Hosszú utakra kényelmes, prémium érzet, erősebb motor.',
    suv: 'Magas ülés, nagy csomagtér, családi utazásokra ideális.'
  };
  lines.push(`• **Miért?** ${reasons[pick]}`);

  lines.push('', '**Következő lépés**', '– Mettől meddig bérelnéd? (pl. 2025-10-23 → 2025-10-30)');
  return lines.join('\n');
}

module.exports = { formatBookingReply, listCarCategories, recommendCar, listCategoryModels };



