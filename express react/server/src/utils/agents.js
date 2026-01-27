// server/src/utils/agents.js
const fs = require('fs');
const path = require('path');

// A gyökér config mappa: server/config
const CONFIG_ROOT = path.join(__dirname, '..', '..', 'config');

function safeRead(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const txt = fs.readFileSync(p, 'utf8');
    return txt?.trim() ? txt : null;
  } catch {
    return null;
  }
}

function loadAgent(type) {
  const dir = path.join(CONFIG_ROOT, type); // pl. server/config/car-rental
  const assistantPath = path.join(dir, 'assistant.json');
  const assistantRaw = safeRead(assistantPath);
  if (!assistantRaw) return null;

  const cfg = JSON.parse(assistantRaw);

  // pricing + data
  const pricingPath = path.join(dir, cfg.pricing_file || 'pricing.json');
  const dataPath = path.join(dir, cfg.data_file || 'data.json');
  const pricingJSON = safeRead(pricingPath) || '{}';
  const dataJSON = safeRead(dataPath) || '{}';

  // prompt + helyettesítés
  const promptPath = path.join(dir, cfg.prompt_file || 'prompt.hu.txt');
  let prompt = safeRead(promptPath) || '';
  prompt = prompt
    .replace('{{PRICING_JSON}}', pricingJSON)
    .replace('{{CATALOG_JSON}}', dataJSON);

  cfg.system_prompt = prompt;
  cfg.pricing = JSON.parse(pricingJSON);
  cfg.data = JSON.parse(dataJSON);
  cfg.assets_base = `/images/${type}/${cfg.assets_dir || 'images'}`;

  return cfg;
}

function listAgents() {
  if (!fs.existsSync(CONFIG_ROOT)) return [];
  return fs.readdirSync(CONFIG_ROOT)
    .filter(name => fs.existsSync(path.join(CONFIG_ROOT, name, 'assistant.json')))
    .map(type => {
      const a = loadAgent(type);
      return a?.is_active ? {
        type,
        name: a.name,
        description: a.description,
        features: a.features,
        quick_actions: a.quick_actions
      } : null;
    })
    .filter(Boolean);
}

module.exports = { loadAgent, listAgents };
