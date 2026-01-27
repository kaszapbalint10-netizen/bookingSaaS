// server/src/routes/assistants.js
const router = require('express').Router();
const { loadAgent, listAgents } = require('../utils/agents');
const { generateJSON } = require('../utils/ai');

// ——— Meta ————————————————————————————————————————————————————————————————
router.get('/assistants', (_req, res) => {
  res.json(listAgents());
});

router.get('/assistants/:type', (req, res) => {
  const agent = loadAgent(req.params.type);
  if (!agent || !agent.is_active) return res.status(404).json({ error: 'Asszisztens nem található' });
  res.json({
    type: req.params.type,
    name: agent.name,
    description: agent.description,
    features: agent.features,
    quick_actions: agent.quick_actions
  });
});

router.get('/assistants/:type/pricing', (req, res) => {
  const agent = loadAgent(req.params.type);
  if (!agent?.pricing) return res.status(404).json({ error: 'Árazás nem található' });
  res.json(agent.pricing);
});

router.get('/assistants/:type/data', (req, res) => {
  const agent = loadAgent(req.params.type);
  if (!agent?.data) return res.status(404).json({ error: 'Adatok nem találhatók' });
  res.json(agent.data);
});

// ——— Chat ————————————————————————————————————————————————————————————————
router.post('/assistants/:type/chat', async (req, res) => {
  try {
    const { type } = req.params;
    const { message, conversation_history = [] } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: 'Üzenet szükséges' });

    const agent = loadAgent(type);
    if (!agent || !agent.is_active) return res.status(404).json({ error: 'Asszisztens nem található' });

    // A promptban már benne van: pricing + data + workflow + szigorú JSON séma
    const nlu = await generateJSON(agent.system_prompt, message, conversation_history);

    // A megjelenítendő szöveget maga a modell adja meg (reply_markdown),
    // így a szerver nem "okoskodik", csak közvetít.
    const reply = nlu.reply_markdown || nlu.clarifications?.[0] || "Miben segíthetek? 😊";

    // Kliens szabadon dönthet: a reply-t mutatja, a state/next_step-et eltárolja
    return res.json({
      reply,
      intent: nlu.intent,
      next_step: nlu.next_step,
      entities: nlu.entities,
      quote: nlu.quote || null,         // ha a modell kalkulált
      clarifications: nlu.clarifications || [],
      assistant: { name: agent.name, type, quick_actions: agent.quick_actions },
      raw: nlu
    });

  } catch (err) {
    console.error('❌ Chat hiba:', err);
    res.status(500).json({ error: 'Technikai hiba', details: err.message });
  }
});

module.exports = router;
