const path = require('path');

const MB = 1024 * 1024;

const ASSET_TYPES = {
  PROFILE: 'profile',
  HERO: 'hero',
  FAVICON: 'favicon',
  LOGO: 'logo',
};

const assetConfigs = {
  [ASSET_TYPES.PROFILE]: {
    directory: path.join('profiles'),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 2 * MB,
    transformations: [
      { name: '500x500', width: 500, height: 500, format: 'webp', quality: 80 },
      { name: '150x150', width: 150, height: 150, format: 'webp', quality: 70 },
      { name: '50x50', width: 50, height: 50, format: 'webp', quality: 60 },
    ],
    cropStrategy: 'cover',
  },
  [ASSET_TYPES.HERO]: {
    directory: path.join('heroes'),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * MB,
    transformations: [
      { name: '1920x1080', width: 1920, height: 1080, format: 'webp', quality: 85 },
      { name: '1024x576', width: 1024, height: 576, format: 'webp', quality: 80 },
      { name: '640x360', width: 640, height: 360, format: 'webp', quality: 75 },
    ],
    cropStrategy: 'inside',
  },
  [ASSET_TYPES.FAVICON]: {
    directory: path.join('favicons'),
    allowedMimeTypes: ['image/png', 'image/svg+xml', 'image/x-icon', 'image/webp'],
    maxSize: 1 * MB,
    transformations: [
      { name: '16x16', width: 16, height: 16, format: 'png' },
      { name: '32x32', width: 32, height: 32, format: 'png' },
      { name: '180x180', width: 180, height: 180, format: 'png' },
      { name: '512x512', width: 512, height: 512, format: 'png' },
      { name: 'ico', sizes: [16, 32, 48], format: 'ico' },
    ],
  },
  [ASSET_TYPES.LOGO]: {
    directory: path.join('logos'),
    allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
    maxSize: 3 * MB,
    transformations: [
      { name: 'standard', width: 300, height: 150, format: 'png', background: 'transparent' },
      { name: 'retina', width: 600, height: 300, format: 'png', background: 'transparent' },
    ],
    generateVariants: ['monochrome', 'white', 'dark'],
  },
};

module.exports = {
  ASSET_TYPES,
  assetConfigs,
};
