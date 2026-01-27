const router = require('express').Router();
const { listAgents } = require('../utils/agents');

router.get('/health', (_req, res) => {
  const agents = listAgents().map(a => a.type);
  res.json({
    status: 'OK',
    service: 'Multi-Assistant API',
    timestamp: new Date().toISOString(),
    active_assistants: agents
  });
});

module.exports = router;
