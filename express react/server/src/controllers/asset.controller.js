const AssetWorkflowService = require('../services/assetWorkflow.service');

const workflowService = new AssetWorkflowService();

const formatFileMeta = (file) => ({
  fieldname: file?.fieldname,
  originalname: file?.originalname,
  mimetype: file?.mimetype,
  size: file?.size,
});

exports.uploadAsset = async (req, res, next) => {
  try {
    console.log('[asset.upload] incoming request', {
      params: req.params,
      bodyKeys: Object.keys(req.body || {}),
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Hiányzik a feltöltött fájl.' });
    }

    const { assetType } = req;
    const entityId =
      req.body.userId ||
      req.body.salonId ||
      req.body.pageId ||
      req.body.companyId ||
      'public';

    console.log('[asset.upload] metadata', {
      assetType,
      entityId,
      file: formatFileMeta(req.file),
    });

    const response = await workflowService.handleUpload({
      assetType,
      entityId,
      file: req.file,
    });

    console.log('[asset.upload] completed', {
      assetType,
      entityId,
      success: response?.success,
      warnings: response?.warnings,
      urls: {
        original: response?.asset?.originalUrl,
        variants: response?.asset?.variants?.map((v) => v.url),
      },
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Asset upload error:', error);
    next(error);
  }
};
