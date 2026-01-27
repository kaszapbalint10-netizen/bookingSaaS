const express = require('express');
const upload = require('../middleware/upload.middleware');
const validateAssetType = require('../middleware/assetValidation.middleware');
const assetController = require('../controllers/asset.controller');

const router = express.Router();

router.post(
  '/upload/:assetType',
  validateAssetType,
  upload.single('image'),
  assetController.uploadAsset
);

module.exports = router;
