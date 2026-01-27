const { assetConfigs } = require('../config/assetConfigs');

const validateAssetType = (req, res, next) => {
  const { assetType } = req.params;
  if (!assetType) {
    return res.status(400).json({ error: 'Az asset típus megadása kötelező.' });
  }

  const normalized = assetType.toLowerCase();
  const config = assetConfigs[normalized];

  if (!config) {
    return res.status(400).json({ error: `Ismeretlen asset típus: ${assetType}` });
  }

  req.assetConfig = config;
  req.assetType = normalized;
  next();
};

module.exports = validateAssetType;
