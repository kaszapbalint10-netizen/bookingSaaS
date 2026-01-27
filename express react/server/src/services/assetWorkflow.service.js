const path = require('path');
const sharp = require('sharp');
const { assetConfigs } = require('../config/assetConfigs');
const {
  magicNumberValidation,
  mimeTypeConsistency,
  virusScanSimulation,
} = require('../utils/security.utils');
const { buildFilename } = require('../utils/filenameGenerator');
const LocalStorageStrategy = require('./storage/localStorageStrategy');
const ImageProcessingService = require('./imageProcessing.service');

class AssetWorkflowService {
  constructor(storageStrategy = new LocalStorageStrategy()) {
    this.storage = storageStrategy;
    this.imageProcessor = new ImageProcessingService();
  }

  async handleUpload({ assetType, entityId, file }) {
    const config = assetConfigs[assetType];
    if (!config) {
      throw new Error(`Ismeretlen asset típus: ${assetType}`);
    }

    console.log('[asset.workflow] handleUpload start', {
      assetType,
      entityId,
      allowedFormats: config.allowedMimeTypes,
    });

    await this.validateFile(file, config);

    const safeEntity = entityId?.toString().trim() || 'public';
    const baseFilename = buildFilename(`${assetType}-${safeEntity}`, file.originalname);
    const originalRelativePath = path.join(config.directory, safeEntity, 'original', baseFilename);
    await this.storage.saveImage(file.buffer, originalRelativePath);

    console.log('[asset.workflow] original saved', { originalRelativePath });

    const processingResult = await this.imageProcessor.process(assetType, file.buffer, config);
    const variantResults = await this.storeVariants(config, safeEntity, processingResult.variants);

    const response = {
      success: true,
      asset: {
        type: assetType.toLowerCase(),
        originalUrl: this.storage.getImageUrl(originalRelativePath),
        variants: variantResults,
        metadata: {
          size: file.size,
          mimeType: file.mimetype,
          originalFilename: file.originalname,
          processedAt: new Date().toISOString(),
        },
      },
      warnings: processingResult.warnings,
    };

    return response;
  }

  async validateFile(file, config) {
    if (!file) {
      throw new Error('Nincs feltöltött fájl.');
    }

    if (file.size > config.maxSize) {
      throw new Error(
        `A fájl mérete meghaladja a megengedett limitet (${Math.round(config.maxSize / (1024 * 1024))}MB).`
      );
    }

    const detectedMime = await magicNumberValidation(file.buffer);
    if (!mimeTypeConsistency(detectedMime, config.allowedMimeTypes)) {
      throw new Error(`Nem támogatott fájlformátum: ${detectedMime || file.mimetype}`);
    }

     await virusScanSimulation(file.buffer);
  }

  async storeVariants(config, entityId, variants = []) {
    const variantEntries = [];

    for (const variant of variants) {
      console.log('[asset.workflow] storing variant', {
        entityId,
        variant: variant.name,
        targetExtension: variant.extension,
      });

      const filename = buildFilename(`${config.directory}-${entityId}-${variant.name}`, `.${variant.extension}`);
      const relativePath = path.join(config.directory, entityId, variant.name, filename);
      await this.storage.saveImage(variant.buffer, relativePath);

      variantEntries.push({
        name: variant.name,
        url: this.storage.getImageUrl(relativePath),
        info: variant.info,
      });
    }

    return variantEntries;
  }
}

module.exports = AssetWorkflowService;
