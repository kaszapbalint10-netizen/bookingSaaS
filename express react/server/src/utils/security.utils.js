const { fileTypeFromBuffer } = require('file-type');
const sharp = require('sharp');
const crypto = require('crypto');

const magicNumberValidation = async (buffer) => {
  const type = await fileTypeFromBuffer(buffer);
  return type?.mime || null;
};

const mimeTypeConsistency = (detectedMime, allowed) => {
  if (!detectedMime) return false;
  return allowed.includes(detectedMime);
};

const dimensionLimits = async (buffer, { maxWidth, maxHeight }) => {
  if (!maxWidth && !maxHeight) return true;
  const metadata = await sharp(buffer).metadata();
  if (maxWidth && metadata.width > maxWidth) return false;
  if (maxHeight && metadata.height > maxHeight) return false;
  return true;
};

const virusScanSimulation = async (buffer) => {
  // Szimulált víruskeresés: keresünk ismert rosszindulatú aláírásokat
  const signatures = [
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!',
    '<script>',
    'DROP TABLE',
  ];

  const ascii = buffer.toString('utf8');
  if (signatures.some((sig) => ascii.includes(sig))) {
    throw new Error('A fájl potenciálisan rosszindulatú tartalmat tartalmaz.');
  }

  // Hash alapú pszeudo-szűrés: ha hash vége "bad", tekintsük gyanúsnak
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (hash.endsWith('bad')) {
    throw new Error('A fájl hash-e gyanús mintát tartalmaz.');
  }

  return true;
};

module.exports = {
  magicNumberValidation,
  mimeTypeConsistency,
  dimensionLimits,
  virusScanSimulation,
};
