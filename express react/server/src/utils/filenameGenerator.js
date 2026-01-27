const { v4: uuid } = require('uuid');

const sanitize = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const buildFilename = (prefix, originalName = '', extension = '') => {
  const safePrefix = sanitize(prefix) || 'asset';
  const baseName = sanitize(originalName.split('.').slice(0, -1).join('.')) || 'image';
  const uniqueId = uuid();
  const ext = extension ? extension.replace(/^\./, '') : originalName.split('.').pop();
  return `${safePrefix}-${baseName}-${uniqueId}.${ext || 'bin'}`;
};

module.exports = {
  buildFilename,
};
