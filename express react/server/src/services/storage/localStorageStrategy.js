const fs = require('fs-extra');
const path = require('path');

class LocalStorageStrategy {
  constructor(rootDir = path.join(__dirname, '..', '..', '..', 'uploads')) {
    this.rootDir = rootDir;
  }

  async saveImage(buffer, relativePath) {
    const absolutePath = path.join(this.rootDir, relativePath);
    await fs.ensureDir(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, buffer);
    console.log('[asset.storage] saved file', { absolutePath });
    return absolutePath;
  }

  async deleteImage(relativePath) {
    const absolutePath = path.join(this.rootDir, relativePath);
    if (await fs.pathExists(absolutePath)) {
      await fs.remove(absolutePath);
      console.log('[asset.storage] deleted file', { absolutePath });
    }
  }

  getImageUrl(relativePath) {
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }
}

module.exports = LocalStorageStrategy;
