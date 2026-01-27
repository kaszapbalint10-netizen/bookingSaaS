const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs-extra');

class ImageProcessingService {
  async process(assetType, buffer, config) {
    const normalized = assetType.toUpperCase();
    switch (normalized) {
      case 'PROFILE':
        return this.processProfile(buffer, config);
      case 'HERO':
        return this.processHero(buffer, config);
      case 'FAVICON':
        return this.processFavicon(buffer, config);
      case 'LOGO':
        return this.processLogo(buffer, config);
      default:
        return { variants: [], warnings: ['Ismeretlen feldolgozási típus'] };
    }
  }

  async processProfile(buffer, config) {
    const variants = [];
    for (const transform of config.transformations) {
      const processed = await sharp(buffer)
        .rotate()
        .resize(transform.width, transform.height, { fit: 'cover', position: 'attention' })
        .toFormat(transform.format, { quality: transform.quality })
        .withMetadata({ orientation: null })
        .toBuffer({ resolveWithObject: true });

      variants.push({
        name: transform.name,
        buffer: processed.data,
        extension: transform.format,
        info: processed.info,
      });
    }
    return { variants };
  }

  async processHero(buffer, config) {
    const variants = [];
    for (const transform of config.transformations) {
      const processed = await sharp(buffer)
        .rotate()
        .resize(transform.width, transform.height, {
          fit: 'cover',
          position: sharp.strategy.attention,
        })
        .toFormat(transform.format, { quality: transform.quality })
        .toBuffer({ resolveWithObject: true });

      variants.push({
        name: transform.name,
        buffer: processed.data,
        extension: transform.format,
        info: processed.info,
      });
    }
    return { variants };
  }

  async processFavicon(buffer, config) {
    const variants = [];
    const base = await sharp(buffer)
      .rotate()
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    const pngVariants = [];

    for (const transform of config.transformations) {
      if (transform.format === 'ico') continue;
      const processed = await sharp(base)
        .resize(transform.width, transform.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toBuffer({ resolveWithObject: true });

      variants.push({
        name: transform.name,
        buffer: processed.data,
        extension: 'png',
        info: processed.info,
      });

      pngVariants.push(processed.data);
    }

    const icoConfig = config.transformations.find((t) => t.format === 'ico');
    if (icoConfig) {
      const icoBuffer = await pngToIco(pngVariants);
      variants.push({
        name: 'favicon-ico',
        buffer: icoBuffer,
        extension: 'ico',
        info: { format: 'ico' },
      });
    }

    const manifest = this.buildPwaManifest(variants);
    variants.push({
      name: 'manifest',
      buffer: Buffer.from(JSON.stringify(manifest, null, 2)),
      extension: 'json',
      info: { format: 'json' },
    });

    return { variants };
  }

  buildPwaManifest(variantList) {
    const icons = variantList
      .filter((variant) => variant.extension === 'png' && variant.info?.width)
      .map((variant) => ({
        src: variant.name,
        sizes: `${variant.info.width}x${variant.info.height}`,
        type: 'image/png',
      }));

    return {
      name: 'Salon App',
      short_name: 'Salon',
      icons,
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
    };
  }

  async processLogo(buffer, config) {
    const variants = [];

    for (const transform of config.transformations) {
      const processed = await sharp(buffer)
        .rotate()
        .resize(transform.width, transform.height, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFormat(transform.format, { quality: 90 })
        .toBuffer({ resolveWithObject: true });

      variants.push({
        name: `${transform.name}`,
        buffer: processed.data,
        extension: transform.format,
        info: processed.info,
      });
    }

    const monochrome = await sharp(buffer)
      .rotate()
      .resize(400, 400, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toColourspace('b-w')
      .png()
      .toBuffer({ resolveWithObject: true });

    variants.push({
      name: 'monochrome',
      buffer: monochrome.data,
      extension: 'png',
      info: monochrome.info,
    });

    return { variants };
  }
}

module.exports = ImageProcessingService;
